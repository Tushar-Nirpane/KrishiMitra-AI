"""
train_disease_model.py
======================
Trains a TF-IDF + Random Forest text classifier on krishimitra_disease_database.csv
and saves the artefacts to app/ml_models/.

Run once from the backend/ directory:
    python train_disease_model.py
"""

import json
import os
import sys
import pathlib

import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR   = pathlib.Path(__file__).parent          # backend/
CSV_PATH   = BASE_DIR / "krishimitra_disease_database.csv"
MODELS_DIR = BASE_DIR / "app" / "ml_models"
MODEL_PATH = MODELS_DIR / "disease_classifier.pkl"
DB_PATH    = MODELS_DIR / "disease_db.json"

MODELS_DIR.mkdir(parents=True, exist_ok=True)

# ── Load Data ────────────────────────────────────────────────────────────────
print("📂  Loading dataset …")
df = pd.read_csv(CSV_PATH)
print(f"    {len(df)} rows | {df['disease_name'].nunique()} unique diseases | {df['crop'].nunique()} crops")

# ── Feature Engineering ───────────────────────────────────────────────────────
# Concatenate all informative text columns into one rich feature string per row
TEXT_COLS = [
    "crop",
    "disease_name",
    "disease_type",
    "scientific_name",
    "symptoms",
    "causes",
    "visual_detection_cues",
]

df["feature_text"] = (
    df[TEXT_COLS]
    .fillna("")
    .apply(lambda row: " ".join(str(v) for v in row), axis=1)
    .str.lower()
)

X = df["feature_text"].tolist()
y = df["disease_name"].tolist()

# ── Build Pipeline ────────────────────────────────────────────────────────────
print("\n🔧  Building TF-IDF + RandomForest pipeline …")
pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 3),
        min_df=1,
        max_features=10_000,
        sublinear_tf=True,
    )),
    ("clf", RandomForestClassifier(
        n_estimators=500,
        max_depth=None,
        min_samples_split=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )),
])

# ── Cross-Validation (StratifiedKFold with n_splits=3 for small dataset) ─────
print("\n📊  Running 3-fold cross-validation …")
cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
scores = cross_val_score(pipeline, X, y, cv=cv, scoring="accuracy")
print(f"    CV Accuracy: {scores.mean():.3f} ± {scores.std():.3f}")

# ── Train on full dataset ─────────────────────────────────────────────────────
print("\n🚀  Training on full dataset …")
pipeline.fit(X, y)

# Full training accuracy
preds = pipeline.predict(X)
print("\n📋  Classification Report (train set):")
print(classification_report(y, preds, zero_division=0))

# ── Save Model ────────────────────────────────────────────────────────────────
print(f"\n💾  Saving model → {MODEL_PATH}")
joblib.dump(pipeline, MODEL_PATH, compress=3)

# ── Build Disease Lookup DB ──────────────────────────────────────────────────
# Index every row by disease_name for fast O(1) lookup at inference time
print(f"💾  Building disease DB → {DB_PATH}")

SEVERITY_CONFIDENCE = {"High": (82.0, 97.0), "Medium": (72.0, 89.0), "Low": (65.0, 84.0)}

disease_db: dict = {}
for _, row in df.iterrows():
    name = row["disease_name"]
    severity = row.get("severity", "Medium")
    conf_range = SEVERITY_CONFIDENCE.get(severity, (70.0, 90.0))

    # Build 3 treatment tips from cure_treatment (split by semicolons or periods)
    raw_cure = str(row.get("cure_treatment", "")).strip()
    tips: list[str] = []
    for delim in (";", "."):
        parts = [p.strip() for p in raw_cure.split(delim) if p.strip()]
        if len(parts) >= 2:
            tips = parts[:3]
            break
    if not tips:
        tips = [raw_cure] if raw_cure else ["Follow standard agronomic practices."]

    # Build 3 prevention tips
    raw_prev = str(row.get("prevention_suggestions", "")).strip()
    prev_tips: list[str] = []
    for delim in (";", "."):
        parts = [p.strip() for p in raw_prev.split(delim) if p.strip()]
        if len(parts) >= 2:
            prev_tips = parts[:3]
            break
    if not prev_tips:
        prev_tips = [raw_prev] if raw_prev else ["Follow standard prevention protocols."]

    disease_db[name] = {
        "crop":                   str(row.get("crop", "")),
        "disease_type":           str(row.get("disease_type", "")),
        "scientific_name":        str(row.get("scientific_name", "")),
        "symptoms":               str(row.get("symptoms", "")),
        "causes":                 str(row.get("causes", "")),
        "visual_detection_cues":  str(row.get("visual_detection_cues", "")),
        "treatment_tips":         tips,
        "prevention_tips":        prev_tips,
        "severity":               severity,
        "confidence_range":       list(conf_range),
        "feature_text":           row["feature_text"],
    }

with open(DB_PATH, "w", encoding="utf-8") as f:
    json.dump(disease_db, f, indent=2, ensure_ascii=False)

print(f"    Saved {len(disease_db)} disease entries.")
print("\n✅  Training complete! Model ready for inference.")
