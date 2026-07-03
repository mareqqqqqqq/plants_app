from typing import List, Optional
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

    async def create_new_pot(
            self,
            plant_id: Optional[int],
            custom_name: str,
            notes: Optional[str],
            watering_interval_days: int,
            img_url: Optional[str],
            last_watered_date: Optional[str]
    ):
        return await self.repo.create_user_pot(
            plant_id=plant_id,
            custom_name=custom_name,
            notes=notes,
            watering_interval_days=watering_interval_days,
            img_url=img_url,
            last_watered_date_str=last_watered_date
        )

