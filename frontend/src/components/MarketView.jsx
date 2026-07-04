import React, { useState } from "react";
import {
  TrendingUp, TrendingDown, Minus, ShoppingBag, Leaf,
  Check, Package, Zap, Tag, RefreshCw, BarChart3, ArrowUpRight,
  Truck, Star, Clock, Shield
} from "lucide-react";

const MANDI_PRICES = [
  { crop: "Cotton (Kapas)",          icon: "🌿", price: "₹6,800 – ₹7,400", unit: "/ Quintal", trend: "up",     change: "+1.2%", msp: "₹6,620" },
  { crop: "Paddy (Rice) — Basmati",  icon: "🌾", price: "₹4,200 – ₹4,800", unit: "/ Quintal", trend: "up",     change: "+0.5%", msp: "₹2,183" },
  { crop: "Wheat",                   icon: "🌱", price: "₹2,275 – ₹2,450", unit: "/ Quintal", trend: "down",   change: "−0.2%", msp: "₹2,275" },
  { crop: "Groundnut",               icon: "🥜", price: "₹6,300 – ₹6,800", unit: "/ Quintal", trend: "up",     change: "+0.8%", msp: "₹6,377" },
  { crop: "Maize",                   icon: "🌽", price: "₹1,950 – ₹2,150", unit: "/ Quintal", trend: "stable", change: "0.0%",  msp: "₹1,962" },
  { crop: "Soybean",                 icon: "🟡", price: "₹4,600 – ₹5,100", unit: "/ Quintal", trend: "up",     change: "+2.1%", msp: "₹4,600" },
  { crop: "Tomato",                  icon: "🍅", price: "₹1,200 – ₹1,800", unit: "/ Quintal", trend: "down",   change: "−3.5%", msp: "—"       },
  { crop: "Onion",                   icon: "🧅", price: "₹1,500 – ₹2,200", unit: "/ Quintal", trend: "up",     change: "+4.0%", msp: "—"       },
];

const FERTILIZERS = [
  { name: "Neem-Coated Urea (45 kg)",    icon: "🌱", price: "₹266",   desc: "Slow-release N; reduces leaching 15%",  avail: true,  brand: "IFFCO",       rating: 4.8 },
  { name: "DAP 18:46 (50 kg)",           icon: "💊", price: "₹1,350", desc: "High-P root development starter",       avail: true,  brand: "NFL",         rating: 4.7 },
  { name: "NPK 19-19-19 Soluble (1 kg)", icon: "⚗️", price: "₹150",   desc: "Balanced foliar nutrient spray",        avail: true,  brand: "Coromandel",  rating: 4.5 },
  { name: "Organic Compost Humus (50 kg)",icon: "♻️", price: "₹350",   desc: "Boosts soil organic carbon & biology", avail: true,  brand: "KisanKraft",  rating: 4.6 },
];

const PESTICIDES = [
  { name: "Mancozeb 75 WP (500 g)",       icon: "🛡️", price: "₹320",  desc: "Broad-spectrum fungicide for blight",        avail: true,  brand: "UPL" },
  { name: "Imidacloprid 17.8 SL (250 ml)",icon: "🐛", price: "₹450",  desc: "Controls whitefly, aphids, sucking pests",   avail: true,  brand: "Bayer" },
  { name: "Chlorpyrifos 50 EC (1 L)",     icon: "🔬", price: "₹380",  desc: "Broad-spectrum soil & foliar insecticide",   avail: true,  brand: "Atul" },
  { name: "Propiconazole 25 EC (250 ml)", icon: "🍃", price: "₹480",  desc: "Systemic fungicide for rust & mildew",       avail: false, brand: "Syngenta" },
];

const SEEDS = [
  { name: "BT Cotton Hybrid (450 g)",    icon: "🌿", price: "₹930",   desc: "Bollworm-resistant, 160-180 day crop",  brand: "Mahyco" },
  { name: "Wheat HD-3226 (5 kg)",         icon: "🌾", price: "₹240",   desc: "High-yielding rust-resistant variety",  brand: "IARI" },
  { name: "Paddy Pusa Basmati 1121 (5 kg)",icon:"🌾", price: "₹320",   desc: "Premium aroma basmati, 135-day crop",  brand: "IARI" },
  { name: "Tomato Arka Rakshak (10 g)",   icon: "🍅", price: "₹180",   desc: "Triple virus resistant F1 hybrid",      brand: "IIHR" },
];

const StarRating = ({ r }) => (
  <span className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(s => (
      <Star key={s} className={`w-2.5 h-2.5 ${s <= Math.round(r) ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`} />
    ))}
    <span className="text-[10px] text-zinc-500 ml-0.5">{r}</span>
  </span>
);

const TrendIcon = ({ t }) =>
  t === "up"     ? <TrendingUp  className="w-3.5 h-3.5 text-emerald-400" /> :
  t === "down"   ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> :
                   <Minus        className="w-3.5 h-3.5 text-zinc-500" />;

export default function MarketView({ t, lang }) {
  const [orderedItems, setOrderedItems] = useState(new Set());
  const [activeTab, setActiveTab] = useState("mandi");

  const handleOrder = (name) => {
    setOrderedItems(prev => new Set([...prev, name]));
    setTimeout(() => {
      setOrderedItems(prev => { const n = new Set(prev); n.delete(name); return n; });
    }, 3000);
  };

  const tabs = [
    { id: "mandi",     label: "Mandi Rates",  icon: BarChart3  },
    { id: "inputs",    label: "Fertilisers",  icon: Leaf       },
    { id: "pesticide", label: "Pesticides",   icon: Shield     },
    { id: "seeds",     label: "Seeds",        icon: Package    },
  ];

  return (
    <div className="pb-24 space-y-5">

      {/* Header */}
      <div className="glass-card rounded-2xl p-5 border-emerald-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-500/20 text-emerald-500">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{t("marketTitle")}</h2>
            <p className="text-xs text-zinc-400">Live APMC Mandi rates · Direct-to-Farm input store</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated today</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all border ${
              activeTab === id
                ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/40"
                : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
            }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── MANDI RATES ─────────────────────────────────────────────────────── */}
      {activeTab === "mandi" && (
        <div className="space-y-3">
          <div className="glass-card rounded-2xl overflow-hidden border-emerald-500/10">
            <div className="flex items-center gap-2 p-4 border-b border-zinc-800">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-zinc-200 text-sm">{t("cropPrice")}</span>
              <span className="ml-auto text-[10px] text-zinc-500 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Live APMC data
              </span>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {MANDI_PRICES.map((m, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/20 transition-all">
                  <span className="text-xl flex-shrink-0">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-zinc-100 block truncate">{m.crop}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-zinc-500">MSP: {m.msp}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-sm text-emerald-400 block">{m.price}</span>
                    <span className="text-[10px] text-zinc-500">{m.unit}</span>
                  </div>
                  <div className={`flex items-center gap-0.5 text-[10px] font-bold flex-shrink-0 w-14 justify-end ${
                    m.trend === "up" ? "text-emerald-400" : m.trend === "down" ? "text-red-400" : "text-zinc-500"}`}>
                    <TrendIcon t={m.trend} />
                    <span>{m.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <p className="text-xs text-zinc-500 leading-relaxed">
              Rates shown are indicative APMC spot prices. Actual prices may vary by mandal and date.
              Government MSP (Minimum Support Price) shown for reference.
            </p>
          </div>
        </div>
      )}

      {/* ── FERTILISERS ─────────────────────────────────────────────────────── */}
      {activeTab === "inputs" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FERTILIZERS.map((p) => (
              <div key={p.name}
                className="glass-card rounded-2xl p-4 border-emerald-500/10 flex flex-col gap-3 hover:border-emerald-500/20 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-zinc-100 leading-tight">{p.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{p.brand}</p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-400 flex-shrink-0">{p.price}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{p.desc}</p>
                <div className="flex items-center justify-between border-t border-zinc-800 pt-2.5">
                  <StarRating r={p.rating} />
                  <button onClick={() => handleOrder(p.name)}
                    className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                      orderedItems.has(p.name)
                        ? "bg-emerald-700 text-emerald-200"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95"
                    }`}>
                    {orderedItems.has(p.name) ? <><Check className="w-3 h-3" /> Ordered!</> : <><Truck className="w-3 h-3" /> Order COD</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PESTICIDES ──────────────────────────────────────────────────────── */}
      {activeTab === "pesticide" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PESTICIDES.map((p) => (
            <div key={p.name}
              className="glass-card rounded-2xl p-4 border-emerald-500/10 flex flex-col gap-3 hover:border-amber-500/20 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-zinc-100 leading-tight">{p.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{p.brand}</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-amber-400 flex-shrink-0">{p.price}</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{p.desc}</p>
              <div className="flex items-center justify-between border-t border-zinc-800 pt-2.5">
                {p.avail
                  ? <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold"><Check className="w-3 h-3" /> In Stock</span>
                  : <span className="text-[10px] text-red-400 font-semibold">Out of Stock</span>
                }
                <button onClick={() => p.avail && handleOrder(p.name)} disabled={!p.avail}
                  className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                    !p.avail
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                      : orderedItems.has(p.name)
                      ? "bg-emerald-700 text-emerald-200"
                      : "bg-amber-600 hover:bg-amber-500 text-white active:scale-95"
                  }`}>
                  {orderedItems.has(p.name) ? <><Check className="w-3 h-3" /> Ordered!</> : <><Truck className="w-3 h-3" /> Order COD</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SEEDS ───────────────────────────────────────────────────────────── */}
      {activeTab === "seeds" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SEEDS.map((s) => (
            <div key={s.name}
              className="glass-card rounded-2xl p-4 border-emerald-500/10 flex flex-col gap-3 hover:border-teal-500/20 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-zinc-100 leading-tight">{s.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{s.brand}</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-teal-400 flex-shrink-0">{s.price}</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{s.desc}</p>
              <div className="flex items-center justify-between border-t border-zinc-800 pt-2.5">
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                  <Check className="w-3 h-3" /> In Stock
                </span>
                <button onClick={() => handleOrder(s.name)}
                  className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                    orderedItems.has(s.name)
                      ? "bg-emerald-700 text-emerald-200"
                      : "bg-teal-600 hover:bg-teal-500 text-white active:scale-95"
                  }`}>
                  {orderedItems.has(s.name) ? <><Check className="w-3 h-3" /> Ordered!</> : <><Truck className="w-3 h-3" /> Order COD</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COD notice */}
      <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center gap-2">
        <Truck className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        <p className="text-xs text-zinc-500">
          All orders are Cash on Delivery. Delivery within 2-3 working days to your farm GPS coordinates.
        </p>
      </div>
    </div>
  );
}
