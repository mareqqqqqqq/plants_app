from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.backend.db import get_db
from app.backend.services.plant_service import PlantService

router = APIRouter()

@router.get("/explorer")
async def get_plants_catalog(db: AsyncSession = Depends(get_db)):
    plant_service = PlantService(db)
    catalog = await plant_service.get_plant_catalog()
    return catalog

