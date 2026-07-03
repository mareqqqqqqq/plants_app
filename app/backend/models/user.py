from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.backend.db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)

    my_plants = relationship("UserPlant", back_populates="owner")



