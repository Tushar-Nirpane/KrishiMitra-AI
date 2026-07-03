import os
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from .. import models
import openai
from openai import OpenAI

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Initialize OpenAI client if key is present
client = None
if OPENAI_API_KEY:
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception:
        pass

# Regional translation of templates for simple agricultural voice responses
RESPONSES = {
    "en": {
        "cotton_yellow": (
            "Namaste! Based on your soil report, your Nitrogen is low ({n} ppm) and there has been "
            "no rain for 7 days. This dry spell combined with low Nitrogen is making your cotton leaves turn yellow. "
            "Please apply 25 kg of Urea per acre and irrigate the field. Could you upload a photo of the leaf "
            "using the Camera tab so our AI can check for Leaf Blight?"
        ),
        "soil_advice": (
            "Hello! Your soil shows N: {n} ppm, P: {p} ppm, K: {k} ppm, and pH: {ph}. "
            "For a healthy crop, you should maintain these levels. Applying organic compost will help boost carbon."
        ),
        "general_hello": (
            "Welcome to KrishiMitra! I am your voice helper. You can ask me about crop recommendations, "
            "fertilizer dosages, or tell me about your crop health. How can I help you today?"
        ),
        "unknown": (
            "I heard you. I suggest checking your soil moisture and applying organic fertilizers. "
            "Can you upload a leaf photo or ask a specific question about your crop?"
        )
    },
    "hi": {
        "cotton_yellow": (
            "नमस्ते! आपकी मिट्टी की रिपोर्ट के अनुसार, नाइट्रोजन कम ({n} ppm) है और 7 दिनों से "
            "बारिश नहीं हुई है। सूखे और कम नाइट्रोजन के कारण आपके कपास के पत्ते पीले पड़ रहे हैं। "
            "कृपया प्रति एकड़ 25 किलो यूरिया डालें और खेत की सिंचाई करें। क्या आप कैमरा टैब का उपयोग करके "
            "पत्ते की एक फोटो अपलोड कर सकते हैं ताकि हमारी एआई बीमारी की जांच कर सके?"
        ),
        "soil_advice": (
            "नमस्ते! आपकी मिट्टी की रिपोर्ट में N: {n} ppm, P: {p} ppm, K: {k} ppm, और pH: {ph} है। "
            "फसल को स्वस्थ रखने के लिए आपको इन स्तरों को बनाए रखना चाहिए। जैविक खाद डालने से मदद मिलेगी।"
        ),
        "general_hello": (
            "कृषिमित्र में आपका स्वागत है! मैं आपका वॉयस सहायक हूं। आप मुझसे फसल की सिफारिशें, "
            "उर्वरक की खुराक के बारे में पूछ सकते हैं, या मुझे अपनी फसल के स्वास्थ्य के बारे में बता सकते हैं। मैं आपकी कैसे मदद कर सकता हूं?"
        ),
        "unknown": (
            "मैंने आपकी बात सुनी। मेरा सुझाव है कि अपनी मिट्टी की नमी की जांच करें और जैविक खाद डालें। "
            "क्या आप एक पत्ते की फोटो अपलोड कर सकते हैं या अपनी फसल के बारे में कोई विशिष्ट प्रश्न पूछ सकते हैं?"
        )
    },
    "te": {
        "cotton_yellow": (
            "నమస్తే! మీ మట్టి నివేదిక ప్రకారం, నత్రజని (Nitrogen) తక్కువగా ({n} ppm) ఉంది మరియు 7 రోజులుగా "
            "వర్షం లేదు. ఈ పొడి వాతావరణం మరియు తక్కువ నత్రజని వల్ల మీ పత్తి ఆకులు పసుపు రంగులోకి మారుతున్నాయి. "
            "దయచేసి ఎకరానికి 25 కిలోల యూరియా వేసి పొలానికి నీరు పెట్టండి. ఆకు తెగులును మా AI తనిఖీ చేయడానికి "
            "కెమెరా ట్యాబ్ ద్వారా ఫోటో అప్‌లోడ్ చేయగలరా?"
        ),
        "soil_advice": (
            "నమస్తే! మీ మట్టిలో N: {n} ppm, P: {p} ppm, K: {k} ppm, మరియు pH: {ph} ఉన్నాయి. "
            "పంట ఆరోగ్యంగా ఉండటానికి ఈ శాతం నిలబెట్టుకోవాలి. సేంద్రీయ ఎరువులు వేయడం మంచిది."
        ),
        "general_hello": (
            "కృషిమిత్రకు స్వాగతం! నేను మీ వాయిస్ అసిస్టెంట్ ని. మీరు నన్ను పంటల సిఫార్సులు, ఎరువుల మోతాదుల "
            "గురించి అడగవచ్చు. ఈరోజు మీకు నేను ఎలా సహాయం చేయగలను?"
        ),
        "unknown": (
            "నేను మీ ప్రశ్నను విన్నాను. మట్టి తేమను తనిఖీ చేసి, సేంద్రీయ ఎరువులు వేయాలని సూచిస్తున్నాను. "
            "ఆకు ఫోటోను అప్‌లోడ్ చేస్తారా లేదా పంట గురించి ఏదైనా అడుగుతారా?"
        )
    },
    "mr": {
        "cotton_yellow": (
            "नमस्ते! तुमच्या मातीच्या अहवालानुसार, नायट्रोजन कमी ({n} ppm) आहे आणि ७ दिवसांपासून पाऊस पडलेला नाही. "
            "या कोरड्या हवामानामुळे आणि कमी नायट्रोजनमुळे तुमच्या कापसाची पाने पिवळी पडत आहेत. कृपया प्रति एकर २५ किलो युरिया टाका "
            "आणि शेताला पाणी द्या. पानांवरील रोगाची तपासणी करण्यासाठी कृपया कॅमेरा टॅब वापरून पानाचा फोटो अपलोड करा."
        ),
        "soil_advice": (
            "नमस्ते! तुमच्या मातीच्या अहवालानुसार N: {n} ppm, P: {p} ppm, K: {k} ppm, आणि pH: {ph} आहे. "
            "चांगल्या पिकासाठी ही पातळी राखणे आवश्यक आहे. सेंद्रिय खतांचा वापर करा."
        ),
        "general_hello": (
            "कृषीमित्र मध्ये आपले स्वागत आहे! मी तुमचा वॉयस सहाय्यक आहे. तुम्ही मला पीक शिफारसी, "
            "खतांचे प्रमाण विचारू शकता. मी तुमची कशी मदत करू शकतो?"
        ),
        "unknown": (
            "मी तुमचे ऐकले आहे. मी मातीची आर्द्रता तपासण्याची आणि सेंद्रिय खते वापरण्याची शिफारस करतो. "
            "तुम्ही पानाचा फोटो अपलोड करू शकता का किंवा तुमच्या पिकाबद्दल काही विशिष्ट प्रश्न विचारू शकता का?"
        )
    }
}

def transcribe_voice_bytes(audio_bytes: bytes) -> str:
    """
    Simulates speech-to-text transcription using OpenAI Whisper.
    If key is not available, returns a simulated text query based on length.
    """
    if client:
        try:
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
                temp_audio.write(audio_bytes)
                temp_audio_path = temp_audio.name
            
            with open(temp_audio_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
                return transcript.text
        except Exception:
            pass
            
    # Mock voice transcription fallback
    return "Why is my cotton yellow?"

def get_agricultural_reasoning(
    message: str, 
    farmer_id: Optional[int], 
    farm_id: Optional[int], 
    language: str, 
    db: Session
) -> Dict[str, Any]:
    """
    Handles LLM agricultural reasoning.
    If OPENAI_API_KEY is available, queries GPT-4o with farmer's context.
    Otherwise, uses the multilingual agricultural advisory rule engine.
    """
    lang = language.lower()
    if lang not in RESPONSES:
        lang = "en"

    # Default values if no database records exist
    n_val, p_val, k_val, ph_val = 45.0, 35.0, 42.0, 6.5
    
    # Try to load real farmer soil data to enrich the prompt/reasoning
    if farm_id:
        farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
        if farm:
            n_val = farm.nitrogen
            p_val = farm.phosphorus
            k_val = farm.potassium
            ph_val = farm.ph
    elif farmer_id:
        farmer = db.query(models.Farmer).filter(models.Farmer.id == farmer_id).first()
        if farmer and farmer.farms:
            farm = farmer.farms[0]
            n_val = farm.nitrogen
            p_val = farm.phosphorus
            k_val = farm.potassium
            ph_val = farm.ph
            
    msg_lower = message.lower()

    if client:
        try:
            # Call OpenAI GPT-4o
            prompt = (
                f"You are a friendly regional agricultural voice assistant named KrishiMitra. "
                f"Speak in simple, regional terms for a farmer. The farmer's language preference is {lang}.\n"
                f"Farmer's Soil Data: Nitrogen={n_val} ppm, Phosphorus={p_val} ppm, Potassium={k_val} ppm, pH={ph_val}.\n"
                f"Weather alert: 7-day rainfall is 0mm (dry spell).\n"
                f"Farmer asks: '{message}'.\n"
                f"Explain the issue. If they ask about yellow cotton, connect it to low Nitrogen ({n_val} ppm) "
                f"and dry spell. Request them to upload a photo of the leaf. Keep it short (under 4 sentences)."
            )
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are KrishiMitra AI, an expert agricultural advisor."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.7
            )
            reply = response.choices[0].message.content
            suggest = None
            if "photo" in reply.lower() or "upload" in reply.lower() or "camera" in reply.lower():
                suggest = "request_photo"
            return {
                "reply": reply,
                "suggest_action": suggest,
                "language": lang
            }
        except Exception:
            pass

    # Expert mock rule-based reasoning matching user flows
    if "cotton" in msg_lower or "yellow" in msg_lower or "कपास" in msg_lower or "పత్తి" in msg_lower or "పీలా" in msg_lower or "పసుపు" in msg_lower or "कापूस" in msg_lower or "पिवळी" in msg_lower:
        reply = RESPONSES[lang]["cotton_yellow"].format(n=round(n_val, 1))
        suggest = "request_photo"
    elif "soil" in msg_lower or "report" in msg_lower or "मिट्टी" in msg_lower or "మట్టి" in msg_lower or "माती" in msg_lower:
        reply = RESPONSES[lang]["soil_advice"].format(
            n=round(n_val, 1), p=round(p_val, 1), k=round(k_val, 1), ph=round(ph_val, 1)
        )
        suggest = None
    elif "hello" in msg_lower or "hi" in msg_lower or "namaste" in msg_lower or "नमस्ते" in msg_lower or "నమస్తే" in msg_lower:
        reply = RESPONSES[lang]["general_hello"]
        suggest = None
    else:
        reply = RESPONSES[lang]["unknown"]
        suggest = None

    return {
        "reply": reply,
        "suggest_action": suggest,
        "language": lang
    }
