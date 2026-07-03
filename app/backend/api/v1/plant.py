import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.backend.db import get_db
from app.backend.deps import get_current_user_id
from app.backend.services.plant_service import PlantService
from app.backend.schemas.plant import PlantResponse, UserPlantCreate, UserPlantUpdate, UserPlantResponse


router = APIRouter()

UPLOAD_DIR = "images/user_uploads"
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_UPLOAD_SIZE = 5 * 1024 * 1024


@router.get("/explorer", response_model=List[PlantResponse])
async def get_plants_catalog(db: AsyncSession = Depends(get_db)):
    plant_service = PlantService(db)
    catalog = await plant_service.get_plant_catalog()
    return catalog


@router.get("/batch", response_model=List[PlantResponse])
async def get_plants_batch(plants_ids: List[int] = Query(...), db: AsyncSession = Depends(get_db)):
    plant_service = PlantService(db)
    plants = await plant_service.get_plants_by_ids(plants_ids)
    return plants


@router.post("/upload-image")
async def upload_plant_image(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Разрешены только изображения (jpg, png, webp, gif)")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Файл слишком большой (максимум 5 МБ)")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
        f.write(contents)

    return {"url": f"/images/user_uploads/{filename}"}


@router.post("/add", status_code=status.HTTP_201_CREATED, response_model=UserPlantResponse)
async def add_user_plant(
    plant_data: UserPlantCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    plant_service = PlantService(db)
    new_pot = await plant_service.create_new_pot(
        user_id=user_id,
        plant_id=plant_data.plant_id,
        custom_name=plant_data.custom_name,
        notes=plant_data.notes,
        watering_interval_days=plant_data.watering_interval_days,
        repotting_interval_months=plant_data.repotting_interval_months,
        img_url=plant_data.img_url,
        is_toxic=plant_data.is_toxic,
        last_watered_date=plant_data.last_watered_date
    )
    return new_pot


@router.get("/my", response_model=List[UserPlantResponse])
async def get_my_plants(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    plant_service = PlantService(db)
    return await plant_service.get_user_plants(user_id)


@router.patch("/my/{pot_id}", response_model=UserPlantResponse)
async def update_my_plant(
    pot_id: int,
    plant_data: UserPlantUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    plant_service = PlantService(db)
    updated = await plant_service.update_user_plant(
        user_id, pot_id, plant_data.model_dump(exclude_unset=True)
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Растение не найдено")
    return updated


@router.delete("/my/{pot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_plant(
    pot_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    plant_service = PlantService(db)
    deleted = await plant_service.delete_user_plant(user_id, pot_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Растение не найдено")
