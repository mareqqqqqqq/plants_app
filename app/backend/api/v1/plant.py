from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.backend.db import get_db
from app.backend.services.plant_service import PlantService
from app.backend.schemas.plant import PlantResponse
from app.backend.schemas.plant import UserPlantCreate


router = APIRouter()


@router.get("/explorer", response_model=List[PlantResponse])
async def get_plants_catalog(db: AsyncSession = Depends(get_db)):
    plant_service = PlantService(db)
    catalog = await plant_service.get_plant_catalog()
    return catalog


@router.get("/batch", response_model=List[PlantResponse])
async def get_plants_batch(plants_ids: List[int], db: AsyncSession = Depends(get_db)):
    plant_service = PlantService(db)
    plants = await plant_service.get_plants_by_ids(plants_ids)
    return plants


@router.post("/add", status_code=status.HTTP_201_CREATED)
async def add_user_plant(plant_data: UserPlantCreate, db: AsyncSession = Depends(get_db)):
    plant_service = PlantService(db)
    new_pot = await plant_service.create_new_pot(
        plant_id=plant_data.plant_id,
        custom_name=plant_data.custom_name,
        notes=plant_data.notes,
        watering_interval_days=plant_data.watering_interval_days,
        img_url=plant_data.img_url,
        last_watered_date=plant_data.last_watered_date
    )
    return {"message": "Успешно добавлено в ваш сад!", "id": new_pot.id}
