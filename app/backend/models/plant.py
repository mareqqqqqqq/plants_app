from sqlalchemy import Column, Integer, String, Boolean, Text
from sqlalchemy.orm import relationship
from app.backend.db import Base

class Plant(Base):
    __tablename__ = "plants"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    watering_info = Column(Text, nullable=False)
    light_info = Column(Text, nullable=False)
    replanting_info = Column(Text, nullable=False)

    is_toxic = Column(Boolean, default=False)
    extra_notes = Column(Text, nullable=False)
    image_url = Column(Text, nullable=False)

    user_instances = relationship("UserPlant", back_populates="plant_info")
