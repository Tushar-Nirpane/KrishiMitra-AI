import os
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from .database import engine, Base, get_db
from . import models, schemas
from .services.crop_engine import crop_engine
from .services.weather_service import get_weather_data
from .services.disease_service import diagnose_leaf_image
from .services.voice_llm_service import get_agricultural_reasoning

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KrishiMitra AI Backend",
    description="Multilingual Agricultural Intelligence Engine API",
    version="1.0.0"
)

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Welcome to KrishiMitra AI Agricultural Engine"}

# Farmer endpoints
@app.post("/farmers", response_model=schemas.FarmerResponse)
def create_farmer(farmer: schemas.FarmerCreate, db: Session = Depends(get_db)):
    # Check if phone already registered
    db_farmer = db.query(models.Farmer).filter(models.Farmer.phone == farmer.phone).first()
    if db_farmer:
        return db_farmer
    
    new_farmer = models.Farmer(
        name=farmer.name,
        phone=farmer.phone,
        language_preference=farmer.language_preference,
        latitude=farmer.latitude,
        longitude=farmer.longitude
    )
    db.add(new_farmer)
    db.commit()
    db.refresh(new_farmer)
    return new_farmer

@app.get("/farmers/{farmer_id}", response_model=schemas.FarmerResponse)
def get_farmer(farmer_id: int, db: Session = Depends(get_db)):
    farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer

# Farm endpoints
@app.post("/farms", response_model=schemas.FarmResponse)
def create_farm(farm: schemas.FarmCreate, db: Session = Depends(get_db)):
    # Create farm and set up initial crop log
    new_farm = models.Farm(
        farmer_id=farm.farmer_id,
        nitrogen=farm.nitrogen,
        phosphorus=farm.phosphorus,
        potassium=farm.potassium,
        ph=farm.ph,
        organic_carbon=farm.organic_carbon,
        acreage=farm.acreage
    )
    db.add(new_farm)
    db.commit()
    db.refresh(new_farm)
    
    # Log initial empty crop
    log = models.CropLog(
        farm_id=new_farm.id,
        current_crop="Cotton",  # Default starting crop
        sowing_date=datetime.date.today() - datetime.timedelta(days=45),
        health_score=85.0
    )
    db.add(log)
    db.commit()
    
    return new_farm

@app.get("/farms/{farm_id}", response_model=schemas.FarmResponse)
def get_farm(farm_id: int, db: Session = Depends(get_db)):
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm

# Crop Recommendation Endpoint
@app.post("/recommend", response_model=schemas.CropRecommendationResponse)
def recommend_crop(request: schemas.CropRecommendationRequest):
    # Fetch weather data for the location
    weather = get_weather_data(request.latitude, request.longitude)
    temp = weather["current_temp"]
    # If openweather is offline or dry, use sum of rain or default
    rain = weather["7_day_rainfall_sum"] * 30.0  # scale to monthly equivalent rain
    if rain < 5:
        rain = 300.0  # default model baseline for synthetic crop prediction matching

    # Run predictions
    pred_res = crop_engine.predict(
        n=request.nitrogen,
        p=request.phosphorus,
        k=request.potassium,
        ph=request.ph,
        oc=request.organic_carbon,
        temp=temp,
        rain=rain
    )

    return schemas.CropRecommendationResponse(
        recommended_crop=pred_res["recommended_crop"],
        confidence=pred_res["confidence"],
        expected_yield=pred_res["expected_yield"],
        why=pred_res["why"]
    )

# Disease Diagnosis Endpoint
@app.post("/diagnose")
async def diagnose_crop(
    farm_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Verify farm exists
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    file_bytes = await file.read()
    
    # Run simulated YOLO diagnosis
    diagnosis = diagnose_leaf_image(
        filename=file.filename,
        file_bytes=file_bytes,
        farm_id=farm_id,
        db=db
    )
    
    # Update Farm health log
    latest_log = db.query(models.CropLog).filter(models.CropLog.farm_id == farm_id).order_by(models.CropLog.id.desc()).first()
    if latest_log:
        if diagnosis["disease_tag"] == "Healthy":
            latest_log.health_score = min(latest_log.health_score + 5.0, 100.0)
        else:
            latest_log.health_score = max(latest_log.health_score - 15.0, 30.0)
        db.commit()

    return diagnosis

# LLM Conversational Advisory Chat Endpoint
@app.post("/chat", response_model=schemas.ChatResponse)
def agricultural_chat(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    reasoning = get_agricultural_reasoning(
        message=request.message,
        farmer_id=request.farmer_id,
        farm_id=request.farm_id,
        language=request.language,
        db=db
    )
    return schemas.ChatResponse(
        reply=reasoning["reply"],
        suggest_action=reasoning["suggest_action"],
        language=reasoning["language"]
    )

# Tickets endpoints
@app.get("/tickets", response_model=List[schemas.ExpertTicketResponse])
def list_tickets(db: Session = Depends(get_db)):
    return db.query(models.ExpertTicket).order_by(models.ExpertTicket.id.desc()).all()

@app.get("/tickets/high-risk", response_model=List[schemas.ExpertTicketResponse])
def list_high_risk_tickets(db: Session = Depends(get_db)):
    # Confidence is < 70% or active disease tickets
    return db.query(models.ExpertTicket).filter(
        (models.ExpertTicket.ai_confidence < 70.0) | (models.ExpertTicket.disease_tag != "Healthy")
    ).order_by(models.ExpertTicket.id.desc()).all()

@app.post("/tickets/{ticket_id}/resolve")
def resolve_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(models.ExpertTicket).filter(models.ExpertTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = "Resolved"
    db.commit()
    return {"status": "success", "message": "Ticket resolved by Expert"}

# Weather summary endpoint for frontend integration
@app.get("/weather-alerts")
def get_alerts(latitude: float, longitude: float):
    return get_weather_data(latitude, longitude)

# Database seeder to populate dummy tickets for the expert view demo
@app.post("/seed")
def seed_database(db: Session = Depends(get_db)):
    # Clear existing to avoid duplicate conflicts
    db.query(models.ExpertTicket).delete()
    db.query(models.CropLog).delete()
    db.query(models.Farm).delete()
    db.query(models.Farmer).delete()
    db.commit()

    # 1. Farmers
    farmer1 = models.Farmer(name="Ramesh Kumar", phone="9876543210", language_preference="hi", latitude=26.8467, longitude=80.9462)
    farmer2 = models.Farmer(name="Koteswara Rao", phone="8765432109", language_preference="te", latitude=16.5062, longitude=80.6480)
    farmer3 = models.Farmer(name="Anil Sharma", phone="7654321098", language_preference="en", latitude=28.7041, longitude=77.1025)
    
    db.add_all([farmer1, farmer2, farmer3])
    db.commit()

    # 2. Farms
    farm1 = models.Farm(farmer_id=farmer1.id, nitrogen=40.0, phosphorus=22.0, potassium=30.0, ph=7.2, organic_carbon=0.5, acreage=4.5)
    farm2 = models.Farm(farmer_id=farmer2.id, nitrogen=85.0, phosphorus=55.0, potassium=45.0, ph=6.2, organic_carbon=1.1, acreage=8.0)
    farm3 = models.Farm(farmer_id=farmer3.id, nitrogen=25.0, phosphorus=15.0, potassium=28.0, ph=5.8, organic_carbon=0.3, acreage=2.5)

    db.add_all([farm1, farm2, farm3])
    db.commit()

    # 3. Crop Logs
    log1 = models.CropLog(farm_id=farm1.id, current_crop="Wheat", health_score=82.0)
    log2 = models.CropLog(farm_id=farm2.id, current_crop="Cotton", health_score=55.0) # Yellowing cotton
    log3 = models.CropLog(farm_id=farm3.id, current_crop="Groundnut", health_score=90.0)

    db.add_all([log1, log2, log3])
    db.commit()

    # 4. Expert Tickets
    # Ticket 1: Blight detected (Disease ticket, visible on RSK)
    ticket1 = models.ExpertTicket(
        farm_id=farm1.id,
        ai_confidence=85.5,
        status="Pending",
        disease_tag="Leaf Blight",
        description="Foliage shows signs of severe necrotic spotting. Model confidently flagged Leaf Blight. Ramesh reports spreading spots.",
        image_url="/uploads/simulated_blight.jpg"
    )
    # Ticket 2: Low confidence (<70%) ticket, visible on RSK
    ticket2 = models.ExpertTicket(
        farm_id=farm2.id,
        ai_confidence=58.2,
        status="Pending",
        disease_tag="Yellow Vein Mosaic",
        description="Leaves yellowing. AI model is unsure whether it is virus vector infection or just nitrogen deficiency. Human expert audit required.",
        image_url="/uploads/simulated_blurry_cotton.jpg"
    )
    # Ticket 3: Clean ticket (Healthy, high confidence - won't show on RSK expert panel by default)
    ticket3 = models.ExpertTicket(
        farm_id=farm3.id,
        ai_confidence=95.0,
        status="Resolved",
        disease_tag="Healthy",
        description="General crop status check. Everything appears healthy.",
        image_url="/uploads/simulated_healthy.jpg"
    )

    db.add_all([ticket1, ticket2, ticket3])
    db.commit()

    return {"status": "success", "message": "Database seeded with demonstration records."}
