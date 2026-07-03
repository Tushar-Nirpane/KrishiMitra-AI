import { useState, useEffect } from "react";

const TRANSLATIONS = {
  en: {
    appName: "KrishiMitra AI",
    onboarding: "Farmer Onboarding",
    enterDetails: "Enter your soil test values and farm details below:",
    farmerName: "Farmer Name",
    phoneNumber: "Phone Number",
    acreage: "Farm Size (Acres)",
    location: "Location Coordinates",
    getCoordinates: "Get Device Location",
    submitOnboarding: "Onboard Farm",
    
    // Soil Parameters
    nitrogen: "Nitrogen (N)",
    phosphorus: "Phosphorus (P)",
    potassium: "Potassium (K)",
    ph: "Soil pH (0-14)",
    organicCarbon: "Organic Carbon (%)",
    soilReport: "Soil Nutrient Report",
    
    // Dashboard / Tabs
    tabHome: "Home",
    tabChat: "Chat",
    tabCamera: "Camera",
    tabMarket: "Market",
    tabExpert: "Expert",
    
    // Home Dashboard
    farmHealthScore: "Farm Health Score",
    nextTask: "Next Task",
    satelliteView: "NDVI Satellite Vegetative Index",
    cropRecommendations: "Crop Advisor",
    weatherAlerts: "Weather & Irrigation Warnings",
    offlineMode: "Offline Mode (Simulated)",
    offlineNotice: "You are currently viewing offline cached recommendations.",
    onlineMode: "Online Mode",
    explainWhy: "Why this recommendation?",
    
    // Camera
    cameraTitle: "Leaf Disease Scanner",
    uploadPrompt: "Take a photo or upload an image of an infected leaf",
    diagnoseBtn: "Scan Leaf for Disease",
    scanning: "Analyzing image with YOLOv11/EfficientNet...",
    resultTitle: "Diagnosis Result",
    confidence: "Model Confidence",
    treatmentTips: "Actionable Treatment Plan",
    expertEscalated: "Ticket created: Sent to Rythu Seva Kendra expert.",
    
    // Chat
    chatTitle: "AI Agricultural Voice Assistant",
    micTapPrompt: "Tap the microphone to speak or type your question below.",
    cottonYellowQuery: "Ask: 'Why is my cotton yellow?'",
    inputPlaceholder: "Ask something in simple regional terms...",
    send: "Send",
    speakReply: "Listen to advice",
    
    // Expert
    expertTitle: "Rythu Seva Kendra Expert Dashboard",
    expertSubtitle: "Unresolved High Risk & Low Confidence Tickets",
    farmerInfo: "Farmer",
    farmDetails: "Farm",
    riskLevel: "Risk Level",
    resolvedBtn: "Mark Resolved",
    noTickets: "All tickets resolved! No pending high-risk tasks.",
    
    // Market
    marketTitle: "Regional Mandi & Input Prices",
    cropPrice: "Current Market Rate",
    fertilizerCost: "Fertilizer / Pesticide Inputs",
    buyNow: "Purchase Seeds/Urea"
  },
  hi: {
    appName: "कृषिमित्र एआई",
    onboarding: "किसान पंजीकरण",
    enterDetails: "कृपया अपनी मिट्टी के परीक्षण का मान और खेत का विवरण नीचे भरें:",
    farmerName: "किसान का नाम",
    phoneNumber: "फोन नंबर",
    acreage: "खेत का आकार (एकड़)",
    location: "स्थान निर्देशांक (लोकेशन)",
    getCoordinates: "वर्तमान लोकेशन प्राप्त करें",
    submitOnboarding: "खेत पंजीकृत करें",
    
    nitrogen: "नाइट्रोजन (N)",
    phosphorus: "फास्फोरस (P)",
    potassium: "पोटेशियम (K)",
    ph: "मिट्टी का पीएच (pH)",
    organicCarbon: "जैविक कार्बन (%)",
    soilReport: "मिट्टी पोषक तत्व रिपोर्ट",
    
    tabHome: "मुख्य पृष्ठ",
    tabChat: "चैट सहायक",
    tabCamera: "कैमरा जांच",
    tabMarket: "मंडी दर",
    tabExpert: "विशेषज्ञ",
    
    farmHealthScore: "खेत का स्वास्थ्य स्कोर",
    nextTask: "अगला कार्य",
    satelliteView: "एनडीवीआई उपग्रह वानस्पतिक सूचकांक",
    cropRecommendations: "फसल सलाहकार",
    weatherAlerts: "मौसम और सिंचाई चेतावनी",
    offlineMode: "ऑफलाइन मोड (सिम्युलेटेड)",
    offlineNotice: "आप वर्तमान में ऑफलाइन संचित (कैश) सिफारिशें देख रहे हैं।",
    onlineMode: "ऑनलाइन मोड",
    explainWhy: "यह सिफारिश क्यों?",
    
    cameraTitle: "पत्ती रोग स्कैनर",
    uploadPrompt: "संक्रमित पत्ती की फोटो लें या अपलोड करें",
    diagnoseBtn: "रोग के लिए पत्ती स्कैन करें",
    scanning: "यौलो (YOLOv11)/एफीशिएंटनेट मॉडल विश्लेषण चालू है...",
    resultTitle: "जांच का परिणाम",
    confidence: "मॉडल का विश्वास",
    treatmentTips: "उपचार योजना",
    expertEscalated: "शिकायत दर्ज की गई: रायतू सेवा केंद्र विशेषज्ञ को भेजा गया।",
    
    chatTitle: "एआई कृषि वॉयस सहायक",
    micTapPrompt: "बोलने के लिए माइक दबाएं या नीचे अपना प्रश्न टाइप करें।",
    cottonYellowQuery: "पूछें: 'कपास का पत्ता पीला क्यों है?'",
    inputPlaceholder: "सरल क्षेत्रीय शब्दों में कुछ पूछें...",
    send: "भेजें",
    speakReply: "सलाह सुनें",
    
    expertTitle: "रायतू सेवा केंद्र विशेषज्ञ डैशबोर्ड",
    expertSubtitle: "अनसुलझी उच्च जोखिम और कम आत्मविश्वास वाली शिकायतें",
    farmerInfo: "किसान",
    farmDetails: "खेत का विवरण",
    riskLevel: "जोखिम का स्तर",
    resolvedBtn: "सुलझाया गया मार्क करें",
    noTickets: "सभी शिकायतें सुलझ गईं! कोई लंबित काम नहीं है।",
    
    marketTitle: "क्षेत्रीय मंडी और इनपुट दरें",
    cropPrice: "वर्तमान मंडी भाव",
    fertilizerCost: "उर्वरक / कीटनाशक इनपुट",
    buyNow: "बीज/यूरिया खरीदें"
  },
  te: {
    appName: "కృషిమిత్ర AI",
    onboarding: "రైతు నమోదు",
    enterDetails: "దయచేసి మీ మట్టి పరీక్ష విలువలు మరియు పొలం వివరాలను నమోదు చేయండి:",
    farmerName: "రైతు పేరు",
    phoneNumber: "ఫోన్ నెంబర్",
    acreage: "పొలం పరిమాణం (ఎకరాలు)",
    location: "పొలం స్థానం (Location)",
    getCoordinates: "ప్రస్తుత స్థానాన్ని పొందండి",
    submitOnboarding: "పొలాన్ని నమోదు చేయి",
    
    nitrogen: "నత్రజని (N)",
    phosphorus: "భాస్వరం (P)",
    potassium: "పొటాషియం (K)",
    ph: "మట్టి pH విలువ",
    organicCarbon: "సేంద్రీయ కర్బనం (%)",
    soilReport: "మట్టి పోషకాల నివేదిక",
    
    tabHome: "హోమ్",
    tabChat: "వాయిస్ చాట్",
    tabCamera: "కెమెరా స్కాన్",
    tabMarket: "మార్కెట్ ధరలు",
    tabExpert: "నిపుణుడు",
    
    farmHealthScore: "పొలం ఆరోగ్య స్కోరు",
    nextTask: "తదుపరి పని",
    satelliteView: "NDVI శాటిలైట్ వెజిటేటివ్ ఇండెక్స్",
    cropRecommendations: "పంట సలహాదారు",
    weatherAlerts: "వాతావరణ & నీటిపారుదల హెచ్చరికలు",
    offlineMode: "ఆఫ్‌లైన్ మోడ్ (Simulated)",
    offlineNotice: "మీరు ప్రస్తుతం ఆఫ్‌లైన్ సేవ్ చేసిన పంట సిఫార్సులను చూస్తున్నారు.",
    onlineMode: "ఆన్‌లైన్ మోడ్",
    explainWhy: "ఈ సిఫార్సు ఎందుకు?",
    
    cameraTitle: "ఆకు తెగులు స్కాన్",
    uploadPrompt: "తెగులు సోకిన ఆకు ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి",
    diagnoseBtn: "తెగులు కోసం ఆకును స్కాన్ చేయి",
    scanning: "YOLOv11/EfficientNet తో విశ్లేషిస్తోంది...",
    resultTitle: "రోగ నిర్ధారణ ఫలితం",
    confidence: "నమ్మకమైన శాతం",
    treatmentTips: "నివారణా చర్యలు",
    expertEscalated: "సమస్య నమోదు చేయబడింది: రైతు సేవా కేంద్రం నిపుణుడికి పంపబడింది.",
    
    chatTitle: "AI వ్యవసాయ వాయిస్ అసిస్టెంట్",
    micTapPrompt: "మాట్లాడటానికి మైక్రోఫోన్ నొక్కండి లేదా మీ ప్రశ్నను టైప్ చేయండి.",
    cottonYellowQuery: "అడగండి: 'నా పత్తి ఆకులు ఎందుకు పసుపు రంగులో ఉన్నాయి?'",
    inputPlaceholder: "సాధారణ ప్రాంతీయ భాషలో అడగండి...",
    send: "పంపు",
    speakReply: "సలహా వినండి",
    
    expertTitle: "రైతు సేవా కేంద్రం నిపుణుల డ్యాష్‌బోర్డ్",
    expertSubtitle: "పరిష్కరించని అధిక ప్రమాదం & తక్కువ నమ్మకమైన టిక్కెట్లు",
    farmerInfo: "రైతు",
    farmDetails: "పొలం వివరాలు",
    riskLevel: "ప్రమాద స్థాయి",
    resolvedBtn: "పరిష్కరించబడింది",
    noTickets: "అన్ని సమస్యలు పరిష్కరించబడ్డాయి! పెండింగ్ పనులు లేవు.",
    
    marketTitle: "ప్రాంతీయ మార్కెట్ & ఇన్పుट ధరలు",
    cropPrice: "ప్రస్తుత మార్కెట్ ధర",
    fertilizerCost: "ఎరువులు / పురుగుమందులు",
    buyNow: "విత్తనాలు/యూరియా కొనుగోలు"
  },
  mr: {
    appName: "कृषीमित्र AI",
    onboarding: "शेतकरी नोंदणी",
    enterDetails: "कृपया तुमच्या माती चाचणीचे मूल्य आणि शेताचा तपशील खाली भरा:",
    farmerName: "शेतकऱ्याचे नाव",
    phoneNumber: "फोन नंबर",
    acreage: "शेताचा आकार (एकर)",
    location: "स्थान निर्देशांक",
    getCoordinates: "सध्याचे स्थान मिळवा",
    submitOnboarding: "शेत नोंदणी करा",
    
    nitrogen: "नायट्रोजन (N)",
    phosphorus: "फॉस्फरस (P)",
    potassium: "पोटॅशियम (K)",
    ph: "मातीचा पीएच (pH)",
    organicCarbon: "सेंद्रिय कर्ब (%)",
    soilReport: "माती पोषक तत्व अहवाल",
    
    tabHome: "मुख्यपृष्ठ",
    tabChat: "चॅट सहाय्यक",
    tabCamera: "कॅमेरा",
    tabMarket: "बाजार भाव",
    tabExpert: "तज्ज्ञ",
    
    farmHealthScore: "शेताचे आरोग्य स्कोअर",
    nextTask: "पुढील काम",
    satelliteView: "एनडीव्हीआय उपग्रह वनस्पती निर्देशांक",
    cropRecommendations: "पीक सल्लागार",
    weatherAlerts: "हवामान आणि सिंचन चेतावणी",
    offlineMode: "ऑफलाइन मोड (सिम्युलेटेड)",
    offlineNotice: "तुम्ही सध्या ऑफलाइन जतन केलेल्या शिफारसी पाहत आहात.",
    onlineMode: "ऑनलाइन मोड",
    explainWhy: "ही शिफारस का?",
    
    cameraTitle: "पानांचे रोग स्कॅनर",
    uploadPrompt: "संक्रमित पानाचा फोटो घ्या किंवा अपलोड करा",
    diagnoseBtn: "रोगासाठी पान स्कॅन करा",
    scanning: "YOLOv11/EfficientNet मॉडेलद्वारे विश्लेषण सुरू आहे...",
    resultTitle: "तपासणीचा निकाल",
    confidence: "मॉडेलचा विश्वास",
    treatmentTips: "उपचार योजना",
    expertEscalated: "तक्रार नोंदवली: शेतकरी सेवा केंद्र तज्ज्ञांकडे पाठवली आहे.",
    
    chatTitle: "एआय कृषी वॉयस सहाय्यक",
    micTapPrompt: "बोलण्यासाठी माईक दाबा किंवा खाली तुमचा प्रश्न टाईप करा.",
    cottonYellowQuery: "विचारा: 'माझे कापूस पिवळे का आहे?'",
    inputPlaceholder: "सोप्या प्रादेशिक शब्दांत काहीही विचारा...",
    send: "पाठवा",
    speakReply: "सल्ला ऐका",
    
    expertTitle: "शेतकरी सेवा केंद्र तज्ज्ञ डॅशबोर्ड",
    expertSubtitle: "न सुटलेल्या उच्च जोखीम तक्रारी",
    farmerInfo: "शेतकरी",
    farmDetails: "शेताचा तपशील",
    riskLevel: "जोखीम पातळी",
    resolvedBtn: "निकालात काढा",
    noTickets: "सर्व तक्रारी सुटल्या आहेत! प्रलंबित काम नाही.",
    
    marketTitle: "प्रादेशिक बाजार आणि इनपुट भाव",
    cropPrice: "सध्याचे बाजार भाव",
    fertilizerCost: "खते / कीटकनाशके दर",
    buyNow: "बियाणे/युरिया खरेदी करा"
  }
};

export function useTranslation() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("krishimitra_lang") || "en";
  });

  const changeLanguage = (newLang) => {
    if (TRANSLATIONS[newLang]) {
      setLang(newLang);
      localStorage.setItem("krishimitra_lang", newLang);
    }
  };

  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;
  };

  return { t, lang, changeLanguage };
}
