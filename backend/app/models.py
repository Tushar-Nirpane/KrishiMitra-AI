from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    language_preference = Column(String, default="en")  # 'en', 'hi', 'te'
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    farms = relationship("Farm", back_populates="farmer", cascade="all, delete-orphan")

class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    
    # Soil Data (N, P, K, pH, Organic Carbon)
    nitrogen = Column(Float, nullable=False)
    phosphorus = Column(Float, nullable=False)
    potassium = Column(Float, nullable=False)
    ph = Column(Float, nullable=False)
    organic_carbon = Column(Float, nullable=False)
    
    acreage = Column(Float, nullable=False)

    farmer = relationship("Farmer", back_populates="farms")
    crop_logs = relationship("CropLog", back_populates="farm", cascade="all, delete-orphan")
    expert_tickets = relationship("ExpertTicket", back_populates="farm", cascade="all, delete-orphan")

class CropLog(Base):
    __tablename__ = "crop_logs"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    current_crop = Column(String, nullable=False)
    sowing_date = Column(Date, default=datetime.date.today)
    health_score = Column(Float, default=100.0)  # scale of 0-100

    farm = relationship("Farm", back_populates="crop_logs")

class ExpertTicket(Base):
    __tablename__ = "expert_tickets"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    ai_confidence = Column(Float, nullable=False)  # scale of 0-100 (if < 70%, it goes to RSK experts)
    status = Column(String, default="Pending")  # 'Pending', 'Resolved'
    description = Column(String, nullable=True)
    disease_tag = Column(String, nullable=True)  # 'Leaf Blight', 'Healthy', etc.
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farm = relationship("Farm", back_populates="expert_tickets")
