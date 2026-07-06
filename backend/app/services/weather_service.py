import os
import requests
from typing import Dict, Any, List

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

def reverse_geocode(latitude: float, longitude: float) -> Dict[str, str]:
    """
    Uses Nominatim (OpenStreetMap, free, no API key) to reverse-geocode
    a coordinate pair into a city + state label for display purposes.
    Returns {'city': '...', 'state': '...', 'display': '...'}.
    """
    try:
        url = (
            f"https://nominatim.openstreetmap.org/reverse"
            f"?lat={latitude}&lon={longitude}&format=json&addressdetails=1"
        )
        headers = {"User-Agent": "KrishiMitraAI/1.0"}
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            address = data.get("address", {})
            city = (
                address.get("city")
                or address.get("town")
                or address.get("village")
                or address.get("county")
                or ""
            )
            state = address.get("state", "")
            display = ", ".join(filter(None, [city, state])) or "Your Location"
            return {"city": city, "state": state, "display": display}
    except Exception:
        pass
    return {"city": "", "state": "", "display": "Your Location"}


def get_weather_data(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Fetches weather data for a given location using the free Open-Meteo API.
    Falls back to mock data if the API fails.
    """
    # Reverse geocode to get human-readable location name (city, state)
    location = reverse_geocode(latitude, longitude)

    # Base fallback values
    base_temp = 28.0 - abs(latitude - 15.0) * 0.5
    rain_history = [0.0]*7 if abs(longitude - 78.0) > 5 else [0.2, 0.0, 0.5, 0.0, 0.0, 0.1, 0.0]

    weather_result = {
        "current_temp": round(base_temp, 1),
        "current_condition": "Sunny" if sum(rain_history) < 1 else "Partly Cloudy",
        "7_day_rainfall_sum": round(sum(rain_history), 2),
        "daily_rain_forecast": rain_history,
        "humidity": 65,
        "wind_speed": 12.5,
        "source": "Mock API (Fallback)"
    }

    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={latitude}&longitude={longitude}"
            f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code"
            f"&daily=precipitation_sum&timezone=auto"
        )
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            
            # Parse current data
            current = data.get("current", {})
            temp = current.get("temperature_2m", base_temp)
            humidity = current.get("relative_humidity_2m", 65)
            wind = current.get("wind_speed_10m", 10.0)
            code = current.get("weather_code", 0)
            
            # Simple WMO Weather interpretation
            condition = "Sunny"
            if code in [1, 2, 3]: condition = "Partly Cloudy"
            elif code in [45, 48]: condition = "Mist"
            elif code in [51, 53, 55, 56, 57]: condition = "Drizzle"
            elif code in [61, 63, 65, 66, 67, 80, 81, 82]: condition = "Rain"
            elif code in [71, 73, 75, 77, 85, 86]: condition = "Snow"
            elif code in [95, 96, 99]: condition = "Thunderstorm"

            # Parse daily data
            daily = data.get("daily", {})
            precip = daily.get("precipitation_sum", [])
            # Pad with 0 if API returned fewer than 7 days
            rain_forecast = precip[:7] + [0.0] * max(0, 7 - len(precip[:7]))
            
            weather_result = {
                "current_temp": round(temp, 1),
                "current_condition": condition,
                "7_day_rainfall_sum": round(sum(rain_forecast), 2),
                "daily_rain_forecast": rain_forecast,
                "humidity": humidity,
                "wind_speed": wind,
                "source": "Open-Meteo API"
            }
    except Exception as e:
        # Fallback to mock silently on network issues
        pass

    # Check Irrigation Alert requirement
    # If rain < 1mm for 7 days, trigger an "Irrigation Alert."
    alerts = []
    if weather_result["7_day_rainfall_sum"] < 1.0:
        alerts.append({
            "type": "Irrigation Alert",
            "severity": "High",
            "message": "Critical Alert: Dry spell detected. Precipitation is below 1mm for the next 7 days. Please schedule irrigation for your fields immediately to prevent root stress.",
            "recommendation": "Apply light, deep irrigation during early morning or late evening to minimize evaporation."
        })
    else:
        # Add normal weather advice
        alerts.append({
            "type": "General Advisory",
            "severity": "Low",
            "message": f"Normal conditions. Expected rainfall: {weather_result['7_day_rainfall_sum']}mm. Soil moisture levels look stable.",
            "recommendation": "Monitor crops for pest activity due to moisture content."
        })

    weather_result["alerts"] = alerts
    weather_result["location"] = location
    return weather_result
