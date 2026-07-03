from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import relationship
from app.backend.models.plant import Plant
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from app.backend.models.user_plant import UserPlant
from app.backend.models.user import User


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

    async def create_user_pot(
            self,
            plant_id: Optional[int],
            custom_name: str,
            notes: Optional[str],
            watering_interval_days: int,
            img_url: Optional[str],
            last_watered_date_str: Optional[str]
    ):
        try:
            result = await self.db.execute(select(User).limit(1))
            user = result.scalars().first()

            if not user:
                user = User(username="Цветовод", email="gardener@example.com", hashed_password="mock")
                self.db.add(user)
                await self.db.commit()
                await self.db.refresh(user)

                parsed_date = datetime.utcnow()
                if last_watered_date_str:
                    try:
                        parsed_date = datetime.strptime(last_watered_date_str, "%d.%m.%Y")
                    except ValueError:
                        pass

            parsed_date = datetime.utcnow()
            if last_watered_date_str:
                try:
                    parsed_date = datetime.strptime(last_watered_date_str, "%d.%m.%Y")
                except ValueError:
                    pass

            new_pot = UserPlant(
                user_id=user.id,
                plant_id=plant_id,
                custom_name=custom_name,
                notes=notes,
                watering_interval_days=watering_interval_days,
                img_url=img_url,
                last_watered_date=parsed_date
            )

            self.db.add(new_pot)
            await self.db.commit()
            await self.db.refresh(new_pot)
            return new_pot

        except SQLAlchemyError as e:
            await self.db.rollback()
            return e
