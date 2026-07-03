from typing import List
from sqlalchemy import select
from sqlalchemy.orm import relationship
from app.backend.models.plant import Plant
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError



class PlantRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_plants(self):
        try:
            result = await self.db.execute(select(Plant))
            return result.scalars().all()
        except SQLAlchemyError as e:
            # тут надо будет добавить excepion handlers
            pass

    async def get_plants_by_ids(self, plant_ids: List[int]):
        try:
            result = await self.db.execute(select(Plant).where(Plant.id.in_(plant_ids)))
            return result.scalars().all()
        except SQLAlchemyError as e:
            pass

    async def get_plant_by_id(self, plant_id: int):
        try:
            result = await self.db.execute(select(Plant).where(Plant.id == plant_id))
            return result.scalars().first()
        except SQLAlchemyError as e:
            pass