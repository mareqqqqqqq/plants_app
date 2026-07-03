from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.backend.repositories.plant_repo import PlantRepository

class PlantService:
    def __init__(self, db: AsyncSession):
        self.repo = PlantRepository(db)

    async def get_plant_catalog(self):
        return await self.repo.get_all_plants()

    async def get_plants_by_ids(self, plant_ids: List[int]):
        return await self.repo.get_plants_by_ids(plant_ids)

    async def get_plant_by_id(self, plant_id: int):
        return await self.repo.get_plant_by_id(plant_id)




