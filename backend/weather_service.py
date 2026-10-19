import os
from datetime import datetime
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

API_KEY = os.getenv("OPENWEATHER_API_KEY")

BASE_URL = "https://api.openweathermap.org"


async def fetch_json(url, params):
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(url, params=params)

        if response.status_code != 200:
            try:
                error = response.json()
                message = error.get("message", "Weather API error")
            except Exception:
                message = "Weather API error"

            raise Exception(message)

        return response.json()


async def geocode_city(city):
    data = await fetch_json(
        f"{BASE_URL}/geo/1.0/direct",
        {
            "q": city,
            "limit": 1,
            "appid": API_KEY
        }
    )

    if not data:
        raise Exception(f"Could not find city: {city}")

    return data[0]


async def get_current_weather(lat, lon):
    return await fetch_json(
        f"{BASE_URL}/data/2.5/weather",
        {
            "lat": lat,
            "lon": lon,
            "appid": API_KEY,
            "units": "metric"
        }
    )


async def get_forecast(lat, lon):
    return await fetch_json(
        f"{BASE_URL}/data/2.5/forecast",
        {
            "lat": lat,
            "lon": lon,
            "appid": API_KEY,
            "units": "metric"
        }
    )


async def get_air_quality(lat, lon):
    return await fetch_json(
        f"{BASE_URL}/data/2.5/air_pollution",
        {
            "lat": lat,
            "lon": lon,
            "appid": API_KEY
        }
    )


def get_aqi_info(aqi):
    levels = {
        1: {
            "label": "Good",
            "color": "#39d98a",
            "recommendation":
                "Air quality is good. Outdoor activities are suitable."
        },
        2: {
            "label": "Fair",
            "color": "#f5c542",
            "recommendation":
                "Air quality is acceptable. Unusually sensitive people should consider reducing prolonged outdoor exertion."
        },
        3: {
            "label": "Moderate",
            "color": "#ff9f43",
            "recommendation":
                "Sensitive people may want to reduce prolonged outdoor activity."
        },
        4: {
            "label": "Poor",
            "color": "#ff5c5c",
            "recommendation":
                "Consider reducing outdoor activity, especially for sensitive groups."
        },
        5: {
            "label": "Very Poor",
            "color": "#b83280",
            "recommendation":
                "Avoid prolonged outdoor exertion and consider remaining indoors."
        }
    }

    return levels.get(aqi, levels[3])


def format_time(timestamp, timezone_offset):
    local_timestamp = timestamp + timezone_offset

    return datetime.utcfromtimestamp(
        local_timestamp
    ).strftime("%I:%M %p")


def process_forecast(forecast):
    days = {}

    for item in forecast["list"]:
        date = item["dt_txt"].split(" ")[0]

        if date not in days:
            days[date] = []

        days[date].append(item)

    result = []

    for date, entries in list(days.items())[:5]:
        temperatures = [
            entry["main"]["temp"]
            for entry in entries
        ]

        weather = entries[len(entries) // 2]["weather"][0]

        result.append({
            "date": date,
            "temperature": round(max(temperatures)),
            "min_temperature": round(min(temperatures)),
            "description": weather["description"],
            "icon": weather["icon"]
        })

    return result


async def build_weather_response(lat, lon, city_name=None):
    current = await get_current_weather(lat, lon)
    forecast = await get_forecast(lat, lon)
    air = await get_air_quality(lat, lon)

    aqi = air["list"][0]["main"]["aqi"]
    aqi_info = get_aqi_info(aqi)

    timezone = current.get("timezone", 0)

    weather = current["weather"][0]
    main = current["main"]
    wind = current["wind"]

    city = city_name or current["name"]

    return {
        "location": {
            "city": city,
            "country": current.get("sys", {}).get("country", ""),
            "lat": lat,
            "lon": lon
        },

        "current": {
            "temperature": round(main["temp"]),
            "feels_like": round(main["feels_like"]),
            "humidity": main["humidity"],
            "pressure": main["pressure"],
            "visibility": round(
                current.get("visibility", 0) / 1000,
                1
            ),
            "wind_speed": round(
                wind.get("speed", 0) * 3.6,
                1
            ),
            "description": weather["description"],
            "icon": weather["icon"]
        },

        "sun": {
            "sunrise": format_time(
                current["sys"]["sunrise"],
                timezone
            ),
            "sunset": format_time(
                current["sys"]["sunset"],
                timezone
            )
        },

        "air_quality": {
            "aqi": aqi,
            "label": aqi_info["label"],
            "color": aqi_info["color"],
            "recommendation": aqi_info["recommendation"]
        },

        "forecast": process_forecast(forecast)
    }


async def get_weather(city):
    location = await geocode_city(city)

    return await build_weather_response(
        location["lat"],
        location["lon"],
        location.get("name")
    )


async def get_weather_by_coordinates(lat, lon):
    return await build_weather_response(lat, lon)
