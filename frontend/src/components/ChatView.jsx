import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Volume2, User, Sparkles, HelpCircle } from "lucide-react";
import { getOfflineChatHistory, saveOfflineChatHistory } from "../localStorageStore";

const BACKEND_URL = "https://krishimitra-ai-qga4.onrender.com";

export default function ChatView({ t, lang, setTab }) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load chat history from cache
  useEffect(() => {
    const cachedHistory = getOfflineChatHistory();
    if (cachedHistory.length > 0) {
      setMessages(cachedHistory);
    } else {
      // Starting welcome message
      setMessages([
        {
          id: 1,
          sender: "ai",
          text: t("general_hello") || "Namaste! Welcome to KrishiMitra. I am your voice helper.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [lang]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages.length > 0) {
      saveOfflineChatHistory(messages);
    }
  }, [messages]);

  // Configure HTML5 Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      // Set lang dynamically
      if (lang === "hi") rec.lang = "hi-IN";
      else if (lang === "te") rec.lang = "te-IN";
      else rec.lang = "en-US";

      rec.onstart = () => {
        setRecording(true);
      };

      rec.onend = () => {
        setRecording(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputVal(transcript);
        // Automatically send after voice finishes
        handleSendMessage(transcript);
      };

      recognitionRef.current = rec;
    }
  }, [lang]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    if (recording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    setInputVal("");
    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Retrieve farmer IDs to enrich prompt
    const cachedFarmer = localStorage.getItem("krishimitra_farmer");
    const farmer = cachedFarmer ? JSON.parse(cachedFarmer) : null;
    const cachedFarm = localStorage.getItem("krishimitra_farm");
    const farm = cachedFarm ? JSON.parse(cachedFarm) : null;

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          farmer_id: farmer ? farmer.id : null,
          farm_id: farm ? farm.id : null,
          language: lang
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg = {
          id: Date.now() + 1,
          sender: "ai",
          text: data.reply,
          suggest_action: data.suggest_action,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        
        // Auto Text-to-Speech synthesis
        speakOutLoud(data.reply);
      } else {
        throw new Error("Chat response failed");
      }
    } catch (err) {
      console.warn("Backend chat failed, using local response fallback.");
      // Fallback response for cotton yellowing offline
      let fallbackText = "I heard you. Please check your soil moisture.";
      let suggest = null;
      const lower = text.toLowerCase();
      
      if (lower.includes("cotton") || lower.includes("yellow") || lower.includes("कपास") || lower.includes("పత్తి")) {
        if (lang === "te") {
          fallbackText = "నమస్తే! మీ మట్టి నివేదిక ప్రకారం నత్రజని తక్కువగా ఉంది మరియు 7 రోజులుగా వర్షం లేదు. ఈ పొడి వాతావరణం వల్ల ఆకులు పసుపు రంగులోకి మారుతున్నాయి. యూరియా వేసి పొలానికి నీరు పెట్టండి. దయచేసి ఆకు ఫోటోను అప్‌లోడ్ చేయగలరా?";
        } else if (lang === "hi") {
          fallbackText = "नमस्ते! नाइट्रोजन कम है और सूखे के कारण आपके कपास के पत्ते पीले पड़ रहे हैं। कृपया यूरिया डालें और सिंचाई करें। क्या आप फोटो अपलोड कर सकते हैं?";
        } else {
          fallbackText = "Namaste! Based on your soil report, Nitrogen is low and there has been no rain for 7 days. This dry spell combined with low Nitrogen is making your cotton leaves turn yellow. Please apply Urea and irrigate. Can you upload a leaf photo?";
        }
        suggest = "request_photo";
      }

      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        text: fallbackText,
        suggest_action: suggest,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      speakOutLoud(fallbackText);
    } finally {
      setLoading(false);
    }
  };

  // Browser Text-to-Speech synthesis
  const speakOutLoud = (text) => {
    if (!window.speechSynthesis) return;
    // Cancel active speaker
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (lang === "hi") utterance.lang = "hi-IN";
    else if (lang === "te") utterance.lang = "te-IN";
    else utterance.lang = "en-US";
    
    // Choose appropriate voice speed
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] pb-4">
      {/* Header */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-between mb-4 border-emerald-500/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="font-bold text-zinc-100">{t("chatTitle")}</h2>
        </div>
        <button 
          onClick={() => {
            setMessages([
              {
                id: Date.now(),
                sender: "ai",
                text: t("general_hello"),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
            saveOfflineChatHistory([]);
          }}
          className="text-xs text-zinc-400 hover:text-emerald-400 transition-all underline"
        >
          Reset Chat
        </button>
      </div>

      {/* Message History Scroller */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-4">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl p-4 space-y-2 shadow-lg ${
                msg.sender === "user" 
                  ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-br-none border border-emerald-500/20" 
                  : "glass-card text-zinc-200 rounded-bl-none border-emerald-500/10"
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                {msg.sender === "user" ? <User className="w-3.5 h-3.5 text-zinc-200" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{msg.sender === "user" ? "Farmer" : "KrishiMitra AI"}</span>
              </div>
              <p className="text-sm leading-relaxed">{msg.text}</p>
              
              <div className="flex items-center justify-between gap-4 pt-1">
                <span className="text-[9px] text-zinc-400">{msg.time}</span>
                {msg.sender === "ai" && (
                  <button 
                    onClick={() => speakOutLoud(msg.text)}
                    className="p-1 hover:bg-emerald-950/40 rounded-lg text-emerald-400 hover:text-emerald-300 transition-all"
                    title={t("speakReply")}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {msg.suggest_action === "request_photo" && (
                <div className="pt-2">
                  <button 
                    onClick={() => setTab("camera")}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  >
                    📸 Go to Leaf Camera Scanner
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass-card rounded-2xl rounded-bl-none p-4 flex items-center gap-2 border-emerald-500/10">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick query buttons */}
      <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => {
            setInputVal("Why is my cotton yellow?");
            handleSendMessage("Why is my cotton yellow?");
          }}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
        >
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          {t("cottonYellowQuery")}
        </button>
      </div>

      {/* Mic/Input Controls */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleRecording}
          className={`p-4 rounded-full flex-shrink-0 transition-all shadow-lg active:scale-95 ${
            recording 
              ? "bg-red-600 text-white animate-pulse shadow-red-500/30" 
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30"
          }`}
          title={t("micTapPrompt")}
        >
          {recording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <div className="flex-1 relative">
          <input 
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={recording ? "Listening..." : t("inputPlaceholder")}
            className="w-full bg-zinc-900/60 border border-emerald-500/20 rounded-2xl pl-4 pr-12 py-3.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-zinc-500"
            disabled={recording}
          />
          <button 
            onClick={() => handleSendMessage()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 transition-all"
            disabled={recording}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
