from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.backend.api.v1.plant import router as plant_router
from fastapi.staticfiles import StaticFiles


app = FastAPI(title="PlantCare")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plant_router, prefix="/plants", tags=["Plants catalog"])
app.mount("/FrontEnd", StaticFiles(directory="app/FrontEnd", html=True), name="frontend")

app.mount("/images", StaticFiles(directory="images"), name="images")