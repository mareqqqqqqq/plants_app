from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import relationship
from app.backend.models.plant import Plant
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from app.backend.models.user_plant import UserPlant


class PlantRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_plants(self):
        try:
            result = await self.db.execute(select(Plant))
            return result.scalars().all()
        except SQLAlchemyError as e:
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

    @staticmethod
    def _parse_watered_date(last_watered_date_str: Optional[str]) -> datetime:
        if not last_watered_date_str:
            return datetime.utcnow()
        for fmt in ("%d.%m.%Y", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f"):
            try:
                return datetime.strptime(last_watered_date_str, fmt)
            except ValueError:
                continue
        try:
            return datetime.fromisoformat(last_watered_date_str.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            return datetime.utcnow()

    async def create_user_pot(
            self,
            user_id: int,
            plant_id: Optional[int],
            custom_name: str,
            notes: Optional[str],
            watering_interval_days: int,
            repotting_interval_months: Optional[int],
            img_url: Optional[str],
            is_toxic: Optional[bool],
            last_watered_date_str: Optional[str]
    ):
        try:
            new_pot = UserPlant(
                user_id=user_id,
                plant_id=plant_id,
                custom_name=custom_name,
                notes=notes,
                watering_interval_days=watering_interval_days,
                repotting_interval_months=repotting_interval_months,
                img_url=img_url,
                is_toxic=is_toxic,
                last_watered_date=self._parse_watered_date(last_watered_date_str)
            )

            self.db.add(new_pot)
            await self.db.commit()
            await self.db.refresh(new_pot)
            return new_pot

        except SQLAlchemyError:
            await self.db.rollback()
            raise

    async def get_user_plants(self, user_id: int):
        result = await self.db.execute(select(UserPlant).where(UserPlant.user_id == user_id))
        return result.scalars().all()

    async def get_user_pot_by_id(self, user_id: int, pot_id: int):
        result = await self.db.execute(
            select(UserPlant).where(UserPlant.id == pot_id, UserPlant.user_id == user_id)
        )
        return result.scalars().first()

    async def update_user_pot(self, user_id: int, pot_id: int, updates: dict):
        pot = await self.get_user_pot_by_id(user_id, pot_id)
        if not pot:
            return None
        if "last_watered_date" in updates and updates["last_watered_date"] is not None:
            updates["last_watered_date"] = self._parse_watered_date(updates["last_watered_date"])
        for field, value in updates.items():
            setattr(pot, field, value)
        try:
            await self.db.commit()
            await self.db.refresh(pot)
            return pot
        except SQLAlchemyError:
            await self.db.rollback()
            raise

    async def delete_user_pot(self, user_id: int, pot_id: int):
        pot = await self.get_user_pot_by_id(user_id, pot_id)
        if not pot:
            return False
        try:
            await self.db.delete(pot)
            await self.db.commit()
            return True
        except SQLAlchemyError:
            await self.db.rollback()
            raise
