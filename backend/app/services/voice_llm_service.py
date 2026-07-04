"""
voice_llm_service.py
====================
Uses a trained TF-IDF + Logistic Regression intent classifier
(chatbot_classifier.pkl) and a full intent knowledge-base
(chatbot_db.json), both generated from krishimitra_chatbot_database.json
by train_chatbot_model.py.

Inference flow
--------------
1. Receive user message text.
2. Run intent classifier → top-3 intents with probabilities.
3. Keyword pre-filter can override weak ML matches.
4. Look up answer + suggested_action from chatbot_db.json.
5. If OPENAI_API_KEY is present, call GPT-4o for richer answers (optional).
6. Return reply in the user's language.
"""

import json, os, pathlib, re, logging
from typing import Any, Dict, Optional

import joblib
import numpy as np
from sqlalchemy.orm import Session

from .. import models

logger = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────────────────
_ML_DIR      = pathlib.Path(__file__).parent.parent / "ml_models"
_PKL         = _ML_DIR / "chatbot_classifier.pkl"
_DB_JSON     = _ML_DIR / "chatbot_db.json"

# ── Load artefacts at import time ─────────────────────────────────────────────
_model_payload = None
_pipeline      = None
_le            = None
_chatbot_db: Dict[str, Any] = {}

def _load():
    global _model_payload, _pipeline, _le, _chatbot_db
    if _PKL.exists():
        try:
            _model_payload = joblib.load(_PKL)
            _pipeline      = _model_payload["pipeline"]
            _le            = _model_payload["label_encoder"]
            logger.info("✅  Chatbot classifier loaded (%d intents)", len(_le.classes_))
        except Exception as exc:
            logger.error("Failed to load chatbot_classifier.pkl: %s", exc)
    else:
        logger.warning("⚠️  chatbot_classifier.pkl not found — using rule-based fallback")

    if _DB_JSON.exists():
        try:
            with open(_DB_JSON, encoding="utf-8") as fh:
                _chatbot_db = json.load(fh)
            logger.info("✅  Chatbot DB loaded: %d intents", len(_chatbot_db))
        except Exception as exc:
            logger.error("Failed to load chatbot_db.json: %s", exc)

_load()

# ── Optional OpenAI client ────────────────────────────────────────────────────
_openai_client = None
_OPENAI_KEY    = os.getenv("OPENAI_API_KEY", "")
if _OPENAI_KEY:
    try:
        import openai
        from openai import OpenAI
        _openai_client = OpenAI(api_key=_OPENAI_KEY)
        logger.info("✅  OpenAI client ready")
    except Exception as exc:
        logger.warning("OpenAI client init failed: %s", exc)

# ── Multilingual translations for the DB answers ──────────────────────────────
# Short prefixes/suffixes injected per-language so the answer feels natural
_LANG_PREFIX = {
    "hi": "नमस्ते! 🌾 ",
    "te": "నమస్తే! 🌾 ",
    "mr": "नमस्ते! 🌾 ",
    "en": "",
}
_LANG_SUFFIX = {
    "hi": " किसी और सहायता के लिए पूछें।",
    "te": " ఇంకా సహాయం కావాలంటే అడగండి.",
    "mr": " आणखी काही मदत हवी असल्यास विचारा.",
    "en": "",
}

# ── Keyword override map: pattern → intent ────────────────────────────────────
_KW_OVERRIDES = [
    (r"\byellow\b|\bpale\b|\bpilli\b",                         "yellowing_leaves_deficiency"),
    (r"\bcotton\b|\bkapas\b|\bkapus\b",                        "cotton_care_general"),
    (r"\brice\b|\bpaddy\b|\bdhaan\b",                          "rice_care_general"),
    (r"\btomato\b",                                             "tomato_care_general"),
    (r"\bdrip\b",                                               "drip_irrigation_benefit"),
    (r"\bwaterlog\b|\bflood\b|\bexcess water\b",                "waterlogging_problem"),
    (r"\bpmfby\b|\binsurance\b|\bbima\b",                       "crop_insurance_info"),
    (r"\bpm.kisan\b|\bkisan yojna\b",                          "pm_kisan_info"),
    (r"\bkcc\b|\bkisan credit\b|\bloan\b",                     "kisan_credit_card"),
    (r"\bsoil test\b|\bsoil health card\b|\bshc\b",            "soil_health_card"),
    (r"\borganic\b|\bneem\b|\bbio.fungicide\b",                "organic_treatment_request"),
    (r"\bseed treat\b|\bthiram\b|\bcarbendazim\b",             "seed_treatment_question"),
    (r"\burea\b|\bfertilizer dose\b|\bhow much.*fertilizer\b", "how_much_fertilizer"),
    (r"\bipm\b|\bintegrated pest\b",                           "ipm_question"),
    (r"\bspread\b.*disease|disease.*\bspread\b",               "disease_spreading_fear"),
    (r"\bstore\b|\bstorage\b|\bweevil\b|\bgrain pest\b",       "storage_advice"),
    (r"\bharvest loss\b|\bpost.harvest\b|\bspoil\b",           "reduce_post_harvest_loss"),
    (r"\baccurate\b|\btrust\b|\bwrong result\b",               "app_accuracy_concern"),
    (r"\bhi\b|\bhello\b|\bnamaste\b|\bwelcome\b|\bhey\b",      "greeting"),
    (r"\bthank\b|\bshukriya\b|\bdhanyavad\b",                  "thanks"),
    (r"\bbye\b|\bgoodbye\b|\bgoodnight\b|\bsee you\b",         "goodbye"),
    (r"\bwho are you\b|\bwhat are you\b|\bare you ai\b",       "who_are_you"),
    (r"\bmarket price\b|\bmandi\b|\bmsp\b|\benam\b",           "market_price_query"),
    (r"\bweather\b|\brain\b|\bhumid\b|\bspray.*rain\b",        "weather_and_disease_risk"),
    (r"\bphoto tips\b|\bbetter.*photo\b|\bblurry\b",           "best_photo_tips"),
    (r"\bscan\b.*crop|\bcamera\b.*scan|live scan",             "how_to_scan_crop"),
    (r"\bupload\b.*photo|\bupload\b.*image",                   "how_to_upload_image"),
    (r"\blanguage\b|\bhindi\b|\bmarathi\b|\bregional\b",       "app_language_support"),
    (r"\bdosage\b|\bhow much.*mix\b|\blitre.*water\b",         "dosage_question"),
    (r"\bpesticide.*safe\b|\bphi\b|\bharvest.*spray\b",        "pesticide_safety"),
]

def _keyword_override(msg: str) -> Optional[str]:
    for pattern, intent in _KW_OVERRIDES:
        if re.search(pattern, msg, re.IGNORECASE):
            return intent
    return None

# ── Soil-context formatter ────────────────────────────────────────────────────
def _fmt_soil_answer(answer: str, n, p, k, ph) -> str:
    """Replace any {n}/{p}/{k}/{ph} placeholders in the answer."""
    return (answer
            .replace("{n}", str(round(n, 1)))
            .replace("{p}", str(round(p, 1)))
            .replace("{k}", str(round(k, 1)))
            .replace("{ph}", str(round(ph, 1))))

# ── Rule-based fallback (legacy responses) ────────────────────────────────────
_LEGACY = {
    "en": {
        "cotton_yellow": (
            "Namaste! Your Nitrogen is low ({n} ppm) and there has been no rain for 7 days. "
            "This dry spell combined with low Nitrogen is making your cotton leaves turn yellow. "
            "Apply 25 kg of Urea per acre and irrigate the field. You can also upload a leaf photo in the Camera tab for disease check."
        ),
        "soil_advice": (
            "Your soil shows N: {n} ppm, P: {p} ppm, K: {k} ppm, pH: {ph}. "
            "Apply organic compost to boost carbon and follow your soil test recommendations."
        ),
        "general_hello": (
            "Welcome to KrishiMitra! Ask me about crop diseases, fertilizers, government schemes, "
            "or upload a leaf photo for instant disease detection. How can I help?"
        ),
        "unknown": (
            "I suggest checking your soil moisture and applying organic fertilizers. "
            "Can you upload a leaf photo or ask a specific question about your crop?"
        ),
    },
    "hi": {
        "cotton_yellow": "नमस्ते! नाइट्रोजन कम ({n} ppm) है, कपास पीला पड़ रहा है। 25 किलो यूरिया प्रति एकड़ डालें।",
        "soil_advice":   "मिट्टी में N:{n}, P:{p}, K:{k}, pH:{ph} है। जैविक खाद से सुधारें।",
        "general_hello": "कृषिमित्र में आपका स्वागत है! फसल रोग, उर्वरक, या सरकारी योजना के बारे में पूछें।",
        "unknown":       "मैंने सुना। मिट्टी की नमी जाँचें और पत्ते की फोटो अपलोड करें।",
    },
    "te": {
        "cotton_yellow": "నమస్తే! నత్రజని తక్కువ ({n} ppm). పత్తి ఆకులు పసుపు అవుతున్నాయి. ఎకరానికి 25 కిలోల యూరియా వేయండి.",
        "soil_advice":   "మట్టిలో N:{n}, P:{p}, K:{k}, pH:{ph}. సేంద్రీయ ఎరువు వేయండి.",
        "general_hello": "కృషిమిత్రకు స్వాగతం! పంట తెగులు, ఎరువులు, లేదా పంట ఫోటో పంపండి.",
        "unknown":       "మట్టి తేమ తనిఖీ చేయండి. ఆకు ఫోటో అప్‌లోడ్ చేయండి.",
    },
    "mr": {
        "cotton_yellow": "नमस्ते! नायट्रोजन कमी ({n} ppm). कापूस पिवळा होत आहे. प्रति एकर 25 किलो युरिया वापरा.",
        "soil_advice":   "मातीत N:{n}, P:{p}, K:{k}, pH:{ph}. सेंद्रिय खते वापरा.",
        "general_hello": "कृषीमित्रमध्ये स्वागत! पीक रोग, खते किंवा सरकारी योजनांबद्दल विचारा.",
        "unknown":       "मातीची आर्द्रता तपासा आणि पानाचा फोटो अपलोड करा.",
    },
}


# ── Main inference function ───────────────────────────────────────────────────
def get_agricultural_reasoning(
    message:    str,
    farmer_id:  Optional[int],
    farm_id:    Optional[int],
    language:   str,
    db:         Session,
) -> Dict[str, Any]:
    lang = language.lower() if language.lower() in ("en", "hi", "te", "mr") else "en"
    msg  = message.strip()

    # ── Load soil context ────────────────────────────────────────────────────
    n, p, k, ph = 45.0, 35.0, 42.0, 6.5
    if farm_id:
        farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
        if farm:
            n, p, k, ph = farm.nitrogen, farm.phosphorus, farm.potassium, farm.ph
    elif farmer_id:
        farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
        if farmer and farmer.farms:
            farm = farmer.farms[0]
            n, p, k, ph = farm.nitrogen, farm.phosphorus, farm.potassium, farm.ph

    # ── Optional OpenAI path ─────────────────────────────────────────────────
    if _openai_client:
        try:
            prompt = (
                f"You are KrishiMitra AI, a friendly agricultural assistant. "
                f"Respond concisely in {lang} language. "
                f"Farmer soil: N={n}, P={p}, K={k}, pH={ph}. "
                f"Farmer asks: '{msg}'. "
                f"Answer in under 4 sentences, in simple language suitable for a farmer."
            )
            resp = _openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.7,
            )
            reply   = resp.choices[0].message.content
            suggest = "request_photo" if any(w in reply.lower() for w in ("photo", "upload", "camera", "image")) else None
            return {"reply": reply, "suggest_action": suggest, "language": lang}
        except Exception as exc:
            logger.warning("OpenAI call failed: %s", exc)

    # ── ML classifier path ───────────────────────────────────────────────────
    if _pipeline is not None and _chatbot_db:
        q_lower  = msg.lower()

        # 1. Keyword override (highest precision)
        kw_intent = _keyword_override(q_lower)

        # 2. ML prediction
        proba  = _pipeline.predict_proba([q_lower])[0]
        top_idx = int(np.argmax(proba))
        ml_intent = _le.inverse_transform([top_idx])[0]
        ml_conf   = float(proba[top_idx])

        # Choose: keyword wins if ML confidence < 40%, otherwise prefer ML
        intent = kw_intent if (kw_intent and ml_conf < 0.40) else ml_intent
        # But always honour a strong keyword hit
        if kw_intent and intent != kw_intent:
            intent = kw_intent

        info = _chatbot_db.get(intent)
        if info:
            raw_answer = info["answer"]
            # Inject soil context into placeholders if present
            answer = _fmt_soil_answer(raw_answer, n, p, k, ph)

            # Add language flavour
            prefix = _LANG_PREFIX.get(lang, "")
            suffix = _LANG_SUFFIX.get(lang, "")
            if lang != "en":
                # Attach a short native note, keep the answer (it's in English from DB)
                reply = f"{prefix}{answer}{suffix}"
            else:
                reply = answer

            suggested_action = info.get("suggested_action")

            logger.info("Chatbot: intent=%s conf=%.0f%% lang=%s", intent, ml_conf * 100, lang)
            return {"reply": reply, "suggest_action": suggested_action, "language": lang}

    # ── Legacy rule-based fallback ────────────────────────────────────────────
    logger.warning("Chatbot: falling back to legacy rules")
    msg_l = msg.lower()
    res   = _LEGACY.get(lang, _LEGACY["en"])

    if any(k in msg_l for k in ("cotton", "yellow", "कपास", "పత్తి", "కాటన్", "कापूस", "पिवळी", "పసుపు")):
        reply, suggest = res["cotton_yellow"].format(n=round(n, 1)), "request_photo"
    elif any(k in msg_l for k in ("soil", "report", "मिट्टी", "మట్టి", "माती")):
        reply, suggest = res["soil_advice"].format(n=round(n,1), p=round(p,1), k=round(k,1), ph=round(ph,1)), None
    elif any(k in msg_l for k in ("hello", "hi", "namaste", "नमस्ते", "నమస్తే")):
        reply, suggest = res["general_hello"], None
    else:
        reply, suggest = res["unknown"], None

    return {"reply": reply, "suggest_action": suggest, "language": lang}
