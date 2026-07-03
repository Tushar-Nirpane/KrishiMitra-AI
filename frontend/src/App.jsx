import React, { useState } from "react";
import { useTranslation } from "./i18n";
import HomeView from "./components/HomeView";
import ChatView from "./components/ChatView";
import CameraView from "./components/CameraView";
import MarketView from "./components/MarketView";
import ExpertView from "./components/ExpertView";

import { 
  Sprout, 
  MessageSquareCode, 
  Camera, 
  TrendingUp, 
  UserCheck, 
  Globe 
} from "lucide-react";

export default function App() {
  const { t, lang, changeLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState("home");
  const [isOffline, setIsOffline] = useState(false);

  return (
    <div className="w-full min-h-screen bg-zinc-950 flex flex-col text-white shadow-2xl relative">
      {/* Premium Header */}
      <header className="p-4 bg-zinc-950/90 backdrop-blur-md border-b border-emerald-500/10 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-lg text-white shadow-md">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-zinc-100 via-emerald-200 to-teal-400 bg-clip-text text-transparent">
            {t("appName")}
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <button onClick={() => setActiveTab("home")} className={`flex items-center gap-2 transition-all ${activeTab === "home" ? "text-emerald-400 font-bold" : "text-zinc-400 hover:text-zinc-200"}`}>
            <Sprout className="w-5 h-5" />
            <span>{t("tabHome")}</span>
          </button>
          <button onClick={() => setActiveTab("chat")} className={`flex items-center gap-2 transition-all ${activeTab === "chat" ? "text-emerald-400 font-bold" : "text-zinc-400 hover:text-zinc-200"}`}>
            <MessageSquareCode className="w-5 h-5" />
            <span>{t("tabChat")}</span>
          </button>
          <button onClick={() => setActiveTab("camera")} className={`flex items-center gap-2 transition-all ${activeTab === "camera" ? "text-emerald-400 font-bold" : "text-zinc-400 hover:text-zinc-200"}`}>
            <Camera className="w-5 h-5" />
            <span>{t("tabCamera")}</span>
          </button>
          <button onClick={() => setActiveTab("market")} className={`flex items-center gap-2 transition-all ${activeTab === "market" ? "text-emerald-400 font-bold" : "text-zinc-400 hover:text-zinc-200"}`}>
            <TrendingUp className="w-5 h-5" />
            <span>{t("tabMarket")}</span>
          </button>
          <button onClick={() => setActiveTab("expert")} className={`flex items-center gap-2 transition-all ${activeTab === "expert" ? "text-emerald-400 font-bold" : "text-zinc-400 hover:text-zinc-200"}`}>
            <UserCheck className="w-5 h-5" />
            <span>{t("tabExpert")}</span>
          </button>
        </nav>

        {/* Multilingual Selector */}
        <div className="flex items-center gap-1 bg-zinc-900/60 px-2 py-1 rounded-xl border border-zinc-800">
          <Globe className="w-4 h-4 text-zinc-400" />
          <select 
            value={lang} 
            onChange={(e) => changeLanguage(e.target.value)}
            className="bg-transparent text-sm text-zinc-300 font-bold focus:outline-none cursor-pointer pr-1"
          >
            <option value="en" className="bg-zinc-950 text-zinc-300">English</option>
            <option value="hi" className="bg-zinc-950 text-zinc-300">हिन्दी</option>
            <option value="te" className="bg-zinc-950 text-zinc-300">తెలుగు</option>
            <option value="mr" className="bg-zinc-950 text-zinc-300">मराठी</option>
          </select>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 overflow-y-auto">
        {activeTab === "home" && (
          <HomeView 
            t={t} 
            lang={lang} 
            isOffline={isOffline} 
            setIsOffline={setIsOffline} 
          />
        )}
        {activeTab === "chat" && (
          <ChatView 
            t={t} 
            lang={lang} 
            setTab={setActiveTab} 
          />
        )}
        {activeTab === "camera" && (
          <CameraView 
            t={t} 
            lang={lang} 
          />
        )}
        {activeTab === "market" && (
          <MarketView 
            t={t} 
            lang={lang} 
          />
        )}
        {activeTab === "expert" && (
          <ExpertView 
            t={t} 
            lang={lang} 
          />
        )}
      </main>
    </div>
  );
}
