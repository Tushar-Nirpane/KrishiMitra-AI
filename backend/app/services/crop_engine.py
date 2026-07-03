import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crop database with optimal ranges for synthetic data generation and explainability
CROP_PROFILES = {
    "Rice": {
        "N": (70, 120), "P": (35, 60), "K": (35, 50), "ph": (5.5, 6.8), 
        "oc": (0.7, 1.5), "temp": (22, 32), "rain": (1200, 2500),
        "yield_factor": "2.2 - 3.5 tons per acre",
        "why_template": "Rice requires high water retention (rainfall: {rain}mm) and standard nitrogen levels (N: {n} ppm) which aligns with your fields."
    },
    "Cotton": {
        "N": (50, 90), "P": (30, 50), "K": (40, 70), "ph": (6.0, 7.8), 
        "oc": (0.5, 1.2), "temp": (25, 38), "rain": (500, 1000),
        "yield_factor": "0.8 - 1.5 tons per acre",
        "why_template": "Cotton thrives in warm temperatures ({temp}°C) and moderate rainfall ({rain}mm) on neutral to slightly alkaline soils (pH: {ph})."
    },
    "Wheat": {
        "N": (60, 100), "P": (40, 60), "K": (35, 55), "ph": (6.0, 7.5), 
        "oc": (0.6, 1.2), "temp": (15, 24), "rain": (400, 800),
        "yield_factor": "1.8 - 2.8 tons per acre",
        "why_template": "Wheat matches your cool-season temp ({temp}°C) and moderate nutrient ratios, especially with P: {p} ppm and pH: {ph}."
    },
    "Maize": {
        "N": (60, 110), "P": (30, 55), "K": (30, 50), "ph": (5.8, 7.2), 
        "oc": (0.6, 1.3), "temp": (20, 32), "rain": (600, 1200),
        "yield_factor": "2.0 - 3.2 tons per acre",
        "why_template": "Maize matches well due to its tolerance to moderate clay-loam levels and balanced nutrient profile (N: {n}, P: {p}, K: {k})."
    },
    "Groundnut": {
        "N": (20, 45), "P": (20, 40), "K": (30, 60), "ph": (5.5, 6.5), 
        "oc": (0.4, 0.9), "temp": (22, 30), "rain": (500, 900),
        "yield_factor": "1.0 - 1.8 tons per acre",
        "why_template": "Groundnut is a legume requiring lower external nitrogen (N: {n} ppm) but stable potassium (K: {k} ppm) and acidic to neutral soil."
    },
    "Mustard": {
        "N": (40, 70), "P": (20, 35), "K": (20, 40), "ph": (6.0, 7.2), 
        "oc": (0.4, 0.8), "temp": (12, 22), "rain": (300, 600),
        "yield_factor": "0.6 - 1.2 tons per acre",
        "why_template": "Mustard is suitable for low-rain environments ({rain}mm) and cooler temperatures ({temp}°C) combined with sandy-loam soils."
    }
}

class SmartCropEngine:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.crops = list(CROP_PROFILES.keys())
        self.train_model()

    def train_model(self):
        """Generates synthetic dataset and trains the RandomForestClassifier"""
        logger.info("Generating agricultural data for Smart Crop Engine...")
        data = []
        labels = []

        # Generate 150 samples per crop with some noise
        np.random.seed(42)
        for crop, profile in CROP_PROFILES.items():
            for _ in range(150):
                n = np.random.uniform(profile["N"][0] - 10, profile["N"][1] + 10)
                p = np.random.uniform(profile["P"][0] - 5, profile["P"][1] + 5)
                k = np.random.uniform(profile["K"][0] - 5, profile["K"][1] + 5)
                ph = np.random.uniform(profile["ph"][0] - 0.3, profile["ph"][1] + 0.3)
                oc = np.random.uniform(profile["oc"][0] - 0.1, profile["oc"][1] + 0.1)
                temp = np.random.uniform(profile["temp"][0] - 2, profile["temp"][1] + 2)
                rain = np.random.uniform(profile["rain"][0] - 100, profile["rain"][1] + 100)

                # Clip extreme values
                ph = np.clip(ph, 4.0, 9.0)
                oc = np.clip(oc, 0.1, 2.5)

                data.append([n, p, k, ph, oc, temp, rain])
                labels.append(crop)

        df = pd.DataFrame(data, columns=["N", "P", "K", "ph", "oc", "temp", "rain"])
        
        # Fit Model
        logger.info("Training Random Forest model on synthetic agricultural profiles...")
        self.model.fit(df, labels)
        logger.info("Smart Crop Engine model successfully trained.")

    def predict(self, n: float, p: float, k: float, ph: float, oc: float, temp: float, rain: float):
        """
        Predicts crop and outputs recommendations with explanation.
        """
        features = np.array([[n, p, k, ph, oc, temp, rain]])
        prediction = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]
        confidence = float(np.max(probabilities)) * 100

        # Retrieve profile for explanation
        profile = CROP_PROFILES[prediction]
        expected_yield = profile["yield_factor"]
        
        # Build explaining logic ("Why?")
        why_text = profile["why_template"].format(
            n=round(n, 1), p=round(p, 1), k=round(k, 1), 
            ph=round(ph, 1), oc=round(oc, 2), 
            temp=round(temp, 1), rain=round(rain, 1)
        )

        # Add details if any specific nutrient is deficit or rich
        reasons = []
        if n < profile["N"][0]:
            reasons.append(f"Nitrogen ({round(n, 1)} ppm) is low for {prediction}, consider applying nitrogenous fertilizer (like Urea).")
        if p < profile["P"][0]:
            reasons.append(f"Phosphorus ({round(p, 1)} ppm) is low, DAP or Single Super Phosphate (SSP) is recommended.")
        if ph < profile["ph"][0]:
            reasons.append(f"Soil is slightly acidic (pH: {round(ph, 1)}) for {prediction}. Lime application can raise pH.")
        elif ph > profile["ph"][1]:
            reasons.append(f"Soil is alkaline (pH: {round(ph, 1)}) for {prediction}. Gypsum can help restore balance.")
        
        if reasons:
            why_text += " Tips: " + " ".join(reasons)

        return {
            "recommended_crop": prediction,
            "confidence": round(confidence, 1),
            "expected_yield": expected_yield,
            "why": why_text
        }

# Singleton instance
crop_engine = SmartCropEngine()
