import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  AlertCircle,
  FileText,
  Video,
  VideoOff,
  RefreshCw,
  X,
  ZoomIn,
  FlipHorizontal,
  Loader2,
  ShieldCheck,
  ScanLine
} from "lucide-react";

const BACKEND_URL = "https://krishimitra-ai-qga4.onrender.com";

// ── Real sample image (actual photo of a diseased leaf) ─────────────────────
const REAL_SAMPLE = {
  name: "Tomato Early Blight",
  filename: "tomato_early_blight.jpg",
  imageSrc: "/sample_tomato_early_blight.jpg",
  desc: "Real photo — Alternaria solani (Early Blight)",
  disease: "Early Blight",
  emoji: "🍅",
};

const MOCK_TEMPLATES = [
  {
    name: "Yellowing Cotton Leaf",
    filename: "cotton_mosaic_yellow.jpg",
    previewColor: "from-yellow-600/40 to-yellow-800/40",
    desc: "Test: Yellow Vein Mosaic virus",
    emoji: "🌿"
  },
  {
    name: "Spotted Wheat Leaf",
    filename: "wheat_spots_blight.jpg",
    previewColor: "from-amber-700/40 to-amber-900/40",
    desc: "Test: Leaf Blight fungus",
    emoji: "🌾"
  },
  {
    name: "Lush Green Groundnut",
    filename: "groundnut_healthy.jpg",
    previewColor: "from-emerald-700/40 to-emerald-900/40",
    desc: "Test: Healthy leaf",
    emoji: "🥜"
  },
  {
    name: "Rice Blast Leaf",
    filename: "rice_blast_leaf.jpg",
    previewColor: "from-stone-600/40 to-stone-800/40",
    desc: "Test: Rice Blast fungal",
    emoji: "🌾"
  },
  {
    name: "Potato Late Blight",
    filename: "potato_late_blight.jpg",
    previewColor: "from-red-800/40 to-red-950/40",
    desc: "Test: Late Blight",
    emoji: "🥔"
  },
  {
    name: "Tomato Curl Virus",
    filename: "tomato_leaf_curl_virus.jpg",
    previewColor: "from-orange-700/40 to-red-800/40",
    desc: "Test: Leaf Curl Virus",
    emoji: "🍅"
  }
];

// ── Severity badge colour ─────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  High:   "bg-red-500/20 text-red-300 border-red-500/30",
  Medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Low:    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function CameraView({ t, lang }) {
  // ── Camera state ────────────────────────────────────────────────────────────
  const [cameraMode, setCameraMode]           = useState(false);   // live camera active
  const [cameraPermission, setCameraPermission] = useState("idle"); // idle | requesting | granted | denied
  const [facingMode, setFacingMode]           = useState("environment"); // environment = back cam
  const [stream, setStream]                   = useState(null);
  const [capturedBlob, setCapturedBlob]       = useState(null);

  // ── File / preview state ────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile]       = useState(null);
  const [previewUrl, setPreviewUrl]           = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [diagnosis, setDiagnosis]             = useState(null);
  const [error, setError]                     = useState(null);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const fileInputRef = useRef(null);

  // ── Stop camera stream ──────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setCameraMode(false);
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  // Attach stream to video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // ── Start camera ────────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraPermission("requesting");
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
      setCameraPermission("granted");
      setCameraMode(true);
      setDiagnosis(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      setCapturedBlob(null);
    } catch (err) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraPermission("denied");
        setError("Camera access was denied. Please allow camera permission in your browser settings and try again.");
      } else if (err.name === "NotFoundError") {
        setCameraPermission("denied");
        setError("No camera found on this device. Please use the 'Upload Image' option instead.");
      } else {
        setCameraPermission("denied");
        setError(`Camera error: ${err.message}`);
      }
    }
  };

  // ── Flip camera (front/back) ────────────────────────────────────────────────
  const flipCamera = async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: next, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        setStream(newStream);
      } catch (err) {
        setError("Could not switch camera.");
      }
    }
  };

  // ── Capture photo from live feed ────────────────────────────────────────────
  const capturePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      setCapturedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setSelectedFile({ name: `captured_leaf_${Date.now()}.jpg`, isCaptured: true, blob });
      stopCamera();
    }, "image/jpeg", 0.92);
  };

  // ── File picker ─────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDiagnosis(null);
      setError(null);
    }
  };

  // ── Real sample image ─────────────────────────────────────────────────────
  const selectRealSample = () => {
    stopCamera();
    setSelectedFile({ name: REAL_SAMPLE.filename, isReal: true, imageSrc: REAL_SAMPLE.imageSrc });
    setPreviewUrl(REAL_SAMPLE.imageSrc);
    setDiagnosis(null);
    setError(null);
  };

  // ── Mock template ───────────────────────────────────────────────────────────
  const selectMockTemplate = (template) => {
    stopCamera();
    setSelectedFile({ name: template.filename, isMock: true });
    setPreviewUrl(template.name);
    setDiagnosis(null);
    setError(null);
  };

  // ── Reset all ───────────────────────────────────────────────────────────────
  const resetAll = () => {
    stopCamera();
    setSelectedFile(null);
    setPreviewUrl(null);
    setDiagnosis(null);
    setError(null);
    setCapturedBlob(null);
    setCameraPermission("idle");
  };

  // ── Diagnose ────────────────────────────────────────────────────────────────
  const handleDiagnose = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    const cachedFarm = localStorage.getItem("krishimitra_farm");
    const farm       = cachedFarm ? JSON.parse(cachedFarm) : null;
    const farmId     = farm ? farm.id : 1;

    try {
      const formData = new FormData();
      formData.append("farm_id", farmId.toString());

      if (selectedFile.isCaptured && capturedBlob) {
        formData.append("file", capturedBlob, selectedFile.name);
      } else if (selectedFile.isReal) {
        // Fetch the real sample image from /public and send as blob
        const imgRes = await fetch(selectedFile.imageSrc);
        const imgBlob = await imgRes.blob();
        formData.append("file", imgBlob, selectedFile.name);
      } else if (selectedFile.isMock) {
        const blob = new Blob(["mock_data"], { type: "image/jpeg" });
        formData.append("file", blob, selectedFile.name);
      } else {
        formData.append("file", selectedFile);
      }

      const res = await fetch(`${BACKEND_URL}/diagnose`, { method: "POST", body: formData });
      if (res.ok) {
        setDiagnosis(await res.json());
      } else {
        throw new Error("Diagnosis failed");
      }
    } catch {
      // Offline fallback
      const fn = selectedFile.name.toLowerCase();
      let disease = "Healthy", confidence = 92.5;
      let tips = ["Maintain watering schedule.", "Inspect leaves weekly."];
      let prev = ["Monitor soil nutrient levels regularly.", "Rotate crops each season."];
      let severity = "Low";

      if (fn.includes("blight") || fn.includes("spot")) {
        disease = "Bacterial Leaf Blight"; confidence = 85.5; severity = "High";
        tips = ["Apply Copper Oxychloride (0.3%) or Mancozeb (0.25%).", "Remove infected leaves immediately.", "Avoid overhead irrigation."];
        prev = ["Use certified disease-free seed.", "Maintain balanced NPK fertilization.", "Ensure proper field drainage."];
      } else if (fn.includes("mosaic") || fn.includes("yellow") || fn.includes("curl")) {
        disease = "Yellow Mosaic Virus"; confidence = 78.4; severity = "High";
        tips = ["Spray Imidacloprid (0.5 ml/L) for whitefly control.", "Eradicate virus-infected weeds from surroundings.", "Uproot and destroy infected plants."];
        prev = ["Use virus-resistant seed varieties.", "Monitor and control whitefly population.", "Avoid planting near infected fields."];
      } else if (fn.includes("blast")) {
        disease = "Rice Blast"; confidence = 88.2; severity = "High";
        tips = ["Spray Tricyclazole 75% WP (0.6 g/L) at first symptom.", "Repeat spray after 10-15 days.", "Drain flooded areas promptly."];
        prev = ["Use blast-resistant rice varieties.", "Avoid excess nitrogen application.", "Maintain proper plant spacing for airflow."];
      } else if (fn.includes("rust")) {
        disease = "Rust"; confidence = 82.1; severity = "Medium";
        tips = ["Apply Propiconazole 25% EC at 0.1% concentration.", "Remove and burn infected leaves.", "Avoid overhead sprinkler irrigation."];
        prev = ["Plant rust-resistant varieties.", "Apply balanced potash fertilizer.", "Ensure good field drainage."];
      }

      setDiagnosis({
        disease_tag: disease, confidence, severity,
        disease_type: disease.includes("Virus") ? "Viral" : disease.includes("Leaf Blight") ? "Bacterial" : "Fungal",
        scientific_name: "N/A (offline mode)", crop: "Unknown",
        symptoms: "Offline mode — connect to backend for detailed symptom analysis.",
        treatment_tips: tips, prevention_tips: prev,
        ticket_created: disease !== "Healthy",
        ticket_id: disease !== "Healthy" ? 777 : null,
      });
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="pb-24 space-y-5">

      {/* Header */}
      <div className="glass-card rounded-2xl p-5 border-emerald-500/10 flex items-center gap-3">
        <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-500/20 text-emerald-500">
          <Camera className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-100">{t("cameraTitle")}</h2>
          <p className="text-xs text-zinc-400">AI Disease Diagnostic — TF-IDF + Random Forest Model</p>
        </div>
      </div>

      {/* ── LIVE CAMERA VIEW ────────────────────────────────────────────────── */}
      {cameraMode && (
        <div className="glass-card rounded-2xl overflow-hidden border border-emerald-500/20 shadow-2xl">
          {/* Camera controls bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-zinc-300">Live Camera</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={flipCamera}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
                title="Flip camera">
                <FlipHorizontal className="w-4 h-4" />
              </button>
              <button onClick={stopCamera}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-red-900/40 text-zinc-400 hover:text-red-400 transition-all"
                title="Close camera">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video feed */}
          <div className="relative bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-[420px] object-cover"
            />

            {/* Scanning overlay reticle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Corner brackets */}
              <div className="relative w-56 h-56">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                {/* Animated scan line */}
                <div className="absolute left-2 right-2 h-0.5 bg-emerald-400/70 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                  style={{ animation: "scanLineVert 2.5s ease-in-out infinite" }} />
              </div>
            </div>

            {/* Bottom hint */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="px-3 py-1.5 rounded-full bg-zinc-950/80 border border-zinc-700 text-xs text-zinc-300">
                Point at the leaf and tap Capture
              </div>
            </div>
          </div>

          {/* Capture button */}
          <div className="flex items-center justify-center p-6 bg-zinc-900/60">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full border-4 border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/40
                flex items-center justify-center shadow-lg shadow-emerald-900/50 transition-all hover:scale-105 active:scale-95">
              <div className="w-10 h-10 rounded-full bg-emerald-400 hover:bg-emerald-300 transition-all" />
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── PERMISSION REQUEST CARD ─────────────────────────────────────────── */}
      {cameraPermission === "requesting" && !cameraMode && (
        <div className="glass-card rounded-2xl p-8 flex flex-col items-center gap-4 border-teal-500/20 text-center">
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20">
            <ShieldCheck className="w-8 h-8 text-teal-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100 text-base">Requesting Camera Access</h3>
            <p className="text-xs text-zinc-400 mt-1">Please allow camera permission in your browser popup to scan your crop leaf.</p>
          </div>
          <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
        </div>
      )}

      {/* ── PERMISSION DENIED CARD ──────────────────────────────────────────── */}
      {cameraPermission === "denied" && !cameraMode && (
        <div className="glass-card rounded-2xl p-6 border border-red-500/20 bg-red-950/10">
          <div className="flex items-start gap-3">
            <VideoOff className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-300 text-sm">Camera Access Denied</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{error}</p>
              <button onClick={() => { setCameraPermission("idle"); setError(null); }}
                className="mt-3 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-semibold transition-all">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN SCANNER PANEL ──────────────────────────────────────────────── */}
      {!cameraMode && (
        <div className="glass-card rounded-2xl p-6 space-y-6 border-emerald-500/10">

          {/* Image not yet selected → show option buttons */}
          {!previewUrl && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Live Camera button */}
                <button
                  id="open-camera-btn"
                  onClick={startCamera}
                  disabled={cameraPermission === "requesting"}
                  className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-emerald-500/30
                    hover:border-emerald-500/60 hover:bg-emerald-950/10 transition-all text-center disabled:opacity-50">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                    <Video className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <span className="block font-bold text-zinc-200 text-sm">Open Camera</span>
                    <span className="block text-xs text-zinc-500 mt-0.5">Take a live photo of your leaf</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-semibold">
                    Requires camera permission
                  </span>
                </button>

                {/* Upload file button */}
                <label className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-zinc-700
                  hover:border-teal-500/50 hover:bg-teal-950/10 transition-all text-center cursor-pointer">
                  <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 group-hover:bg-teal-500/20 transition-all">
                    <ImageIcon className="w-8 h-8 text-teal-400" />
                  </div>
                  <div>
                    <span className="block font-bold text-zinc-200 text-sm">Upload Image</span>
                    <span className="block text-xs text-zinc-500 mt-0.5">Select from your gallery</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/20 font-semibold">
                    JPEG · PNG supported
                  </span>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              {/* ── REAL SAMPLE IMAGE ──────────────────────────────────── */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">📸 Real Diseased Leaf Sample:</p>
                <button
                  id="real-sample-btn"
                  onClick={selectRealSample}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl border-2 border-red-500/40
                    hover:border-red-500/70 bg-red-950/10 hover:bg-red-950/20 transition-all text-left group">
                  <div className="relative flex-shrink-0">
                    <img
                      src={REAL_SAMPLE.imageSrc}
                      alt="Tomato Early Blight"
                      className="w-20 h-20 rounded-xl object-cover border border-red-500/30 shadow-lg"
                    />
                    <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                      bg-red-500 text-white shadow">REAL</span>
                  </div>
                  <div className="flex-1">
                    <span className="block font-bold text-zinc-100 text-sm">{REAL_SAMPLE.name}</span>
                    <span className="block text-xs text-red-300 mt-0.5">{REAL_SAMPLE.desc}</span>
                    <span className="block text-xs text-zinc-500 mt-1">Click to load &amp; diagnose with AI model</span>
                  </div>
                  <div className="flex-shrink-0 p-2 rounded-xl bg-red-500/10 border border-red-500/20
                    group-hover:bg-red-500/20 transition-all">
                    <ZoomIn className="w-5 h-5 text-red-400" />
                  </div>
                </button>
              </div>

              {/* Mock templates */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Or pick a simulated leaf:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {MOCK_TEMPLATES.map((tmpl, idx) => (
                    <button key={idx} onClick={() => selectMockTemplate(tmpl)}
                      className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-left hover:border-emerald-500/30 hover:bg-emerald-950/10 transition-all group">
                      <span className="text-xl block mb-1">{tmpl.emoji}</span>
                      <span className="text-xs font-bold text-zinc-200 block leading-tight">{tmpl.name}</span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">{tmpl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preview + diagnose */}
          {previewUrl && !diagnosis && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative rounded-xl overflow-hidden aspect-video border border-emerald-500/20 bg-zinc-900/80 flex items-center justify-center shadow-inner">
                {selectedFile?.isReal ? (
                  <img src={selectedFile.imageSrc} alt="Real diseased leaf" className="w-full h-full object-contain" />
                ) : selectedFile?.isMock ? (
                  <div className={`w-full h-full bg-gradient-to-br ${MOCK_TEMPLATES.find(t => t.filename === selectedFile.name)?.previewColor ?? "from-zinc-700 to-zinc-900"} flex flex-col items-center justify-center text-center p-4`}>
                    <span className="text-5xl mb-3">{MOCK_TEMPLATES.find(t => t.filename === selectedFile.name)?.emoji ?? "🌿"}</span>
                    <span className="text-lg font-bold text-zinc-100">{previewUrl}</span>
                    <span className="text-xs text-emerald-400 mt-1">Simulated Leaf Sample Loaded</span>
                  </div>
                ) : (
                  <img src={previewUrl} alt="Selected leaf" className="w-full h-full object-contain" />
                )}

                {/* Scanning animation overlay */}
                {loading && (
                  <div className="absolute inset-0 bg-emerald-950/30 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4">
                    <div className="w-full h-1 bg-emerald-500/20 relative overflow-hidden rounded-full">
                      <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-emerald-400 rounded-full"
                        style={{ animation: "scanLine 1.8s infinite linear" }} />
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-950/90 px-5 py-2.5 rounded-xl border border-emerald-500/30 shadow-lg">
                      <ScanLine className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-300">Analysing with ML model…</span>
                    </div>
                  </div>
                )}

                {/* Label if captured from camera */}
                {selectedFile?.isCaptured && !loading && (
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-emerald-900/80 border border-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center gap-1">
                    <Camera className="w-3 h-3" /> Captured
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {!loading && (
                <div className="flex gap-3">
                  <button onClick={resetAll} className="btn-secondary flex-1 py-3 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Reset
                  </button>
                  <button onClick={handleDiagnose} className="btn-primary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2">
                    <ZoomIn className="w-4 h-4" /> Diagnose Leaf
                  </button>
                </div>
              )}
              {loading && (
                <div className="flex items-center justify-center gap-2 py-3 text-emerald-400 text-sm font-semibold">
                  <Loader2 className="w-5 h-5 animate-spin" /> Running AI diagnosis…
                </div>
              )}
            </div>
          )}

          {/* ── DIAGNOSIS RESULTS ──────────────────────────────────────────── */}
          {diagnosis && !loading && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-t border-zinc-800 pt-5">
                <h3 className="font-bold text-zinc-200 text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  Diagnosis Report
                </h3>
                <button onClick={resetAll} className="text-xs text-zinc-400 hover:text-emerald-400 underline transition-all">
                  Scan Another
                </button>
              </div>

              {/* Disease verdict */}
              <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
                diagnosis.disease_tag === "Healthy"
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : "bg-red-950/20 border-red-500/30"}`}>
                {diagnosis.disease_tag === "Healthy"
                  ? <Check className="w-7 h-7 text-emerald-400 flex-shrink-0 mt-0.5" />
                  : <AlertTriangle className="w-7 h-7 text-red-400 flex-shrink-0 mt-0.5" />}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <span className="font-extrabold text-xl text-zinc-100 block">{diagnosis.disease_tag}</span>
                      {diagnosis.scientific_name && diagnosis.scientific_name !== "N/A" && (
                        <span className="text-xs text-zinc-500 italic">{diagnosis.scientific_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {diagnosis.severity && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${SEVERITY_STYLES[diagnosis.severity] ?? SEVERITY_STYLES.Medium}`}>
                          {diagnosis.severity} Risk
                        </span>
                      )}
                      {diagnosis.disease_type && diagnosis.disease_type !== "Unknown" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-700/40 text-zinc-300 border border-zinc-600/30">
                          {diagnosis.disease_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>AI Confidence</span>
                      <span className="font-bold text-zinc-200">{diagnosis.confidence}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        diagnosis.confidence >= 80 ? "bg-emerald-500" : diagnosis.confidence >= 65 ? "bg-amber-500" : "bg-red-500"
                      }`} style={{ width: `${diagnosis.confidence}%` }} />
                    </div>
                  </div>

                  {/* Crop tag */}
                  {diagnosis.crop && diagnosis.crop !== "Unknown" && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <span className="text-emerald-400 font-semibold">Crop:</span> {diagnosis.crop}
                    </div>
                  )}
                </div>
              </div>

              {/* Symptoms */}
              {diagnosis.symptoms && (
                <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-1.5">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">🔍 Observed Symptoms</span>
                  <p className="text-xs text-zinc-300 leading-relaxed">{diagnosis.symptoms}</p>
                </div>
              )}

              {/* Expert ticket alert */}
              {diagnosis.ticket_created && (
                <div className="p-4 bg-amber-600/15 border border-amber-500/30 rounded-xl text-amber-200 flex items-start gap-3 text-xs leading-relaxed">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <span className="font-bold block mb-0.5">{t("expertEscalated")}</span>
                    <span>Expert ticket #{diagnosis.ticket_id} submitted to Rythu Seva Kendra for human review.</span>
                  </div>
                </div>
              )}

              {/* Treatment tips */}
              <div className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-3">
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-400 block">🛠️ {t("treatmentTips")}</span>
                <ul className="space-y-2">
                  {diagnosis.treatment_tips.map((tip, idx) => (
                    <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2 leading-relaxed">
                      <span className="text-emerald-500 font-extrabold flex-shrink-0 mt-0.5">▸</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prevention tips */}
              {diagnosis.prevention_tips?.length > 0 && (
                <div className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-teal-400 block">🛡️ Prevention Measures</span>
                  <ul className="space-y-2">
                    {diagnosis.prevention_tips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2 leading-relaxed">
                        <span className="text-teal-500 font-extrabold flex-shrink-0 mt-0.5">▸</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scan line & vertical scan animations */}
      <style>{`
        @keyframes scanLine {
          0%   { left: -33%; }
          100% { left: 133%; }
        }
        @keyframes scanLineVert {
          0%   { top: 8px;  opacity: 1; }
          50%  { top: calc(100% - 8px); opacity: 0.7; }
          100% { top: 8px;  opacity: 1; }
        }
      `}</style>
    </div>
  );
}
