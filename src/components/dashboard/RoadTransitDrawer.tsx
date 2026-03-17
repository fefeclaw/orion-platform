"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  X, Zap, Truck, FileText, CheckCircle, AlertTriangle,
  Train, MapPin, Clock, Navigation, Send, Shield,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface RoadTransitDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Corridors CEDEAO ──────────────────────────────────────────────
const CORRIDORS = [
  {
    id: "CI-BF",
    label: "Abidjan → Ouagadougou",
    distance: "1 100 km",
    duration: 18,
    border: "Niangoloko (CI/BF)",
    borderCode: "NLG",
    railAvailable: true,
    railDuration: 22,
    railLabel: "SITARAIL — ABJ → OUA",
  },
  {
    id: "CI-ML",
    label: "Abidjan → Bamako",
    distance: "1 300 km",
    duration: 22,
    border: "Faramana (CI/ML)",
    borderCode: "FRM",
    railAvailable: true,
    railDuration: 30,
    railLabel: "SITARAIL — ABJ → BKO",
  },
  {
    id: "CI-GH",
    label: "Abidjan → Accra",
    distance: "340 km",
    duration: 8,
    border: "Elubo (CI/GH)",
    borderCode: "ELB",
    railAvailable: false,
    railDuration: 0,
    railLabel: "",
  },
  {
    id: "CI-NG",
    label: "Abidjan → Lagos",
    distance: "940 km",
    duration: 16,
    border: "Frontière CI/NG",
    borderCode: "CNG",
    railAvailable: false,
    railDuration: 0,
    railLabel: "",
  },
];

// ─── Mock truck database ───────────────────────────────────────────
const MOCK_TRUCKS = [
  { chassis: "TRK-CI-8821", plate: "AB-1234-CI", driver: "Kouadio Jérôme", load: "Équipements industriels", weight: "24T" },
  { chassis: "TRK-CI-4407", plate: "AB-5678-CI", driver: "Ouédraogo Moussa", load: "Cacao brut — 312 sacs", weight: "18T" },
  { chassis: "TRK-CI-2290", plate: "BF-9901-Z",  driver: "Traoré Ibrahim",  load: "Matériel médical",     weight: "8T"  },
];

// ─── Simulate border waiting time (mock API) ───────────────────────
function simulateBorderWait(borderCode: string): number {
  const waits: Record<string, number> = {
    NLG: Math.random() > 0.4 ? 7.5 : 3.0,   // Niangoloko — often congested
    FRM: Math.random() > 0.5 ? 8.5 : 4.5,   // Faramana — high congestion
    ELB: Math.random() > 0.7 ? 2.0 : 1.0,   // Elubo — usually fast
    CNG: Math.random() > 0.6 ? 5.5 : 2.5,   // Frontière NG
  };
  return waits[borderCode] ?? 3;
}

// ─── Document checklist ────────────────────────────────────────────
const DOCS = [
  { id: "lettre_voiture",     label: "Lettre de voiture",         desc: "LV-CEDEAO réglementaire" },
  { id: "certificat_origine", label: "Certificat d'origine",      desc: "DGD Côte d'Ivoire" },
  { id: "assurance_cedeao",   label: "Assurance CEDEAO",          desc: "Couverture multi-pays" },
  { id: "laissez_passer",     label: "Laissez-passer transport",  desc: "Validé par douane ABJ" },
] as const;

type DocId = typeof DOCS[number]["id"];

// ─── Geofencing event ──────────────────────────────────────────────
interface GeoEvent {
  time: string;
  label: string;
  sub: string;
  color: string;
  done: boolean;
}

// ─── Form ─────────────────────────────────────────────────────────
interface TransitForm {
  corridorId: string;
  chassis: string;
  plate: string;
  driver: string;
  load: string;
  weight: string;
  departureTime: string;
}

const inputCls = "w-full bg-[#060d1a]/80 border border-white/8 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#34d399]/50 transition-colors placeholder:text-white/20";
const labelCls = "block text-[10px] text-white/30 mb-1.5 uppercase tracking-widest";

// ─── Corridor Map Visual ───────────────────────────────────────────
function CorridorMap({ corridorId, borderWait }: { corridorId: string; borderWait: number | null }) {
  const corridor = CORRIDORS.find((c) => c.id === corridorId);
  if (!corridor) return null;
  const alertColor = borderWait != null
    ? borderWait > 6 ? "#f59e0b" : borderWait > 3 ? "#34d399" : "#34d399"
    : "#34d399";

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ background: "#020a14", height: 110 }}>
      <svg viewBox="0 0 300 110" className="w-full h-full">
        {/* Grid */}
        {[50, 100, 150, 200, 250].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="110" stroke="#0a1f35" strokeWidth="0.5" />
        ))}
        {[25, 50, 75].map((y) => (
          <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#0a1f35" strokeWidth="0.5" />
        ))}

        {/* Road path */}
        <path d="M 30 75 Q 150 30 270 55" fill="none" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.25" strokeDasharray="4 3" />
        <motion.path
          d="M 30 75 Q 150 30 270 55"
          fill="none" stroke="#34d399" strokeWidth="2" strokeOpacity="0.7"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Origin — Abidjan */}
        <circle cx="30" cy="75" r="4" fill="#34d399" opacity="0.9" />
        <text x="30" y="92" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">ABJ</text>

        {/* Border post */}
        <motion.circle
          cx="165" cy="45" r="5"
          fill={alertColor} opacity="0.85"
          animate={{ r: [5, 7, 5], opacity: [0.85, 0.5, 0.85] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <text x="165" y="36" textAnchor="middle" fill={alertColor} fontSize="6.5" fontWeight="600">
          {corridor.borderCode}
        </text>

        {/* Destination */}
        <circle cx="270" cy="55" r="4" fill="rgba(255,255,255,0.25)" />
        <text x="270" y="72" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">
          {corridor.id.split("-")[1]}
        </text>

        {/* Moving truck */}
        <motion.g
          initial={{ x: 0 }}
          animate={{ x: [0, 80, 160, 200] }}
          transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
        >
          <circle cx="30" cy="75" r="3.5" fill="#34d399" filter="url(#tglow)" />
          <circle cx="30" cy="75" r="3.5" fill="none" stroke="#34d399" strokeWidth="1">
            <animate attributeName="r" values="3.5;8;3.5" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0;1" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </motion.g>

        <defs>
          <filter id="tglow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export default function RoadTransitDrawer({ isOpen, onClose }: RoadTransitDrawerProps) {
  const { data: session } = useSession();
  const t = useTranslation();
  const [step, setStep] = useState<"form" | "processing" | "active">("form");
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [dossierNum] = useState(`TRS-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`);
  const [borderWait, setBorderWait] = useState<number | null>(null);
  const [docsState, setDocsState] = useState<Record<DocId, boolean>>({
    lettre_voiture: false,
    certificat_origine: false,
    assurance_cedeao: false,
    laissez_passer: false,
  });
  const [showIntermodal, setShowIntermodal] = useState(false);
  const [geoEvents, setGeoEvents] = useState<GeoEvent[]>([]);
  const [activeGeoIdx, setActiveGeoIdx] = useState(-1);

  const [form, setForm] = useState<TransitForm>({
    corridorId: "CI-BF",
    chassis: "",
    plate: "",
    driver: "",
    load: "",
    weight: "",
    departureTime: "06:00",
  });

  const selectedCorridor = CORRIDORS.find((c) => c.id === form.corridorId) ?? CORRIDORS[0];

  // Recompute border wait + intermodal when corridor changes
  useEffect(() => {
    if (form.corridorId) {
      const wait = simulateBorderWait(selectedCorridor.borderCode);
      setBorderWait(wait);
      const totalHours = selectedCorridor.duration + wait;
      setShowIntermodal(selectedCorridor.railAvailable && totalHours > selectedCorridor.duration * 1.15);
    }
  }, [form.corridorId, selectedCorridor]);

  // Magic Fill
  const handleMagicFill = async () => {
    setIsMagicFilling(true);
    await new Promise((r) => setTimeout(r, 900));
    const truck = MOCK_TRUCKS[Math.floor(Math.random() * MOCK_TRUCKS.length)];
    const userName = session?.user?.name ?? "Orion Group";
    setForm((prev) => ({
      ...prev,
      chassis: truck.chassis,
      plate: truck.plate,
      driver: truck.driver,
      load: truck.load,
      weight: truck.weight,
      departureTime: "06:00",
    }));
    // Animate doc checklist generation
    setIsMagicFilling(false);
    await generateDocs();
  };

  const generateDocs = async () => {
    const docIds = Object.keys(docsState) as DocId[];
    for (const id of docIds) {
      await new Promise((r) => setTimeout(r, 420));
      setDocsState((prev) => ({ ...prev, [id]: true }));
    }
  };

  const set = (k: keyof TransitForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Object.values(docsState).every(Boolean)) {
      await generateDocs();
    }
    setStep("processing");
    await new Promise((r) => setTimeout(r, 2800));

    // Build geofencing timeline
    const now = new Date();
    const fmtTime = (offsetMin: number) => {
      const d = new Date(now.getTime() + offsetMin * 60000);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };
    const events: GeoEvent[] = [
      { time: fmtTime(0),   label: "Départ validé — Port Bouet, Abidjan",         sub: "Geofence ABJ · Documents transmis à la douane",  color: "#34d399", done: false },
      { time: fmtTime(90),  label: "Zone Tiébissou franchie",                       sub: `Corridor ${selectedCorridor.id} · Vitesse nominale`, color: "#34d399", done: false },
      { time: fmtTime(280), label: `Approche frontière — ${selectedCorridor.border}`, sub: "Pré-validation documents CEDEAO en cours",        color: borderWait && borderWait > 6 ? "#f59e0b" : "#34d399", done: false },
      { time: fmtTime(280 + (borderWait ?? 3) * 60), label: `Frontière franchie — ${selectedCorridor.border}`, sub: "Documents de transit validés par la douane", color: "#34d399", done: false },
      { time: fmtTime(selectedCorridor.duration * 60), label: `Arrivée estimée — ${selectedCorridor.label.split("→")[1].trim()}`, sub: `ETA calculée · ${selectedCorridor.distance}`, color: "#34d399", done: false },
    ];
    setGeoEvents(events);
    setStep("active");

    // Animate geofence events one by one
    for (let i = 0; i < events.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setActiveGeoIdx(i);
      setGeoEvents((prev) => prev.map((ev, idx) => idx <= i ? { ...ev, done: true } : ev));
    }
  };

  const handleClose = () => {
    setStep("form");
    setDocsState({ lettre_voiture: false, certificat_origine: false, assurance_cedeao: false, laissez_passer: false });
    setGeoEvents([]);
    setActiveGeoIdx(-1);
    onClose();
  };

  const allDocsDone = Object.values(docsState).every(Boolean);
  const isVigOrange = borderWait != null && borderWait > 6;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full z-50 w-full max-w-lg flex flex-col"
            style={{
              background: "linear-gradient(135deg, rgba(8,20,12,0.94), rgba(4,14,8,0.97)) padding-box, linear-gradient(135deg, rgba(52,211,153,0.15), rgba(52,211,153,0.04)) border-box",
              border: "1px solid transparent",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#34d399]/10">
                  <Truck size={15} className="text-[#34d399]" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Déclarer un Transit CEDEAO</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
                    Corridor Routier — Orion Logistics
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="text-white/20 hover:text-white/60 transition-colors">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Dossier + Border Wait badge */}
            <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-white/25 uppercase tracking-widest">N° transit</span>
              <div className="flex items-center gap-2">
                {isVigOrange && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                    style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
                  >
                    <AlertTriangle size={9} aria-hidden="true" />
                    Vigilance Orange
                  </motion.span>
                )}
                <span className="text-xs font-mono text-[#34d399]/70">{dossierNum}</span>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait">

                {/* ── STEP: FORM ──────────────────────────────────── */}
                {step === "form" && (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {/* Corridor map */}
                    <CorridorMap corridorId={form.corridorId} borderWait={borderWait} />

                    {/* Border Wait info */}
                    {borderWait != null && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-3 mb-4 flex items-center justify-between rounded-xl px-4 py-2.5"
                        style={{
                          background: isVigOrange ? "rgba(245,158,11,0.08)" : "rgba(52,211,153,0.06)",
                          border: `1px solid ${isVigOrange ? "rgba(245,158,11,0.25)" : "rgba(52,211,153,0.18)"}`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Clock size={13} style={{ color: isVigOrange ? "#f59e0b" : "#34d399" }} aria-hidden="true" />
                          <span className="text-xs" style={{ color: isVigOrange ? "#f59e0b" : "#34d399" }}>
                            Attente frontière — {selectedCorridor.border}
                          </span>
                        </div>
                        <span
                          className="text-xs font-semibold font-mono"
                          style={{ color: isVigOrange ? "#f59e0b" : "#34d399" }}
                        >
                          ~{borderWait.toFixed(1)}h
                          {isVigOrange && " ⚠"}
                        </span>
                      </motion.div>
                    )}

                    {/* Intermodal Bridge (Victor) */}
                    {showIntermodal && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="mb-4 rounded-xl p-3.5 border"
                        style={{ background: "rgba(247,129,198,0.06)", borderColor: "rgba(167,139,250,0.25)" }}
                      >
                        <div className="flex items-start gap-2.5">
                          <Train size={14} className="text-purple-400 mt-0.5 shrink-0" aria-hidden="true" />
                          <div>
                            <p className="text-xs font-semibold text-purple-300">Victor — Intermodal Bridge</p>
                            <p className="text-[11px] text-purple-300/60 mt-0.5">
                              Congestion détectée ({borderWait?.toFixed(1)}h). Option ferroviaire disponible :
                            </p>
                            <p className="text-[11px] text-purple-200/80 mt-1 font-mono">
                              {selectedCorridor.railLabel} · ~{selectedCorridor.railDuration}h
                            </p>
                            <p className="text-[10px] text-purple-300/40 mt-0.5">
                              ↗ Gain estimé : {((selectedCorridor.duration + (borderWait ?? 0)) - selectedCorridor.railDuration).toFixed(0)}h sur la fenêtre de livraison
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Magic Fill */}
                    <motion.button
                      type="button"
                      onClick={handleMagicFill}
                      disabled={isMagicFilling}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mb-5 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#34d399]/25 text-[#34d399] text-sm font-medium transition-all hover:bg-[#34d399]/8 disabled:opacity-50"
                    >
                      {isMagicFilling ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#34d399]/30 border-t-[#34d399] rounded-full animate-spin" />
                          <span>Récupération données camion…</span>
                        </>
                      ) : (
                        <>
                          <Zap size={14} aria-hidden="true" />
                          <span>1-Click Magic Fill — Auto-remplir</span>
                        </>
                      )}
                    </motion.button>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Corridor */}
                      <div>
                        <label className={labelCls}>Corridor CEDEAO</label>
                        <select value={form.corridorId} onChange={set("corridorId")} className={inputCls} required>
                          {CORRIDORS.map((c) => (
                            <option key={c.id} value={c.id}>{c.id} — {c.label} ({c.distance})</option>
                          ))}
                        </select>
                      </div>

                      {/* Truck info */}
                      <p className="text-[10px] uppercase tracking-widest text-[#34d399]/60 pb-1 border-b border-white/5">
                        Identification du véhicule
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>N° Châssis</label>
                          <input value={form.chassis} onChange={set("chassis")} className={inputCls} placeholder="TRK-CI-XXXX" required />
                        </div>
                        <div>
                          <label className={labelCls}>Plaque d'immatriculation</label>
                          <input value={form.plate} onChange={set("plate")} className={inputCls} placeholder="AB-0000-CI" required />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Chauffeur</label>
                        <input value={form.driver} onChange={set("driver")} className={inputCls} placeholder="Nom et prénom" required />
                      </div>

                      {/* Cargo */}
                      <p className="text-[10px] uppercase tracking-widest text-[#34d399]/60 pb-1 border-b border-white/5 pt-1">
                        Cargaison
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Description</label>
                          <input value={form.load} onChange={set("load")} className={inputCls} placeholder="Nature marchandises" required />
                        </div>
                        <div>
                          <label className={labelCls}>Poids (tonnes)</label>
                          <input type="number" value={form.weight} onChange={set("weight")} className={inputCls} placeholder="0" required />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Heure de départ prévue</label>
                        <input type="time" value={form.departureTime} onChange={set("departureTime")} className={inputCls} required />
                      </div>

                      {/* Document checklist */}
                      <p className="text-[10px] uppercase tracking-widest text-[#34d399]/60 pb-1 border-b border-white/5 pt-1">
                        Documents de transit
                      </p>
                      <div className="space-y-2">
                        {DOCS.map((doc) => {
                          const isDone = docsState[doc.id];
                          return (
                            <motion.div
                              key={doc.id}
                              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg"
                              style={{
                                background: isDone ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.02)",
                                border: `1px solid ${isDone ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.06)"}`,
                                transition: "all 0.4s ease",
                              }}
                            >
                              <motion.div
                                animate={{
                                  scale: isDone ? [1.3, 1] : 1,
                                  rotate: isDone ? [15, 0] : 0,
                                }}
                                transition={{ duration: 0.35, ease: "backOut" }}
                              >
                                {isDone ? (
                                  <CheckCircle size={15} className="text-[#34d399]" aria-hidden="true" />
                                ) : (
                                  <div className="w-[15px] h-[15px] rounded-full border border-white/15" />
                                )}
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium ${isDone ? "text-[#34d399]" : "text-white/40"}`}
                                   style={{ transition: "color 0.35s ease" }}>
                                  {doc.label}
                                </p>
                                <p className="text-[10px] text-white/20">{doc.desc}</p>
                              </div>
                              {isDone && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                                  style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}
                                >
                                  OK
                                </motion.span>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>

                      {!allDocsDone && (
                        <p className="text-[10px] text-white/25 text-center">
                          Utilisez Magic Fill pour générer automatiquement les documents
                        </p>
                      )}

                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full mt-2 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                        style={{
                          background: "linear-gradient(135deg, #34d399, #10b981)",
                          color: "#000",
                          boxShadow: "0 0 20px rgba(52,211,153,0.25)",
                        }}
                      >
                        <Send size={15} aria-hidden="true" />
                        Activer le Transit CEDEAO
                      </motion.button>
                    </form>
                  </motion.div>
                )}

                {/* ── STEP: PROCESSING ────────────────────────────── */}
                {step === "processing" && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-6 py-10"
                  >
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-2 border-[#34d399]/20 border-t-[#34d399] animate-spin" />
                      <div className="absolute inset-[6px] rounded-full border border-[#34d399]/10 border-t-[#34d399]/40 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Navigation size={18} className="text-[#34d399]" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white mb-1">Activation du transit…</p>
                      <p className="text-xs text-white/30">Synchronisation DGD · CEDEAO · Système GPS</p>
                    </div>
                    <div className="w-full space-y-2.5">
                      {[
                        { label: "Validation documents CEDEAO", delay: 0.2 },
                        { label: "Transmission douane de départ — ABJ", delay: 0.6 },
                        { label: "Activation balise GPS — Corridor", delay: 1.0 },
                        { label: "Pré-notification frontière", delay: 1.5 },
                        { label: "Geofencing activé — 4 zones", delay: 2.0 },
                      ].map((item) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: item.delay }}
                          className="flex items-center gap-3"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: item.delay + 0.2 }}
                            className="w-4 h-4 rounded-full bg-[#34d399]/15 border border-[#34d399]/40 flex items-center justify-center shrink-0"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                          </motion.div>
                          <span className="text-xs text-white/55">{item.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP: ACTIVE (Geofencing live) ──────────────── */}
                {step === "active" && (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {/* Status bar */}
                    <div className="flex items-center justify-between rounded-xl px-4 py-3"
                         style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
                        <span className="text-xs text-[#34d399] font-semibold">Transit Actif</span>
                      </div>
                      <span className="text-[10px] text-[#34d399]/60 font-mono">{dossierNum}</span>
                    </div>

                    {/* Convoy info */}
                    <div className="glass rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Corridor", value: selectedCorridor.label },
                          { label: "Châssis", value: form.chassis || "TRK-CI-8821" },
                          { label: "Chauffeur", value: form.driver || "Kouadio Jérôme" },
                          { label: "Distance", value: selectedCorridor.distance },
                        ].map((item) => (
                          <div key={item.label}>
                            <p className="text-[9px] uppercase tracking-widest text-white/25 mb-0.5">{item.label}</p>
                            <p className="text-xs text-white/65 font-medium">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Corridor map */}
                    <CorridorMap corridorId={form.corridorId} borderWait={borderWait} />

                    {/* Border wait alert if vigilance */}
                    {isVigOrange && (
                      <div className="rounded-xl px-4 py-3 flex items-center gap-2.5"
                           style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                        <AlertTriangle size={14} className="text-amber-400 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="text-xs text-amber-300 font-semibold">Vigilance Orange — {selectedCorridor.border}</p>
                          <p className="text-[11px] text-amber-300/60">
                            Attente estimée {borderWait?.toFixed(1)}h · Dépasse seuil 6h
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Intermodal bridge active */}
                    {showIntermodal && (
                      <div className="rounded-xl px-4 py-3"
                           style={{ background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.2)" }}>
                        <div className="flex items-start gap-2">
                          <Train size={13} className="text-purple-400 mt-0.5 shrink-0" aria-hidden="true" />
                          <div>
                            <p className="text-xs text-purple-300 font-semibold">Victor — Alternative Rail suggérée</p>
                            <p className="text-[11px] text-purple-300/55 mt-0.5">
                              {selectedCorridor.railLabel} · Gain estimé {((selectedCorridor.duration + (borderWait ?? 0)) - selectedCorridor.railDuration).toFixed(0)}h
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Geofencing timeline */}
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin size={12} className="text-[#34d399]" aria-hidden="true" />
                        <p className="text-[10px] uppercase tracking-widest text-white/30">
                          Geofencing — Suivi en temps réel
                        </p>
                      </div>
                      <div className="space-y-3">
                        {geoEvents.map((ev, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.12 }}
                            className="flex items-start gap-3"
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${
                              ev.done
                                ? "bg-[#34d399]/15 border border-[#34d399]/40"
                                : "border border-white/10"
                            }`}>
                              {ev.done && (
                                <motion.div
                                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ background: ev.color }}
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`text-xs ${ev.done ? "text-white/70" : "text-white/20"}`}
                                   style={{ transition: "color 0.3s" }}>{ev.label}</p>
                                {i === activeGeoIdx && (
                                  <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                    className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                                    style={{ background: `${ev.color}20`, color: ev.color }}
                                  >
                                    live
                                  </motion.span>
                                )}
                              </div>
                              <p className="text-[10px] text-white/25 mt-0.5">{ev.sub}</p>
                              <p className="text-[9px] text-white/15 font-mono mt-0.5">{ev.time}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Document checklist (final) */}
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield size={12} className="text-[#34d399]" aria-hidden="true" />
                        <p className="text-[10px] uppercase tracking-widest text-white/30">Documents validés</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {DOCS.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-1.5">
                            <CheckCircle size={11} className="text-[#34d399] shrink-0" aria-hidden="true" />
                            <span className="text-[11px] text-white/50">{doc.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full py-2.5 rounded-xl border border-white/10 text-sm text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
                    >
                      {t("close")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
