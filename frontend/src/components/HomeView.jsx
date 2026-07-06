import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import {
  Sprout,
  MapPin,
  Droplet,
  Droplets,
  Flame,
  Activity,
  Compass,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  Tractor,
  Leaf,
  Sun,
  Wind,
  Cloud,
  CloudRain,
  Thermometer,
  Users,
  BarChart3,
  ShoppingBag,
  Star,
  ChevronRight,
  X,
  Package,
  Wrench,
  Wheat,
  ArrowRight,
  Navigation
} from "lucide-react";
import {
  getOfflineFarmer,
  getOfflineFarm,
  getOfflineRecommendations,
  saveOfflineFarmer,
  saveOfflineFarm,
  saveOfflineRecommendations,
  generateLocalOfflineRecommendations
} from "../localStorageStore";

const BACKEND_URL = "https://krishimitra-ai-qga4.onrender.com";

const PRESETS = [
  { name: "Vijayawada Farm (Andhra)", lat: 16.5062, lng: 80.6480 },
  { name: "Lucknow Farm (Uttar Pradesh)", lat: 26.8467, lng: 80.9462 },
  { name: "Rohtak Farm (Haryana)", lat: 28.8955, lng: 76.6066 }
];

// ── India Farming Statistics ────────────────────────────────────────────────
const INDIA_STATS = [
  { icon: Users, label: "Farmers in India", value: "146M+", color: "emerald", desc: "Active agricultural workers" },
  { icon: BarChart3, label: "GDP Contribution", value: "18%", color: "teal", desc: "Agriculture share of GDP" },
  { icon: Wheat, label: "Food Grain Production", value: "329MT", color: "lime", desc: "Record 2023-24 harvest" },
  { icon: Leaf, label: "Cultivable Land", value: "179M ha", color: "green", desc: "Net sown area in India" },
];

// ── Best Farming Products ───────────────────────────────────────────────────
const PRODUCTS = [
  {
    name: "Urea Fertilizer",
    brand: "IFFCO",
    rating: 4.8,
    price: "₹270 / 45kg bag",
    tag: "Best Seller",
    tagColor: "emerald",
    icon: "🌱",
    desc: "46% N content. Ideal for rice, wheat & maize at sowing stage.",
  },
  {
    name: "DAP Fertilizer",
    brand: "NFL",
    rating: 4.7,
    price: "₹1,350 / 50kg bag",
    tag: "Govt. Subsidised",
    tagColor: "teal",
    icon: "💊",
    desc: "Di-Ammonium Phosphate. Excellent for root development in kharif crops.",
  },
  {
    name: "Neem-Coated Urea",
    brand: "Coromandel",
    rating: 4.9,
    price: "₹295 / 45kg bag",
    tag: "Eco-Friendly",
    tagColor: "lime",
    icon: "🍃",
    desc: "Slow-release nitrogen. Reduces leaching, increases efficiency by 10–15%.",
  },
  {
    name: "Bio-NPK Consortium",
    brand: "Kan Biosys",
    rating: 4.6,
    price: "₹180 / 1kg pack",
    tag: "Organic",
    tagColor: "green",
    icon: "🔬",
    desc: "Biofertilizer blend of Azotobacter, PSB & KSB. Boosts soil biology.",
  },
  {
    name: "Mancozeb 75 WP",
    brand: "UPL",
    rating: 4.5,
    price: "₹320 / 500g",
    tag: "Fungicide",
    tagColor: "amber",
    icon: "🛡️",
    desc: "Broad-spectrum protective fungicide for blight and downy mildew control.",
  },
  {
    name: "Imidacloprid 17.8 SL",
    brand: "Bayer",
    rating: 4.7,
    price: "₹450 / 250ml",
    tag: "Insecticide",
    tagColor: "orange",
    icon: "🐛",
    desc: "Systemic insecticide. Controls sucking pests, whiteflies, aphids.",
  },
];

// ── Best Farming Equipment ──────────────────────────────────────────────────
const EQUIPMENT = [
  {
    name: "Mini Tractor (25 HP)",
    brand: "Mahindra JIVO",
    icon: "🚜",
    price: "₹4.2L – ₹5.8L",
    tag: "Popular Choice",
    tagColor: "emerald",
    desc: "Compact 4WD tractor. Best for small to medium landholdings (< 5 acres).",
  },
  {
    name: "Drip Irrigation Kit",
    brand: "Netafim India",
    icon: "💧",
    price: "₹18,000 / acre",
    tag: "Water Saver",
    tagColor: "blue",
    desc: "Saves 50–60% water. Increases yield by 30–40% vs flood irrigation.",
  },
  {
    name: "Power Sprayer",
    brand: "KisanKraft",
    icon: "💨",
    price: "₹4,500 – ₹8,000",
    tag: "Must Have",
    tagColor: "purple",
    desc: "16L knapsack power sprayer for uniform pesticide/fertilizer application.",
  },
  {
    name: "Seed Drill Machine",
    brand: "Fieldking",
    icon: "🌾",
    price: "₹35,000 – ₹55,000",
    tag: "Precision Sowing",
    tagColor: "teal",
    desc: "Ensures uniform seed spacing & depth. Reduces seed wastage by 20%.",
  },
  {
    name: "Soil Moisture Sensor",
    brand: "AgriSense",
    icon: "📡",
    price: "₹2,800 / unit",
    tag: "Smart Farm",
    tagColor: "cyan",
    desc: "IoT soil moisture sensor. Real-time data via app for irrigation decisions.",
  },
  {
    name: "Solar Pump (3 HP)",
    brand: "Kirloskar Solar",
    icon: "☀️",
    price: "₹85,000 – ₹1.1L",
    tag: "Govt. Subsidy 90%",
    tagColor: "yellow",
    desc: "PM-KUSUM scheme eligible. Zero electricity cost for irrigation.",
  },
];

// ── Tag colour map ──────────────────────────────────────────────────────────
const TAG_COLORS = {
  emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  teal:    "bg-teal-500/20 text-teal-300 border-teal-500/30",
  lime:    "bg-lime-500/20 text-lime-300 border-lime-500/30",
  green:   "bg-green-500/20 text-green-300 border-green-500/30",
  amber:   "bg-amber-500/20 text-amber-300 border-amber-500/30",
  orange:  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  blue:    "bg-blue-500/20 text-blue-300 border-blue-500/30",
  purple:  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  cyan:    "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  yellow:  "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

// ── Star Rating Component ───────────────────────────────────────────────────
const StarRating = ({ rating }) => (
  <span className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(s => (
      <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-zinc-600"}`} />
    ))}
    <span className="text-xs text-zinc-400 ml-1">{rating}</span>
  </span>
);

// ── Weather condition → icon + gradient mapping ─────────────────────────────
const WEATHER_META = {
  Clear:         { icon: Sun,       grad: "from-amber-500 to-orange-500",  label: "Clear & Sunny" },
  Sunny:         { icon: Sun,       grad: "from-amber-500 to-orange-500",  label: "Clear & Sunny" },
  Clouds:        { icon: Cloud,     grad: "from-slate-500 to-zinc-600",    label: "Cloudy" },
  "Partly Cloudy":{ icon: Cloud,    grad: "from-slate-400 to-zinc-500",    label: "Partly Cloudy" },
  Rain:          { icon: CloudRain, grad: "from-blue-600 to-indigo-700",   label: "Rainy" },
  Drizzle:       { icon: CloudRain, grad: "from-blue-400 to-blue-600",     label: "Drizzle" },
  Thunderstorm:  { icon: CloudRain, grad: "from-purple-700 to-indigo-900",label: "Thunderstorm" },
  Snow:          { icon: Cloud,     grad: "from-slate-200 to-blue-200",    label: "Snow" },
  Mist:          { icon: Cloud,     grad: "from-gray-400 to-slate-500",    label: "Misty" },
  Haze:          { icon: Cloud,     grad: "from-yellow-600 to-amber-700", label: "Hazy" },
};

// ── Live Weather Widget ─────────────────────────────────────────────────────
const LiveWeatherWidget = () => {
  const [useLiveLocation, setUseLiveLocation] = useState(false);
  const [wx, setWx] = useState(null);          // full weather payload
  const [locLabel, setLocLabel] = useState(""); // city, state string
  const [status, setStatus] = useState("idle"); // idle | detecting | loading | done | error
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!useLiveLocation) {
      setWx({
        current_temp: 34,
        current_condition: "Sunny",
        humidity: 60,
        wind_speed: 14,
        "7_day_rainfall_sum": 1.2,
        daily_rain_forecast: [0.2, 0, 0.5, 0.3, 0.2, 0, 0],
        source: "Default (Live Location Off)",
        location: { display: "India (avg)" }
      });
      setLocLabel("India (avg)");
      setStatus("done");
      return;
    }

    setStatus("detecting");
    if (!navigator.geolocation) {
      setStatus("error");
      setErrMsg("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        setStatus("loading");
        try {
          const res = await fetch(
            `${BACKEND_URL}/weather-alerts?latitude=${latitude}&longitude=${longitude}`
          );
          if (!res.ok) throw new Error("Backend unavailable");
          const data = await res.json();
          setWx(data);
          setLocLabel(data.location?.display || `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`);
          setStatus("done");
        } catch {
          // Fallback: generate mock weather based on coords
          const mockTemp = Math.round(28 - Math.abs(latitude - 15) * 0.5);
          setWx({
            current_temp: mockTemp,
            current_condition: "Sunny",
            humidity: 65,
            wind_speed: 12,
            "7_day_rainfall_sum": 0.8,
            daily_rain_forecast: [0,0,0,0,0,0,0],
            source: "Mock (Offline)",
            location: { display: "Your Location" }
          });
          setLocLabel("Your Location");
          setStatus("done");
        }
      },
      (geoErr) => {
        // User denied or unavailable — show generic India-avg weather
        setWx({
          current_temp: 34,
          current_condition: "Sunny",
          humidity: 60,
          wind_speed: 14,
          "7_day_rainfall_sum": 1.2,
          daily_rain_forecast: [0.2, 0, 0.5, 0.3, 0.2, 0, 0],
          source: "Default (Location denied)",
          location: { display: "India (avg)" }
        });
        setLocLabel("India (avg)");
        setStatus("done");
        setUseLiveLocation(false); // Reset toggle if denied
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, [useLiveLocation]);

  const conditionKey = wx?.current_condition || "Sunny";
  const meta = WEATHER_META[conditionKey] || WEATHER_META["Sunny"];
  const WeatherIcon = meta.icon;
  const maxRain = Math.max(...(wx?.daily_rain_forecast || [1]), 1);
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  if (status === "idle" || status === "detecting") {
    return (
      <div className="glass-card rounded-2xl p-5 border border-blue-500/20">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-zinc-200">Use Live Location for accurate weather?</p>
          <button 
            onClick={() => setUseLiveLocation(true)}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all"
          >
            Allow
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-blue-400 border-t-transparent animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-zinc-200">Detecting your location…</p>
            <p className="text-xs text-zinc-400">Please allow location access if prompted</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="glass-card rounded-2xl p-5 border border-emerald-500/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-zinc-200">Fetching live weather…</p>
            <p className="text-xs text-zinc-400">Connecting to weather service</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
      style={{ background: `linear-gradient(135deg, #0a1a2f 0%, #0d1f30 60%, #091a10 100%)` }}>
      {/* Ambient glow */}
      <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-30 bg-gradient-to-br ${meta.grad} pointer-events-none`} />

      <div className="relative z-10 p-5">
        {/* Toggle switch row */}
        <div className="flex justify-end mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Live Location</span>
            <div className={`w-8 h-4 rounded-full transition-colors relative ${useLiveLocation ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${useLiveLocation ? 'left-[18px]' : 'left-0.5'}`} />
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={useLiveLocation}
              onChange={(e) => setUseLiveLocation(e.target.checked)}
            />
          </label>
        </div>

        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Live Weather</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[10px] text-emerald-300 font-semibold animate-pulse">
                LIVE
              </span>
            </div>
            <p className="text-sm font-semibold text-zinc-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {locLabel}
            </p>
          </div>
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${meta.grad} shadow-lg`}>
            <WeatherIcon className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Main temp + condition */}
        <div className="flex items-end gap-4 mb-4">
          <div>
            <span className="text-5xl font-extrabold text-white leading-none">{wx.current_temp}°</span>
            <span className="text-lg text-zinc-400 ml-1">C</span>
          </div>
          <div className="pb-1">
            <p className="text-sm font-bold text-zinc-200">{meta.label}</p>
            <p className="text-xs text-zinc-500">{wx.source}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { Icon: Droplets, label: "Humidity", val: `${wx.humidity}%` },
            { Icon: Wind,     label: "Wind",     val: `${wx.wind_speed} km/h` },
            { Icon: CloudRain,label: "7-Day Rain",val: `${wx["7_day_rainfall_sum"]}mm` },
          ].map(({ Icon, label, val }) => (
            <div key={label} className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
              <Icon className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-200">{val}</span>
              <span className="text-[10px] text-zinc-500">{label}</span>
            </div>
          ))}
        </div>

        {/* 7-day rainfall mini bar chart */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">7-Day Rainfall Forecast</p>
          <div className="flex items-end gap-1 h-10">
            {(wx.daily_rain_forecast || []).slice(0, 7).map((mm, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-sm bg-gradient-to-t from-blue-500 to-blue-300 transition-all duration-700"
                  style={{ height: `${Math.max((mm / maxRain) * 36, mm > 0 ? 4 : 1)}px` }}
                />
                <span className="text-[9px] text-zinc-500">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


// ════════════════════════════════════════════════════════════════════════════
export default function HomeView({ t, lang, isOffline, setIsOffline }) {
  // Registration modal
  const [showRegModal, setShowRegModal] = useState(false);

  // Soil Form state
  const [farmerName, setFarmerName] = useState("");
  const [phone, setPhone] = useState("");
  const [acreage, setAcreage] = useState("3.5");
  const [nitrogen, setNitrogen] = useState("45");
  const [phosphorus, setPhosphorus] = useState("25");
  const [potassium, setPotassium] = useState("35");
  const [ph, setPh] = useState("6.5");
  const [organicCarbon, setOrganicCarbon] = useState("0.6");
  const [lat, setLat] = useState("16.5062");
  const [lng, setLng] = useState("80.6480");

  const [onboarded, setOnboarded] = useState(false);
  const [farmerId, setFarmerId] = useState(null);
  const [farmId, setFarmId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [recommendation, setRecommendation] = useState(null);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [weatherData, setWeatherData] = useState(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const ndviLayerGroupRef = useRef(null);
  const markerRef = useRef(null);

  // Load from local cache
  useEffect(() => {
    const cachedFarmer = getOfflineFarmer();
    const cachedFarm   = getOfflineFarm();
    const cachedRecs   = getOfflineRecommendations();

    if (cachedFarmer && cachedFarm) {
      setFarmerName(cachedFarmer.name);
      setPhone(cachedFarmer.phone);
      setLat(cachedFarmer.latitude.toString());
      setLng(cachedFarmer.longitude.toString());
      setAcreage(cachedFarm.acreage.toString());
      setNitrogen(cachedFarm.nitrogen.toString());
      setPhosphorus(cachedFarm.phosphorus.toString());
      setPotassium(cachedFarm.potassium.toString());
      setPh(cachedFarm.ph.toString());
      setOrganicCarbon(cachedFarm.organic_carbon.toString());
      setFarmerId(cachedFarmer.id);
      setFarmId(cachedFarm.id);
      setOnboarded(true);
      if (cachedRecs) setRecommendation(cachedRecs);
    }
  }, []);

  const fetchDashboardData = async (n, p, k, phVal, ocVal, latitude, longitude) => {
    setLoading(true);
    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);

    if (isOffline) {
      const mockRec = generateLocalOfflineRecommendations({
        nitrogen: parseFloat(n), phosphorus: parseFloat(p), potassium: parseFloat(k),
        ph: parseFloat(phVal), organic_carbon: parseFloat(ocVal)
      });
      setRecommendation(mockRec);
      saveOfflineRecommendations(mockRec);
      setWeatherAlerts([{ type: "Irrigation Alert (Offline)", severity: "High",
        message: "Offline spell check: Keep soil watered if dry.", recommendation: "Standard drip schedule recommended." }]);
      setLoading(false);
      return;
    }

    try {
      const recRes = await fetch(`${BACKEND_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nitrogen: parseFloat(n), phosphorus: parseFloat(p),
          potassium: parseFloat(k), ph: parseFloat(phVal), organic_carbon: parseFloat(ocVal),
          latitude: parsedLat, longitude: parsedLng })
      });
      if (recRes.ok) { const d = await recRes.json(); setRecommendation(d); saveOfflineRecommendations(d); }
      const wRes = await fetch(`${BACKEND_URL}/weather-alerts?latitude=${parsedLat}&longitude=${parsedLng}`);
      if (wRes.ok) { const w = await wRes.json(); setWeatherData(w); setWeatherAlerts(w.alerts || []); }
    } catch {
      const mockRec = generateLocalOfflineRecommendations({
        nitrogen: parseFloat(n), phosphorus: parseFloat(p), potassium: parseFloat(k),
        ph: parseFloat(phVal), organic_carbon: parseFloat(ocVal)
      });
      setRecommendation(mockRec);
      setWeatherAlerts([{ type: "Offline Fallback Warning", severity: "Medium",
        message: "Failed to reach server. Using offline rule engine simulation.",
        recommendation: "Ensure backend is running locally on port 8000." }]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!onboarded || !mapContainerRef.current) return;
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false })
        .setView([parsedLat, parsedLng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(mapRef.current);
      ndviLayerGroupRef.current = L.layerGroup().addTo(mapRef.current);
    } else { mapRef.current.setView([parsedLat, parsedLng], 15); }
    if (markerRef.current) { markerRef.current.setLatLng([parsedLat, parsedLng]); }
    else {
      markerRef.current = L.marker([parsedLat, parsedLng], {
        icon: L.divIcon({ className: "custom-marker",
          html: `<div class="w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse"></div>`,
          iconSize: [24, 24] })
      }).addTo(mapRef.current);
    }
    ndviLayerGroupRef.current.clearLayers();
    const gridSize = 0.002;
    const cellColors = [
      { color: "#065f46", text: "Lush Crop (NDVI: 0.85)", opacity: 0.45 },
      { color: "#10b981", text: "Healthy Crop (NDVI: 0.72)", opacity: 0.45 },
      { color: "#eab308", text: "Stressed Crop (NDVI: 0.48)", opacity: 0.5 },
      { color: "#f97316", text: "Low Crop (NDVI: 0.25)", opacity: 0.5 },
      { color: "#ef4444", text: "Bare Soil (NDVI: 0.12)", opacity: 0.55 }
    ];
    for (let i = -2; i < 2; i++) {
      for (let j = -2; j < 2; j++) {
        const bounds = [[parsedLat + i * gridSize, parsedLng + j * gridSize],
                        [parsedLat + (i+1) * gridSize, parsedLng + (j+1) * gridSize]];
        const cell = cellColors[(i + j + 5) % cellColors.length];
        const rect = L.rectangle(bounds, { color: "transparent", fillColor: cell.color, fillOpacity: cell.opacity, weight: 0 });
        rect.bindPopup(`<b>${cell.text}</b><br/>Simulated NDVI Spectral Data`);
        ndviLayerGroupRef.current.addLayer(rect);
      }
    }
    fetchDashboardData(nitrogen, phosphorus, potassium, ph, organicCarbon, lat, lng);
  }, [onboarded, lat, lng]);

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!farmerName || !phone) return;
    setLoading(true);
    const farmerData = { name: farmerName, phone, language_preference: lang, latitude: parseFloat(lat), longitude: parseFloat(lng) };

    if (isOffline) {
      const mockFarmer = { id: 999, ...farmerData };
      const mockFarm   = { id: 999, farmer_id: 999, nitrogen: parseFloat(nitrogen), phosphorus: parseFloat(phosphorus),
        potassium: parseFloat(potassium), ph: parseFloat(ph), organic_carbon: parseFloat(organicCarbon), acreage: parseFloat(acreage) };
      saveOfflineFarmer(mockFarmer); saveOfflineFarm(mockFarm);
      setFarmerId(999); setFarmId(999); setOnboarded(true); setShowRegModal(false);
      fetchDashboardData(nitrogen, phosphorus, potassium, ph, organicCarbon, lat, lng);
      return;
    }
    try {
      const farmerRes = await fetch(`${BACKEND_URL}/farmers`, { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(farmerData) });
      if (!farmerRes.ok) throw new Error("Farmer registration failed");
      const savedFarmer = await farmerRes.json();
      setFarmerId(savedFarmer.id); saveOfflineFarmer(savedFarmer);
      const farmRes = await fetch(`${BACKEND_URL}/farms`, { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmer_id: savedFarmer.id, nitrogen: parseFloat(nitrogen),
          phosphorus: parseFloat(phosphorus), potassium: parseFloat(potassium), ph: parseFloat(ph),
          organic_carbon: parseFloat(organicCarbon), acreage: parseFloat(acreage) }) });
      if (!farmRes.ok) throw new Error("Farm registration failed");
      const savedFarm = await farmRes.json();
      setFarmId(savedFarm.id); saveOfflineFarm(savedFarm);
      setOnboarded(true); setShowRegModal(false);
      fetchDashboardData(nitrogen, phosphorus, potassium, ph, organicCarbon, lat, lng);
    } catch {
      const mockFarmer = { id: 999, ...farmerData };
      const mockFarm   = { id: 999, farmer_id: 999, nitrogen: parseFloat(nitrogen), phosphorus: parseFloat(phosphorus),
        potassium: parseFloat(potassium), ph: parseFloat(ph), organic_carbon: parseFloat(organicCarbon), acreage: parseFloat(acreage) };
      saveOfflineFarmer(mockFarmer); saveOfflineFarm(mockFarm);
      setOnboarded(true); setShowRegModal(false);
      fetchDashboardData(nitrogen, phosphorus, potassium, ph, organicCarbon, lat, lng);
    } finally { setLoading(false); }
  };

  const handlePresetSelect = (preset) => { setLat(preset.lat.toString()); setLng(preset.lng.toString()); };

  const calculateHealthScore = () => {
    let score = 100;
    if (parseFloat(nitrogen) < 60) score -= 15;
    if (parseFloat(phosphorus) < 30) score -= 10;
    if (parseFloat(potassium) < 30) score -= 10;
    const pHVal = parseFloat(ph);
    if (pHVal < 5.8 || pHVal > 7.5) score -= 15;
    if (parseFloat(organicCarbon) < 0.6) score -= 15;
    if (weatherAlerts.some(a => a.type.includes("Irrigation Alert"))) score -= 10;
    return Math.max(score, 30);
  };

  const healthScore = onboarded ? calculateHealthScore() : 100;

  const getNextTask = () => {
    const n = parseFloat(nitrogen); const p = parseFloat(phosphorus); const pHVal = parseFloat(ph);
    if (weatherAlerts.some(a => a.type.includes("Irrigation Alert"))) return "Irrigate Farm Immediately: Low forecast rainfall (<1mm) detected.";
    if (n < 50) return "Apply Urea Tomorrow: Nitrogen content is extremely low.";
    if (p < 35) return "Apply DAP: Phosphorus is below required levels.";
    if (pHVal < 5.8) return "Apply Lime Compound to raise acidic soil pH.";
    return "Remove weeds and inspect leaves for pests.";
  };

  // ── REGISTRATION MODAL ────────────────────────────────────────────────────
  const RegistrationModal = () => (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-2xl rounded-3xl border border-emerald-500/20 shadow-2xl"
        style={{ background: "linear-gradient(135deg,#0a1a0f 0%,#0d1117 60%,#0a1220 100%)" }}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Register Your Farm</h2>
              <p className="text-xs text-zinc-400">Enter your details to get personalised AI recommendations</p>
            </div>
          </div>
          <button onClick={() => setShowRegModal(false)}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleOnboardSubmit} className="p-6 space-y-5">
          {/* Farmer Info */}
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">👤 Farmer Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400">{t("farmerName")}</label>
                <input type="text" value={farmerName} onChange={(e) => setFarmerName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar" className="glass-input" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400">{t("phoneNumber")}</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210" className="glass-input" required />
              </div>
            </div>
          </div>

          {/* Soil Data */}
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">🌱 Soil Test Data</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: t("nitrogen"), val: nitrogen, set: setNitrogen, step: "1" },
                { label: t("phosphorus"), val: phosphorus, set: setPhosphorus, step: "1" },
                { label: t("potassium"), val: potassium, set: setPotassium, step: "1" },
                { label: t("ph"), val: ph, set: setPh, step: "0.1" },
                { label: t("organicCarbon"), val: organicCarbon, set: setOrganicCarbon, step: "0.01" },
                { label: t("acreage"), val: acreage, set: setAcreage, step: "0.1" },
              ].map(({ label, val, set, step }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400">{label}</label>
                  <input type="number" step={step} value={val} onChange={(e) => set(e.target.value)} className="glass-input" required />
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">📍 Farm Location</p>
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p, idx) => (
                  <button key={idx} type="button" onClick={() => handlePresetSelect(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      lat === p.lat.toString() && lng === p.lng.toString()
                        ? "bg-emerald-600/40 text-emerald-300 border-emerald-500"
                        : "bg-zinc-800 text-zinc-400 border-transparent hover:bg-zinc-700"}`}>
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" className="glass-input text-xs" required />
                <input type="text" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" className="glass-input text-xs" required />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base font-bold">
            {loading ? (
              <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Registering Farm...</>
            ) : (
              <><Sprout className="w-5 h-5" /> Register My Farm & Get AI Insights</>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // DASHBOARD (after onboarding)
  // ════════════════════════════════════════════════════════════════════════════
  if (onboarded) {
    const nextTask = getNextTask();
    return (
      <div className="pb-24 space-y-6">
        {/* Offline Toggle */}
        <div className="flex items-center justify-between p-3 glass-card rounded-xl">
          <div className="flex items-center gap-2">
            {isOffline
              ? <WifiOff className="text-amber-500 w-5 h-5 animate-pulse" />
              : <Wifi className="text-emerald-500 w-5 h-5 animate-pulse" />}
            <span className="text-sm font-semibold text-zinc-300">
              {isOffline ? t("offlineMode") : t("onlineMode")}
            </span>
          </div>
          <button onClick={() => { const next = !isOffline; setIsOffline(next); fetchDashboardData(nitrogen, phosphorus, potassium, ph, organicCarbon, lat, lng); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isOffline
              ? "bg-amber-600/30 text-amber-300 border border-amber-500/20"
              : "bg-emerald-600/30 text-emerald-300 border border-emerald-500/20"}`}>
            Toggle Connection
          </button>
        </div>

        {/* Farmer Banner */}
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 uppercase tracking-widest font-bold">Farmer Profile</span>
            <h2 className="text-xl font-bold text-zinc-100">{farmerName}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">📞 {phone} | 🌾 {acreage} Acres | 📍 {lat}, {lng}</p>
          </div>
          <button onClick={() => setOnboarded(false)} className="text-xs text-zinc-400 hover:text-emerald-400 underline transition-all">
            Edit Soil Test
          </button>
        </div>

        {/* Health + Next Task */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6 flex items-center justify-between border-emerald-500/10">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-400">{t("farmHealthScore")}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-emerald-500">{healthScore}</span>
                <span className="text-sm text-zinc-400">/ 100</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-zinc-300">{healthScore > 80 ? "Optimal Soil Nutrient Levels" : "Deficiency Detected"}</span>
              </div>
            </div>
            <div className="relative w-20 h-20">
              <svg className="w-full h-full">
                <circle cx="40" cy="40" r="34" stroke="rgba(16,185,129,0.1)" strokeWidth="6" fill="transparent" />
                <circle cx="40" cy="40" r="34" stroke="#10b981" strokeWidth="6" fill="transparent"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - healthScore / 100)}
                  className="progress-ring__circle" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-zinc-200">{healthScore}%</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex flex-col justify-between border-emerald-500/10">
            <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm uppercase tracking-wider">{t("nextTask")}</h3>
            </div>
            <p className="text-zinc-200 text-base font-semibold leading-relaxed mb-4">"{nextTask}"</p>
            <div className="text-xs text-zinc-400 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/10">
              Recommended based on real-time soil chemistry and precipitation logs.
            </div>
          </div>
        </div>

        {/* Satellite Map */}
        <div className="glass-card rounded-2xl p-5 space-y-4 border-emerald-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-500 animate-spin" style={{ animationDuration: "12s" }} />
              <h3 className="font-bold text-zinc-200">{t("satelliteView")}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {[["red-500","Soil"],["yellow-500","Dry"],["emerald-600","Lush"]].map(([c,l]) => (
                <span key={l} className="flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded bg-${c} block`}/>{l}</span>
              ))}
            </div>
          </div>
          <div ref={mapContainerRef} className="w-full h-[280px] rounded-xl overflow-hidden shadow-inner border border-emerald-500/20" />
          <p className="text-xs text-zinc-400 leading-normal">Heatmap simulates spectral satellite reflectance (NDVI) overlaying your crop rows. Tap grids to view details.</p>
        </div>

        {/* AI Crop Recommendations */}
        <div className="glass-card rounded-2xl p-6 space-y-4 border-emerald-500/10">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Sprout className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-zinc-200 text-lg">{t("cropRecommendations")}</h3>
          </div>
          {loading ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              <span className="text-xs text-zinc-400">Analyzing soil chemistry...</span>
            </div>
          ) : recommendation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-xl">
                  <span className="text-xs text-zinc-400 block mb-1">Recommended Crop</span>
                  <span className="text-xl font-bold text-emerald-400">{recommendation.recommended_crop}</span>
                </div>
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-xl">
                  <span className="text-xs text-zinc-400 block mb-1">AI Match Confidence</span>
                  <span className="text-xl font-bold text-teal-400">{recommendation.confidence}%</span>
                </div>
              </div>
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-xl">
                <span className="text-xs text-zinc-400 block mb-1">Expected Yield</span>
                <span className="text-sm font-semibold text-zinc-200">{recommendation.expected_yield}</span>
              </div>
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-400">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>{t("explainWhy")}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-medium">{recommendation.why}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Weather Alerts */}
        <div className="glass-card rounded-2xl p-6 space-y-4 border-emerald-500/10">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Droplet className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-zinc-200 text-lg">{t("weatherAlerts")}</h3>
          </div>
          {weatherAlerts.length > 0 ? (
            <div className="space-y-3">
              {weatherAlerts.map((alert, idx) => (
                <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 ${
                  alert.severity === "High" ? "bg-amber-600/15 border-amber-500/30 text-amber-200" : "bg-emerald-950/20 border-emerald-500/15 text-zinc-200"}`}>
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${alert.severity === "High" ? "text-amber-500" : "text-emerald-500"}`} />
                  <div className="space-y-1">
                    <span className="font-bold text-sm block">{alert.type}</span>
                    <p className="text-xs text-zinc-300 leading-normal">{alert.message}</p>
                    <p className="text-xs font-semibold text-emerald-400 mt-2">👉 {alert.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-400">Loading dynamic weather advisory data...</p>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LANDING PAGE (before onboarding)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="pb-28 space-y-10">
      {/* Registration Modal */}
      {showRegModal && <RegistrationModal />}

      {/* Offline Toggle */}
      <div className="flex items-center justify-between p-3 glass-card rounded-xl">
        <div className="flex items-center gap-2">
          {isOffline
            ? <WifiOff className="text-amber-500 w-5 h-5 animate-pulse" />
            : <Wifi className="text-emerald-500 w-5 h-5 animate-pulse" />}
          <span className="text-sm font-semibold text-zinc-300">{isOffline ? t("offlineMode") : t("onlineMode")}</span>
        </div>
        <button onClick={() => setIsOffline(v => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isOffline
            ? "bg-amber-600/30 text-amber-300 border border-amber-500/20"
            : "bg-emerald-600/30 text-emerald-300 border border-emerald-500/20"}`}>
          Toggle Connection
        </button>
      </div>

      {/* ── HERO SECTION ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20"
        style={{ background: "linear-gradient(135deg,#052e16 0%,#064e3b 40%,#0f172a 100%)" }}>
        {/* Decorative glow circles */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full">
              <Sprout className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">KrishiMitra AI</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-zinc-100 via-emerald-200 to-teal-300 bg-clip-text text-transparent">
                Smart Farming for
              </span>
              <br />
              <span className="text-white">India's Farmers</span>
            </h1>
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed max-w-md">
              AI-powered crop recommendations, real-time weather alerts, and satellite NDVI mapping — 
              designed to maximise your yield and reduce input costs.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Free to use
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Works offline
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Multilingual support
              </div>
            </div>
          </div>

          {/* Hero icon grid */}
          <div className="grid grid-cols-2 gap-3 flex-shrink-0">
            {[
              { icon: Sun, label: "Weather AI", color: "from-amber-600 to-orange-600" },
              { icon: Leaf, label: "Crop Reco", color: "from-emerald-600 to-teal-600" },
              { icon: Tractor, label: "Farm Tools", color: "from-teal-600 to-cyan-600" },
              { icon: TrendingUp, label: "Mandi Rates", color: "from-lime-600 to-green-600" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-zinc-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE WEATHER WIDGET ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-full" />
          <h2 className="text-lg font-bold text-zinc-100">Live Weather — Your Location</h2>
        </div>
        <LiveWeatherWidget />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full" />
          <h2 className="text-lg font-bold text-zinc-100">Indian Agriculture at a Glance</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {INDIA_STATS.map(({ icon: Icon, label, value, desc, color }) => (
            <div key={label} className="glass-card rounded-2xl p-5 flex flex-col gap-3 hover:scale-[1.02] transition-transform cursor-default">
              <div className={`p-2.5 w-fit rounded-xl bg-${color}-500/15 border border-${color}-500/20`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
              </div>
              <div>
                <p className={`text-2xl font-extrabold text-${color}-400`}>{value}</p>
                <p className="text-xs font-bold text-zinc-200 mt-0.5">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Insight bar */}
        <div className="mt-4 p-4 rounded-2xl border border-emerald-500/15 flex items-center gap-4"
          style={{ background: "linear-gradient(90deg,rgba(16,185,129,0.08) 0%,transparent 100%)" }}>
          <BarChart3 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-zinc-300 leading-relaxed">
            India is the world's <span className="text-emerald-300 font-semibold">2nd largest</span> agricultural producer.
            With AI-assisted farming, smallholder farmers can increase net income by up to{" "}
            <span className="text-emerald-300 font-semibold">₹20,000 per acre</span> per season through optimised inputs.
          </p>
        </div>
      </section>

      {/* ── REGISTER YOUR FARM CTA ───────────────────────────────────────────── */}
      <section>
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 shadow-2xl"
          style={{ background: "linear-gradient(135deg,#052e16 0%,#065f46 50%,#0f2d1a 100%)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-900/50 flex-shrink-0">
                <Tractor className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white leading-tight">Register Your Farm</h2>
                <p className="text-emerald-200/80 text-sm mt-1 max-w-sm leading-relaxed">
                  Set up your farm profile in under 2 minutes. Enter soil test data, farm location, and get personalised AI crop recommendations instantly.
                </p>
                <div className="flex flex-wrap gap-3 mt-4">
                  {["AI Crop Advice", "Soil Analysis", "Weather Alerts", "NDVI Mapping"].map(f => (
                    <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-200 border border-white/15">
                      <CheckCircle className="w-3 h-3" /> {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              id="register-farm-btn"
              onClick={() => setShowRegModal(true)}
              className="flex-shrink-0 flex items-center gap-3 px-8 py-4 rounded-2xl font-extrabold text-base transition-all
                bg-white text-emerald-900 hover:bg-emerald-50 shadow-xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-95">
              <Sprout className="w-5 h-5" />
              Register Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── BEST PRODUCTS FOR FARMING ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-teal-400 to-emerald-500 rounded-full" />
            <h2 className="text-lg font-bold text-zinc-100">Best Products for Farmers</h2>
          </div>
          <span className="text-xs text-zinc-500 font-medium">Fertilisers · Pesticides · Bio-inputs</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRODUCTS.map((product) => (
            <div key={product.name} className="glass-card rounded-2xl p-5 flex flex-col gap-3 group hover:border-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-900/20">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{product.icon}</span>
                  <div>
                    <h3 className="font-bold text-zinc-100 text-sm leading-tight">{product.name}</h3>
                    <p className="text-xs text-zinc-500">{product.brand}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${TAG_COLORS[product.tagColor]}`}>
                  {product.tag}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed flex-1">{product.desc}</p>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <StarRating rating={product.rating} />
                <span className="text-xs font-bold text-emerald-300">{product.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BEST FARMING EQUIPMENT ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
            <h2 className="text-lg font-bold text-zinc-100">Top Farming Equipment</h2>
          </div>
          <span className="text-xs text-zinc-500 font-medium">Tractors · Irrigation · Smart Tech</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {EQUIPMENT.map((eq) => (
            <div key={eq.name} className="glass-card rounded-2xl p-5 flex flex-col gap-3 group hover:border-teal-500/30 transition-all hover:shadow-lg hover:shadow-teal-900/20">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{eq.icon}</span>
                  <div>
                    <h3 className="font-bold text-zinc-100 text-sm leading-tight">{eq.name}</h3>
                    <p className="text-xs text-zinc-500">{eq.brand}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${TAG_COLORS[eq.tagColor] ?? TAG_COLORS.emerald}`}>
                  {eq.tag}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed flex-1">{eq.desc}</p>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <Wrench className="w-3.5 h-3.5 text-zinc-500" /> Equipment
                </span>
                <span className="text-xs font-bold text-teal-300">{eq.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER CTA ───────────────────────────────────────────────────────── */}
      <section className="text-center py-8 px-4 rounded-3xl border border-zinc-800"
        style={{ background: "linear-gradient(135deg,#0d1117 0%,#0a1a0f 100%)" }}>
        <Sprout className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-xl font-extrabold text-white mb-2">Ready to grow smarter?</h3>
        <p className="text-zinc-400 text-sm mb-6 max-w-sm mx-auto">
          Join thousands of Indian farmers already using KrishiMitra AI to make data-driven decisions.
        </p>
        <button onClick={() => setShowRegModal(true)}
          className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base font-bold">
          <Tractor className="w-5 h-5" /> Register Your Farm Free
        </button>
      </section>
    </div>
  );
}
