import React, { useState, useEffect } from "react";
import { UserCheck, MapPin, ShieldAlert, Sparkles, CheckCircle, RefreshCw } from "lucide-react";

const BACKEND_URL = "http://localhost:8000";

export default function ExpertView({ t, lang }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/tickets/high-risk`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      } else {
        throw new Error("Failed to load expert tickets");
      }
    } catch (err) {
      console.warn("Backend unavailable, loading local fallback mock tickets.");
      // Load mock tickets local fallback
      setTickets([
        {
          id: 101,
          farm_id: 201,
          ai_confidence: 58.2,
          status: "Pending",
          disease_tag: "Leaf Blight",
          description: "Wheat fields report brown necrotic rings. YOLOv11 model returned low confidence due to bad focus. Review required.",
          created_at: new Date().toISOString()
        },
        {
          id: 102,
          farm_id: 202,
          ai_confidence: 64.5,
          status: "Pending",
          disease_tag: "Yellow Vein Mosaic",
          description: "Yellow cotton leaf diagnosed. Needs human chemical advisor to verify if Nitrogen deficiency is primary factor.",
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleResolve = async (ticketId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/tickets/${ticketId}/resolve`, {
        method: "POST"
      });
      if (res.ok) {
        // Remove or update ticket state locally
        setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
      } else {
        // Fallback for offline mode mock
        setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
      }
    } catch (err) {
      // Offline fallback resolution
      setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
    }
  };

  const handleSeedMockData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/seed`, { method: "POST" });
      if (res.ok) {
        alert("Database seeded! Expert dashboard refreshed.");
        await fetchTickets();
      } else {
        alert("Seeder failed. Make sure backend FastAPI server is running on port 3002.");
      }
    } catch (err) {
      alert("Backend connection failed. Run 'uvicorn app.main:app --port 3002' inside backend folder.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 space-y-6">
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
        
        <button 
          onClick={handleSeedMockData}
          className="flex items-center gap-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/25 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-[0.98]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Seed Demo Tickets</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-12 gap-2">
          <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
          <span className="text-xs text-zinc-400">Loading audit records...</span>
        </div>
      ) : tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div 
              key={ticket.id}
              className="glass-card rounded-2xl p-5 border-l-4 border-l-amber-500 space-y-4 shadow-lg border-emerald-500/10"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-600/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                      ID: #{ticket.id}
                    </span>
                    <span className="bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-700">
                      Farm ID: #{ticket.farm_id}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-zinc-100 pt-1">
                    Disease Flagged: <span className="text-amber-400">{ticket.disease_tag}</span>
                  </h3>
                </div>
                
                {/* Confidence Badge */}
                <div className="text-right">
                  <span className="text-xs text-zinc-400 block">{t("confidence")}</span>
                  <span className="text-sm font-extrabold text-amber-400 block">{ticket.ai_confidence}%</span>
                  <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest">
                    {ticket.ai_confidence < 70 ? "Unsure AI Audit Required" : "Escalated Disease"}
                  </span>
                </div>
              </div>

              {/* Ticket description */}
              <p className="text-xs text-zinc-300 bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/80 leading-relaxed font-medium">
                "{ticket.description}"
              </p>

              {/* Footer action bar */}
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3.5">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span>GPS Tracking active | Near Vijayawada</span>
                </div>

                <button
                  onClick={() => handleResolve(ticket.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{t("resolvedBtn")}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 border-emerald-500/10">
          <CheckCircle className="w-12 h-12 text-emerald-500/40" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-200">{t("noTickets")}</h3>
            <p className="text-xs text-zinc-400">All regional farm soil anomalies and scans are resolved.</p>
          </div>
        </div>
      )}
    </div>
  );
}
