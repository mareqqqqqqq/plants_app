from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import datetime


class UserPlantCreate(BaseModel):
    plant_id: Optional[int] = None
    custom_name: str
    notes: Optional[str] = None
    watering_interval_days: int = 7
    repotting_interval_months: Optional[int] = None
    img_url: Optional[str] = None
    last_watered_date: Optional[str] = None

    is_toxic: Optional[bool] = None

    @model_validator(mode="after")
    def validate_custom_plant_fields(self) -> 'UserPlantCreate':
        if self.plant_id is None:
            if self.is_toxic is None:
                raise ValueError("Для кастомного растения поле 'is_toxic' (ядовитость) обязательно к заполнению!")
        return self


class UserPlantUpdate(BaseModel):
    plant_id: Optional[int] = None
    custom_name: Optional[str] = None
    notes: Optional[str] = None
    watering_interval_days: Optional[int] = None
    repotting_interval_months: Optional[int] = None
    img_url: Optional[str] = None
    last_watered_date: Optional[str] = None
    is_toxic: Optional[bool] = None


class UserPlantResponse(BaseModel):
    id: int
    plant_id: Optional[int] = None
    custom_name: str
    notes: Optional[str] = None
    watering_interval_days: int
    repotting_interval_months: Optional[int] = None
    img_url: Optional[str] = None
    is_toxic: Optional[bool] = None
    last_watered_date: Optional[datetime] = None
    date_added: Optional[datetime] = None

    class Config:
        from_attributes = True


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