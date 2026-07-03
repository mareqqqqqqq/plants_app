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
            user_id: int,
            plant_id: Optional[int],
            custom_name: str,
            notes: Optional[str],
            watering_interval_days: int,
            repotting_interval_months: Optional[int],
            img_url: Optional[str],
            is_toxic: Optional[bool],
            last_watered_date: Optional[str]
    ):
        return await self.repo.create_user_pot(
            user_id=user_id,
            plant_id=plant_id,
            custom_name=custom_name,
            notes=notes,
            watering_interval_days=watering_interval_days,
            repotting_interval_months=repotting_interval_months,
            img_url=img_url,
            is_toxic=is_toxic,
            last_watered_date_str=last_watered_date
        )

    async def get_user_plants(self, user_id: int):
        return await self.repo.get_user_plants(user_id)

    async def update_user_plant(self, user_id: int, pot_id: int, updates: dict):
        return await self.repo.update_user_pot(user_id, pot_id, updates)

    async def delete_user_plant(self, user_id: int, pot_id: int):
        return await self.repo.delete_user_pot(user_id, pot_id)

