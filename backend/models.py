from pydantic import BaseModel


class Location(BaseModel):
    city: str
    country: str
    lat: float
    lon: float


class CurrentWeather(BaseModel):
    temperature: float
    feels_like: float
    humidity: int
    pressure: int
    visibility: float
    wind_speed: float
    description: str
    icon: str
