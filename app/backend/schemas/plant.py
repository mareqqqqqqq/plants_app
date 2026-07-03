from pydantic import BaseModel
from typing import Optional


class UserPlantCreate(BaseModel):
    plant_id: Optional[int] = None
    custom_name: str
    notes: Optional[str] = None
    watering_interval_days: int = 7
    img_url: Optional[str] = None


class PlantResponse(BaseModel):
    id: int
    name: str
    watering_info: str
    light_info: str
    replanting_info: Optional[str] = None
    is_toxic: bool
    extra_notes: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True