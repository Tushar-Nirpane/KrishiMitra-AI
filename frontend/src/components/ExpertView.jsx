import React, { useState, useEffect } from "react";
import {
  UserCheck, MapPin, ShieldAlert, CheckCircle, RefreshCw,
  AlertTriangle, Clock, Microscope, Leaf, FlaskConical,
  BugOff, Sprout, Activity, Filter
} from "lucide-react";

const BACKEND_URL = "https://krishimitra-ai-qga4.onrender.com";

const SEVERITY_STYLES = {
  High:    { card: "border-l-red-500",    badge: "bg-red-500/20 text-red-300 border-red-500/30",    dot: "bg-red-500"    },
  Medium:  { card: "border-l-amber-500",  badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", dot: "bg-amber-500" },
  Low:     { card: "border-l-emerald-500",badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-500" },
};

const DISEASE_TYPE_ICON = {
  Fungal:     FlaskConical,
  Bacterial:  Microscope,
  Viral:      BugOff,
  Pest:       BugOff,
  Deficiency: Leaf,
  Unknown:    Activity,
};

const formatTime = (iso) => {
  if (!iso) return "Just now";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

// Derive severity from confidence + disease tag
const deriveSeverity = (ticket) => {
  if (ticket.ai_confidence < 65) return "High";
  const tag = (ticket.disease_tag || "").toLowerCase();
  if (tag.includes("blight") || tag.includes("blast") || tag.includes("wilt") ||
      tag.includes("mosaic") || tag.includes("curl") || tag.includes("virus")) return "High";
  if (tag === "healthy") return "Low";
  return "Medium";
};

export default function ExpertView({ t, lang }) {
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [filter, setFilter]     = useState("all"); // all | high | medium | low
  const [resolving, setResolving] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/tickets/high-risk`);
      if (res.ok) {
        setTickets(await res.json());
      } else throw new Error();
    } catch {
      console.warn("Backend unavailable, loading local fallback mock tickets.");
      setTickets([
        {
          id: 101, farm_id: 201, ai_confidence: 58.2, status: "Pending",
          disease_tag: "Bacterial Leaf Blight",
          description: "Wheat field shows water-soaked yellow-brown stripes on leaf margins. ML model returned low confidence (58%) — blurry image. Human expert audit required.",
          created_at: new Date().toISOString(),
        },
        {
          id: 102, farm_id: 202, ai_confidence: 64.5, status: "Pending",
          disease_tag: "Yellow Mosaic Virus",
          description: "Cotton leaf yellowing detected. Needs human advisor to verify if whitefly vector infection or primary nitrogen deficiency is cause.",
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 103, farm_id: 203, ai_confidence: 88.4, status: "Pending",
          disease_tag: "Powdery Mildew",
          description: "Grape vine shows white powdery patches on leaves. High confidence fungal infection detected. Recommend immediate Hexaconazole spray.",
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleResolve = async (ticketId) => {
    setResolving(ticketId);
    try {
      await fetch(`${BACKEND_URL}/tickets/${ticketId}/resolve`, { method: "POST" });
    } catch {}
    setTimeout(() => {
      setTickets(prev => prev.filter(tk => tk.id !== ticketId));
      setResolving(null);
    }, 600);
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/seed`, { method: "POST" });
      if (res.ok) { await fetchTickets(); }
    } catch {
      alert("Backend not reachable. Make sure uvicorn is running on port 8000.");
    } finally { setLoading(false); }
  };

  // Enrich + filter
  const enriched = tickets.map(tk => ({ ...tk, severity: deriveSeverity(tk) }));
  const filtered = filter === "all"    ? enriched :
                   filter === "high"   ? enriched.filter(t => t.severity === "High") :
                   filter === "medium" ? enriched.filter(t => t.severity === "Medium") :
                                         enriched.filter(t => t.severity === "Low");

  const counts = {
    high:   enriched.filter(t => t.severity === "High").length,
    medium: enriched.filter(t => t.severity === "Medium").length,
    low:    enriched.filter(t => t.severity === "Low").length,
  };

  return (
    <div className="pb-24 space-y-5">

      {/* Header */}
      <div className="glass-card rounded-2xl p-5 border-emerald-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-950/50 rounded-xl border border-teal-500/25 text-teal-400">
            <UserCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{t("expertTitle")}</h2>
            <p className="text-xs text-zinc-400">{t("expertSubtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchTickets}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
            title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={handleSeed}
            className="flex items-center gap-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/25 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">
            <Sprout className="w-3.5 h-3.5" /> Seed Demo
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "High Risk", count: counts.high,   color: "red",     icon: ShieldAlert  },
          { label: "Medium",    count: counts.medium, color: "amber",   icon: AlertTriangle},
          { label: "Low Risk",  count: counts.low,    color: "emerald", icon: CheckCircle  },
        ].map(({ label, count, color, icon: Icon }) => (
          <div key={label} className={`glass-card rounded-xl p-3 border-${color}-500/10 text-center`}>
            <Icon className={`w-5 h-5 text-${color}-400 mx-auto mb-1`} />
            <p className={`text-xl font-extrabold text-${color}-400`}>{count}</p>
            <p className="text-[10px] text-zinc-500 font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
        {["all", "high", "medium", "low"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              filter === f
                ? f === "high"   ? "bg-red-500/20 text-red-300 border-red-500/40"
                : f === "medium" ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : f === "low"    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                :                  "bg-zinc-700 text-zinc-200 border-zinc-600"
                : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700"
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {f !== "all" ? `(${counts[f]})` : `(${enriched.length})`}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-xs text-zinc-400">Loading audit records…</span>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((ticket) => {
            const sty = SEVERITY_STYLES[ticket.severity] ?? SEVERITY_STYLES.Medium;
            const DiseaseIcon = DISEASE_TYPE_ICON[ticket.disease_type] ?? Activity;
            const isResolving = resolving === ticket.id;

            return (
              <div key={ticket.id}
                className={`glass-card rounded-2xl p-5 border-l-4 ${sty.card} space-y-4 shadow-lg border-emerald-500/10 transition-all ${isResolving ? "opacity-40 scale-[0.98]" : ""}`}>

                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-700">
                        #{ticket.id}
                      </span>
                      <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-700">
                        Farm #{ticket.farm_id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sty.badge}`}>
                        {ticket.severity} Risk
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-zinc-100">
                        {ticket.disease_tag}
                      </h3>
                      {ticket.disease_type && (
                        <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                          <DiseaseIcon className="w-3 h-3" /> {ticket.disease_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Confidence ring */}
                  <div className="flex-shrink-0 text-center">
                    <div className="relative w-14 h-14">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="28" cy="28" r="22" stroke="rgba(255,255,255,0.05)" strokeWidth="5" fill="transparent" />
                        <circle cx="28" cy="28" r="22"
                          stroke={ticket.ai_confidence >= 80 ? "#10b981" : ticket.ai_confidence >= 65 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="5" fill="transparent"
                          strokeDasharray={2 * Math.PI * 22}
                          strokeDashoffset={2 * Math.PI * 22 * (1 - ticket.ai_confidence / 100)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[11px] font-extrabold text-zinc-200">{ticket.ai_confidence}%</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-zinc-500 mt-0.5">AI conf.</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-300 bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/80 leading-relaxed">
                  "{ticket.description}"
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>GPS active · Near farm location</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(ticket.created_at)}</span>
                    </div>
                  </div>

                  <button onClick={() => handleResolve(ticket.id)} disabled={isResolving}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl
                      flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60">
                    <CheckCircle className="w-4 h-4" />
                    {isResolving ? "Resolving…" : t("resolvedBtn")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 border-emerald-500/10">
          <CheckCircle className="w-12 h-12 text-emerald-500/40" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-200">{t("noTickets")}</h3>
            <p className="text-xs text-zinc-400">All regional farm soil anomalies and scans are resolved.</p>
          </div>
          <button onClick={handleSeed}
            className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-600/30 transition-all">
            <Sprout className="w-4 h-4" /> Load Demo Tickets
          </button>
        </div>
      )}
    </div>
  );
}
