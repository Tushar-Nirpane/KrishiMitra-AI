"""
train_chatbot_model.py
======================
Trains a TF-IDF + Logistic Regression intent classifier on
krishimitra_chatbot_database.json.

Outputs
-------
app/ml_models/chatbot_classifier.pkl  — sklearn pipeline
app/ml_models/chatbot_db.json         — full intent→answer lookup
"""

import json, pathlib, sys
import numpy as np
import joblib
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score

# ── Paths ────────────────────────────────────────────────────────────────────
BASE   = pathlib.Path(__file__).parent
SRC    = BASE / "krishimitra_chatbot_database.json"
OUT    = BASE / "app" / "ml_models"
OUT.mkdir(parents=True, exist_ok=True)

# ── Load data ────────────────────────────────────────────────────────────────
with open(SRC, encoding="utf-8") as f:
    data = json.load(f)

print(f"✅  Loaded {len(data)} intents from {SRC.name}")

# ── Build training corpus ─────────────────────────────────────────────────────
# Each sample_question → intent label
X, y = [], []
for item in data:
    for q in item["sample_questions"]:
        X.append(q.lower().strip())
        y.append(item["intent"])

print(f"✅  Training samples: {len(X)} questions across {len(set(y))} intents")

# ── Encode labels ─────────────────────────────────────────────────────────────
le = LabelEncoder()
y_enc = le.fit_transform(y)

# ── Pipeline ──────────────────────────────────────────────────────────────────
pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 3),
        sublinear_tf=True,
        min_df=1,
        max_features=5000,
        analyzer="word",
    )),
    ("clf", LogisticRegression(
        C=5.0,
        max_iter=1000,
        solver="lbfgs",
        class_weight="balanced",
    )),
])

# ── Cross-validation ──────────────────────────────────────────────────────────
cv = min(5, len(set(y)))  # can't have more folds than classes
scores = cross_val_score(pipeline, X, y_enc, cv=cv, scoring="accuracy")
print(f"✅  {cv}-fold CV accuracy: {scores.mean():.2%} ± {scores.std():.2%}")

# ── Final fit on all data ─────────────────────────────────────────────────────
pipeline.fit(X, y_enc)
train_acc = pipeline.score(X, y_enc)
print(f"✅  Training accuracy: {train_acc:.2%}")

# ── Save model ────────────────────────────────────────────────────────────────
model_payload = {"pipeline": pipeline, "label_encoder": le}
joblib.dump(model_payload, OUT / "chatbot_classifier.pkl")
print(f"✅  Model saved → {OUT / 'chatbot_classifier.pkl'}")

# ── Build lookup DB (intent → full entry) ─────────────────────────────────────
chatbot_db = {}
for item in data:
    chatbot_db[item["intent"]] = {
        "id":               item["id"],
        "category":         item["category"],
        "intent":           item["intent"],
        "answer":           item["answer"],
        "suggested_action": item["suggested_action"],
        "sample_questions": item["sample_questions"],
    }

with open(OUT / "chatbot_db.json", "w", encoding="utf-8") as f:
    json.dump(chatbot_db, f, indent=2, ensure_ascii=False)
print(f"✅  Lookup DB saved → {OUT / 'chatbot_db.json'}  ({len(chatbot_db)} intents)")

# ── Quick inference demo ──────────────────────────────────────────────────────
print("\n── Sample predictions ──────────────────────────────────────────────────")
demo_queries = [
    "How do I use this app?",
    "my leaves are turning yellow",
    "drip irrigation benefits",
    "how much urea per acre",
    "What is PMFBY?",
    "Namaste",
    "thank you",
    "can this disease spread?",
    "how to store grain?",
    "bugs eating my leaves",
]
for q in demo_queries:
    proba = pipeline.predict_proba([q.lower()])[0]
    idx   = int(np.argmax(proba))
    label = le.inverse_transform([idx])[0]
    conf  = proba[idx] * 100
    info  = chatbot_db.get(label, {})
    print(f"  Q: {q:<45} → [{label:<35}] ({conf:.0f}%) | Cat: {info.get('category','?')}")

print("\n🎉  Chatbot model training complete!")
