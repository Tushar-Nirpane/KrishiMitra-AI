import random
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from .. import models

# Diagnosis database for simulation
DISEASE_PROFILES = {
    "Leaf Blight": {
        "confidence_range": (78.0, 96.0),
        "treatment_tips": [
            "Apply Copper Oxychloride (0.3%) or Mancozeb (0.25%) at 10-14 day intervals.",
            "Remove and destroy infected plant debris to stop fungal spores from spreading.",
            "Avoid overhead irrigation; water the plants at the base to keep foliage dry."
        ],
        "description": "Fungal infection causing water-soaked lesions on leaves which turn brown and dry up."
    },
    "Yellow Vein Mosaic": {
        "confidence_range": (80.0, 94.0),
        "treatment_tips": [
            "Spray systemic insecticide like Imidacloprid (0.5 ml/L) to control the whitefly vector.",
            "Remove infected plants immediately to prevent the virus from spreading.",
            "Sow disease-resistant varieties in the future."
        ],
        "description": "Viral disease transmitted by whiteflies, causing yellowing of veins and leaves."
    },
    "Healthy": {
        "confidence_range": (90.0, 99.0),
        "treatment_tips": [
            "Maintain current watering and nutrition schedules.",
            "Keep monitoring for pests twice a week.",
            "Apply organic compost to sustain high soil health."
        ],
        "description": "Leaves show strong green color with no visible chlorosis, necrosis, or pest damage."
    }
}

def diagnose_leaf_image(
    filename: str, 
    file_bytes: bytes, 
    farm_id: int, 
    db: Session
) -> Dict[str, Any]:
    """
    Simulates a YOLOv11/EfficientNet computer vision classification model.
    Analyzes the filename / image bytes (heuristically) to return a crop disease report,
    and automatically logs a ticket for Rythu Seva Kendra experts if it is a disease
    or if AI confidence is low (< 70%).
    """
    # Deterministic simulation based on filename keywords
    fn_lower = filename.lower()
    if "blight" in fn_lower or "spot" in fn_lower or "dead" in fn_lower:
        disease = "Leaf Blight"
    elif "yellow" in fn_lower or "mosaic" in fn_lower:
        disease = "Yellow Vein Mosaic"
    elif "healthy" in fn_lower or "green" in fn_lower:
        disease = "Healthy"
    else:
        # Weighted random selection
        disease = random.choices(["Leaf Blight", "Yellow Vein Mosaic", "Healthy"], weights=[0.4, 0.2, 0.4])[0]

    profile = DISEASE_PROFILES[disease]
    
    # Simulate a confidence score
    # If the image name has "blurry" or "bad", simulate low confidence (<70%) to test expert dashboard
    if "blurry" in fn_lower or "bad" in fn_lower or "test" in fn_lower:
        confidence = round(random.uniform(50.0, 68.0), 1)
    else:
        confidence = round(random.uniform(profile["confidence_range"][0], profile["confidence_range"][1]), 1)

    # Determine if ticket is needed:
    # 1. AI confidence is low (< 70%)
    # 2. Disease detected (Leaf Blight or Yellow Vein Mosaic)
    ticket_created = False
    ticket_id = None

    if confidence < 70.0 or disease != "Healthy":
        # Create an Expert Ticket automatically
        ticket = models.ExpertTicket(
            farm_id=farm_id,
            ai_confidence=confidence,
            status="Pending",
            disease_tag=disease,
            description=f"Auto-generated from CV Diagnosis. Simulated model identified '{disease}' with {confidence}% confidence. {profile['description']}",
            image_url=f"/uploads/simulated_{filename}"
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        ticket_created = True
        ticket_id = ticket.id

    return {
        "disease_tag": disease,
        "confidence": confidence,
        "treatment_tips": profile["treatment_tips"],
        "ticket_created": ticket_created,
        "ticket_id": ticket_id
    }
