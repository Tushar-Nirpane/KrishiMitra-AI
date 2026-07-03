import React from "react";
import { TrendingUp, ShoppingBag, Leaf, Check } from "lucide-react";

export default function MarketView({ t, lang }) {
  // Mandi crop prices
  const MANDI_PRICES = [
    { crop: "Cotton (Kapas)", price: "₹6,800 - ₹7,400 / Quintal", trend: "up", change: "+1.2%" },
    { crop: "Paddy (Rice) - Basmati", price: "₹4,200 - ₹4,800 / Quintal", trend: "up", change: "+0.5%" },
    { crop: "Wheat", price: "₹2,275 - ₹2,450 / Quintal", trend: "down", change: "-0.2%" },
    { crop: "Groundnut", price: "₹6,300 - ₹6,800 / Quintal", trend: "up", change: "+0.8%" },
    { crop: "Maize", price: "₹1,950 - ₹2,150 / Quintal", trend: "stable", change: "0.0%" }
  ];

  // Fertilizer / Input rates
  const INPUT_PRODUCTS = [
    { name: "Organic Compost Humus (50 kg)", price: "₹350", desc: "Enriches soil organic carbon", avail: "In Stock" },
    { name: "Neem coated Urea (45 kg)", price: "₹266", desc: "Regulated nitrogen supply for crops", avail: "In Stock" },
    { name: "NPK 19-19-19 Soluble (1 kg)", price: "₹150", desc: "Balanced foliar nutrient fertilizer", avail: "In Stock" },
    { name: "Di-Ammonium Phosphate (DAP) (50 kg)", price: "₹1,350", desc: "High phosphorus root starter", avail: "In Stock" }
  ];

  const handleBuy = (item) => {
    alert(`Successfully ordered ${item}! Order logged. Cash on delivery scheduled for coordinates near your farm.`);
  };

  return (
    <div className="pb-24 space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-5 border-emerald-500/10 flex items-center gap-3">
        <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-500/20 text-emerald-500">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-100">{t("marketTitle")}</h2>
          <p className="text-xs text-zinc-400">Direct-to-Farmer Input Stores & Mandi Index</p>
        </div>
      </div>

      {/* Mandi Rates */}
      <div className="glass-card rounded-2xl p-5 space-y-4 border-emerald-500/10">
        <h3 className="font-bold text-zinc-200 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>{t("cropPrice")}</span>
        </h3>
        
        <div className="divide-y divide-zinc-800/80">
          {MANDI_PRICES.map((m, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-zinc-100 block">{m.crop}</span>
                <span className="text-[10px] text-zinc-400">APMC Mandi spot rates</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-xs text-emerald-400 block">{m.price}</span>
                <span className={`text-[9px] font-bold ${
                  m.trend === "up" ? "text-emerald-500" : m.trend === "down" ? "text-red-500" : "text-zinc-500"
                }`}>
                  {m.change} {m.trend === "up" ? "▲" : m.trend === "down" ? "▼" : "●"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input products */}
      <div className="glass-card rounded-2xl p-5 space-y-4 border-emerald-500/10">
        <h3 className="font-bold text-zinc-200 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-2">
          <Leaf className="w-4 h-4 text-emerald-500" />
          <span>{t("fertilizerCost")}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INPUT_PRODUCTS.map((p, idx) => (
            <div 
              key={idx} 
              className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800/80 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-200 block max-w-[70%] leading-tight">{p.name}</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                    {p.price}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">{p.desc}</p>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2.5">
                <span className="text-[9px] text-emerald-500 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{p.avail}</span>
                </span>
                <button
                  onClick={() => handleBuy(p.name)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all active:scale-[0.97]"
                >
                  Order Cash On Delivery
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
