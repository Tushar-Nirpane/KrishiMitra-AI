import os
import requests
from typing import Dict, Any, List

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

def get_weather_data(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Fetches weather data for a given location.
    If OPENWEATHER_API_KEY is present, queries OpenWeather API.
    Otherwise, returns mock weather data.
    """
    # Dynamic values based on latitude/longitude to make mock data realistic
    # e.g., higher latitudes are cooler
    base_temp = 28.0 - abs(latitude - 15.0) * 0.5
    
    # 7 days of rainfall mock data (in mm)
    # If the location is dry, simulate low rain
    if abs(longitude - 78.0) > 5:
        # Dry region
        rain_history = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    else:
        # Normal region, some small rain
        rain_history = [0.2, 0.0, 0.5, 0.0, 0.0, 0.1, 0.0]

    weather_result = {
        "current_temp": round(base_temp, 1),
        "current_condition": "Sunny" if sum(rain_history) < 1 else "Partly Cloudy",
        "7_day_rainfall_sum": round(sum(rain_history), 2),
        "daily_rain_forecast": rain_history,
        "humidity": 65,
        "wind_speed": 12.5,
        "source": "Mock API"
    }

    if OPENWEATHER_API_KEY:
        try:
            # Call OpenWeather API
            # For 7 days forecast, OpenWeather One Call API is typically used
            url = f"https://api.openweathermap.org/data/2.5/onecall?lat={latitude}&lon={longitude}&exclude=minutely,hourly&appid={OPENWEATHER_API_KEY}&units=metric"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                current = data.get("current", {})
                daily = data.get("daily", [])
                
                temp = current.get("temp", base_temp)
                condition = current.get("weather", [{}])[0].get("main", "Clear")
                humidity = current.get("humidity", 65)
                wind = current.get("wind_speed", 10.0)
                
                # Fetch daily rain for next 7 days
                rain_forecast = []
                for day in daily[:7]:
                    rain_forecast.append(day.get("rain", 0.0))
                
                weather_result = {
                    "current_temp": round(temp, 1),
                    "current_condition": condition,
                    "7_day_rainfall_sum": round(sum(rain_forecast), 2),
                    "daily_rain_forecast": rain_forecast,
                    "humidity": humidity,
                    "wind_speed": wind,
                    "source": "OpenWeather API"
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
    return weather_result
