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
  Globe,
  Menu,
  X
} from "lucide-react";

export default function App() {
  const { t, lang, changeLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const navItems = [
    { id: "home", icon: Sprout, label: t("tabHome") },
    { id: "chat", icon: MessageSquareCode, label: t("tabChat") },
    { id: "camera", icon: Camera, label: t("tabCamera") },
    { id: "market", icon: TrendingUp, label: t("tabMarket") },
    { id: "expert", icon: UserCheck, label: t("tabExpert") },
  ];

  return (
    <div className="w-full min-h-screen bg-zinc-950 flex flex-col text-white shadow-2xl relative">
      {/* Premium Header */}
      <header className="p-4 bg-zinc-950/90 backdrop-blur-md border-b border-emerald-500/10 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            title="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-lg text-white shadow-md">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-zinc-100 via-emerald-200 to-teal-400 bg-clip-text text-transparent hidden sm:inline-block">
              {t("appName")}
            </span>
          </div>
        </div>

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

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div 
        className={`fixed inset-y-0 left-0 w-72 bg-zinc-950 border-r border-emerald-500/10 z-[110] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-lg text-white shadow-md">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-zinc-100 via-emerald-200 to-teal-400 bg-clip-text text-transparent">
              {t("appName")}
            </span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? "bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? "text-emerald-400" : ""}`} />
              <span className="text-[15px]">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

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
