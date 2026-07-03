from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.backend.api.v1.plant import router as plant_router
from app.backend.api.v1.user import router as user_router
from fastapi.staticfiles import StaticFiles


app = FastAPI(title="PlantCare")


@app.get("/", include_in_schema=False)
async def root_redirect():
    return RedirectResponse(url="/FrontEnd/index.html")


class NoCacheFrontendMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/FrontEnd"):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response


app.add_middleware(NoCacheFrontendMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plant_router, prefix="/plants", tags=["Plants catalog"])
app.include_router(user_router, prefix="/users", tags=["Users"])
app.mount("/FrontEnd", StaticFiles(directory="app/FrontEnd", html=True), name="frontend")

app.mount("/images", StaticFiles(directory="images"), name="images")