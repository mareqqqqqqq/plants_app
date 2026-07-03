from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy import func
from sqlalchemy.orm import relationship
from app.backend.db import Base

class UserPlant(Base):
    __tablename__ = "user_plant"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plant_id = Column(Integer, ForeignKey("plants.id"), nullable=True)
    custom_name = Column(String(100), nullable=False)
    date_added = Column(DateTime, server_default=func.current_timestamp())
    notes = Column(String(500), nullable=True)
    watering_interval_days = Column(Integer, nullable=False, default=7)
    repotting_interval_months = Column(Integer, nullable=True)
    last_watered_date = Column(DateTime, server_default=func.current_timestamp())
    img_url = Column(String(255), nullable=True)
    is_toxic = Column(Boolean, nullable=True)
    owner = relationship("User", back_populates="my_plants")
    plant_info = relationship("Plant", back_populates="user_instances")
