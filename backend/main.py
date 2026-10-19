from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backnd.weather_service import (
    get_weather,
    get_weather_by_coordinates
)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app = FastAPI(
    title="Weather App API",
    description="Weather forecast API powered by OpenWeather",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "Weather App API"
    }


@app.get("/api/weather")
async def weather(
    city: str = Query(..., min_length=2)
):
    try:
        return await get_weather(city)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@app.get("/api/weather/location")
async def weather_location(
    lat: float,
    lon: float
):
    try:
        return await get_weather_by_coordinates(lat, lon)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# Serve frontend
app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static"
)


@app.get("/")
async def home():
    return FileResponse(FRONTEND_DIR / "index.html")
