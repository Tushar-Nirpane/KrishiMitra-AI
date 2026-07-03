from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

# Soil Data nested schema for helper
class SoilDataSchema(BaseModel):
    nitrogen: float = Field(..., description="Nitrogen (N) content in ppm or kg/ha")
    phosphorus: float = Field(..., description="Phosphorus (P) content in ppm or kg/ha")
    potassium: float = Field(..., description="Potassium (K) content in ppm or kg/ha")
    ph: float = Field(..., description="Soil pH value (0-14)")
    organic_carbon: float = Field(..., description="Organic Carbon percentage")

class FarmerBase(BaseModel):
    name: str
    phone: str
    language_preference: str = "en"
    latitude: float
    longitude: float

class FarmerCreate(FarmerBase):
    pass

class FarmerResponse(FarmerBase):
    id: int

    class Config:
        from_attributes = True

class FarmBase(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    ph: float
    organic_carbon: float
    acreage: float

class FarmCreate(FarmBase):
    farmer_id: int

class FarmResponse(FarmBase):
    id: int
    farmer_id: int

    class Config:
        from_attributes = True

class CropLogBase(BaseModel):
    farm_id: int
    current_crop: str
    sowing_date: datetime.date
    health_score: float

class CropLogCreate(BaseModel):
    farm_id: int
    current_crop: str
    sowing_date: Optional[datetime.date] = None
    health_score: Optional[float] = 100.0

class CropLogResponse(CropLogBase):
    id: int

    class Config:
        from_attributes = True

class ExpertTicketBase(BaseModel):
    farm_id: int
    ai_confidence: float
    status: str = "Pending"
    description: Optional[str] = None
    disease_tag: Optional[str] = None
    image_url: Optional[str] = None

class ExpertTicketCreate(ExpertTicketBase):
    pass

class ExpertTicketResponse(ExpertTicketBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class CropRecommendationRequest(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    ph: float
    organic_carbon: float
    latitude: float
    longitude: float

class CropRecommendationResponse(BaseModel):
    recommended_crop: str
    confidence: float
    expected_yield: str  # e.g., "2.5 tons/acre"
    why: str  # Explanation
    offline: bool = False

class DiseaseDiagnosisResponse(BaseModel):
    disease_tag: str  # "Leaf Blight", "Healthy", "Yellow Vein Mosaic", etc.
    confidence: float
    treatment_tips: List[str]
    ticket_created: bool
    ticket_id: Optional[int] = None

class ChatRequest(BaseModel):
    message: str
    farmer_id: Optional[int] = None
    farm_id: Optional[int] = None
    language: str = "en"  # "en", "hi", "te"

class ChatResponse(BaseModel):
    reply: str
    suggest_action: Optional[str] = None  # e.g. "request_photo"
    language: str
