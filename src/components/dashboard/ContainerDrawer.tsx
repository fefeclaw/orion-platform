"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Package, AlertTriangle, Leaf } from "lucide-react";
import ShipTimeline from "./ShipTimeline";
import { useTranslation } from "@/hooks/useTranslation";

interface ContainerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock container database
const MOCK_CONTAINERS: Record<string, ContainerData> = {
  "ORION-4821": {
    id: "ORION-4821", ship: "MSC Abidjan", origin: "Rotterdam (NL)",
    destination: "Port Autonome d'Abidjan", status: "at_sea",
    progress: 72, eta: "2026-03-18 14:00", delay: 0,
    cargo: "Équipements industriels", weight: "24.5T", teu: 2,
    lastSignal: "5.3°N — 8.2°W · Golfe de Guinée",
    events: [
      { time: "12 Mar 08:00", label: "Chargement finalisé — Rotterdam", done: true },
      { time: "13 Mar 06:00", label: "Départ Rotterdam · Cap Abidjan", done: true },
      { time: "16 Mar 11:32", label: "Signal AIS — Golfe de Guinée · Position actuelle", done: true },
      { time: "18 Mar 14:00", label: "Arrivée estimée — Port Autonome d'Abidjan", done: false },
      { time: "19 Mar 08:00", label: "Déchargement prévu — Terminal à conteneurs", done: false },
    ],
  },
  "ORION-1337": {
    id: "ORION-1337", ship: "CMA CGM Africa One", origin: "Shanghai (CN)",
    destination: "Port Autonome d'Abidjan", status: "delayed",
    progress: 45, eta: "2026-03-20 +14h", delay: 14,
    cargo: "Cacao brut — Export CEDEAO", weight: "38.2T", teu: 3,
    lastSignal: "12.1°N — 15.4°W · Atlantique Est",
    nadiaBadge: true,
    delayReason: "Encombrement port de transit — Dakar",
    events: [
      { time: "08 Mar 14:00", label: "Chargement finalisé — Shanghai", done: true },
      { time: "10 Mar 09:00", label: "Départ Shanghai · Route Atlantique", done: true },
      { time: "15 Mar 17:00", label: "⚠️ Anomalie — Déviation Dakar +14h", done: true },
      { time: "20 Mar 06:00", label: "Arrivée révisée — Port Abidjan (retard intégré)", done: false },
      { time: "21 Mar 10:00", label: "Déchargement prioritaire — Protocole Nadia activé", done: false },
    ],
  },
  "ORION-9002": {
    id: "ORION-9002", ship: "Maersk Dakar", origin: "Le Havre (FR)",
    destination: "Port Autonome d'Abidjan", status: "approaching",
    progress: 91, eta: "2026-03-17 06:30", delay: 0,
    cargo: "Matériel médical", weight: "8.7T", teu: 1,
    lastSignal: "4.8°N — 3.1°W · Approche Abidjan",
    events: [
      { time: "10 Mar 10:00", label: "Départ Le Havre", done: true },
      { time: "15 Mar 18:00", label: "Passage Cap-Vert", done: true },
      { time: "16 Mar 22:00", label: "Approche Abidjan — Pilote demandé", done: true },
      { time: "17 Mar 06:30", label: "Accostage prévu — Quai 4 Port Autonome", done: false },
    ],
  },
};

type ContainerData = {
  id: string; ship: string; origin: string; destination: string;
  status: "loading" | "at_sea" | "approaching" | "arrived" | "delayed";
  progress: number; eta: string; delay: number;
  cargo: string; weight: string; teu: number;
  lastSignal: string; nadiaBadge?: boolean;
  delayReason?: string;
  events: { time: string; label: string; done: boolean }[];
};

const CARGO_HINTS = ["ORION-4821", "ORION-1337", "ORION-9002"];

// ─── Radar Map ───────────────────────────────────────────────────
function RadarMap({ progress, status }: { progress: number; status: string }) {
  const color = status === "delayed" ? "#f59e0b" : status === "approaching" ? "#D4AF37" : "#38bdf8";
  const shipX = 50 + Math.cos((progress / 100) * Math.PI) * -35;
  const shipY = 80 - Math.sin((progress / 100) * Math.PI) * 40;

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ background: "#020a14", height: 120 }}>
      <svg viewBox="0 0 200 120" className="w-full h-full">
        {[30, 60, 90, 120, 150, 180].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="120" stroke="#0a1f35" strokeWidth="0.5" />
        ))}
        {[20, 40, 60, 80, 100].map((y) => (
          <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#0a1f35" strokeWidth="0.5" />
        ))}
        <path d="M 20 80 Q 100 20 180 80" fill="none" stroke={`${color}25`} strokeWidth="1" strokeDasharray="3 3" />
        <motion.path
          d="M 20 80 Q 100 20 180 80"
          fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.7"
          initial={{ pathLength: 0 }} animate={{ pathLength: progress / 100 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <circle cx="20" cy="80" r="3" fill={color} opacity="0.8" />
        <text x="20" y="95" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="6">Origine</text>
        <circle cx="180" cy="80" r="3" fill={progress >= 90 ? color : "rgba(255,255,255,0.15)"} />
        <text x="180" y="95" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="6">Abidjan</text>
        <circle cx={shipX} cy={shipY} r="4" fill={color} filter="url(#rglow)" />
        <circle cx={shipX} cy={shipY} r="4" fill="none" stroke={color} strokeWidth="1">
          <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
        </circle>
        {status === "delayed" && (
          <g>
            <text x={shipX} y={shipY - 10} textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="700">⚠</text>
            <motion.circle
              cx={shipX} cy={shipY} r="12"
              fill="none" stroke="#f59e0b" strokeWidth="0.5" strokeOpacity="0.4"
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </g>
        )}
        <defs>
          <filter id="rglow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

export default function ContainerDrawer({ isOpen, onClose }: ContainerDrawerProps) {
  const [query, setQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ContainerData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslation();

  const buildDelayNotification = (data: ContainerData): string => {
    if (data.delay === 0) return "";
    const isCacao = data.cargo.toLowerCase().includes("cacao");
    return [
      `⚠️ Anomalie détectée — ${data.delayReason ?? "Déviation de trajectoire"}`,
      `Impact estimé : +${data.delay}h sur déchargement à Abidjan`,
      `Intégrité cargaison : ${isCacao ? "Protocole conservation activé" : "Surveillance standard"}`,
      isCacao ? `Action : Nadia a transmis les protocoles de conservation au bord` : `Action : Optimisation du slot de déchargement en cours`,
      `Statut : Vigilance — Transparence prédictive activée`,
    ].join("\n");
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsScanning(true);
    setResult(null);
    setNotFound(false);
    await new Promise((r) => setTimeout(r, 2000));
    const data = MOCK_CONTAINERS[query.trim().toUpperCase()];
    setIsScanning(false);
    if (data) setResult(data);
    else setNotFound(true);
  };

  const handleClose = () => {
    setQuery(""); setResult(null); setNotFound(false); setIsScanning(false);
    onClose();
  };

  const statusColor = (s: string) =>
    ({ at_sea: "#38bdf8", approaching: "#D4AF37", arrived: "#34d399", delayed: "#f59e0b", loading: "#f87171" }[s] ?? "#38bdf8");

  const statusLabel = (s: string) => {
    const map: Record<string, ReturnType<typeof t>> = {
      at_sea: t("container_status_sea"),
      approaching: t("container_status_approach"),
      arrived: t("container_status_arrived"),
      delayed: t("container_status_delayed"),
    };
    return map[s] ?? s;
  };

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
              background: "linear-gradient(135deg, rgba(8,16,32,0.92), rgba(4,10,20,0.96)) padding-box, linear-gradient(135deg, rgba(56,189,248,0.15), rgba(56,189,248,0.04)) border-box",
              border: "1px solid transparent",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#38bdf8]/10">
                  <Package size={15} className="text-[#38bdf8]" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t("container_title")}</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
                    {t("container_subtitle")}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="text-white/20 hover:text-white/60 transition-colors">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-5 border-b border-white/5">
              <div className="relative">
                {isScanning && (
                  <motion.div
                    className="absolute left-0 right-0 h-[1.5px] z-10 rounded-full"
                    style={{ background: "linear-gradient(90deg, transparent, #38bdf8, transparent)", boxShadow: "0 0 8px #38bdf8" }}
                    initial={{ top: 0, opacity: 1 }}
                    animate={{ top: "100%", opacity: [1, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full bg-[#060d1a]/80 border border-white/8 rounded-xl px-4 py-3 pr-12 text-sm text-white font-mono focus:outline-none focus:border-[#38bdf8]/50 transition-colors placeholder:text-white/20"
                  placeholder={t("container_placeholder")}
                  disabled={isScanning}
                />
                <button
                  onClick={handleSearch}
                  disabled={isScanning}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#38bdf8]/60 hover:text-[#38bdf8] transition-colors disabled:opacity-30"
                >
                  <Search size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="flex gap-2 mt-2.5">
                {CARGO_HINTS.map((hint) => (
                  <button
                    key={hint}
                    onClick={() => setQuery(hint)}
                    className="text-[10px] px-2 py-0.5 rounded border border-white/8 text-white/25 hover:text-white/50 hover:border-white/20 transition-all font-mono"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait">
                {isScanning && (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 py-12"
                  >
                    <div className="w-10 h-10 border-2 border-[#38bdf8]/20 border-t-[#38bdf8] rounded-full animate-spin" />
                    <p className="text-xs text-white/30 uppercase tracking-widest">{t("container_scanning")}</p>
                    <p className="text-[10px] text-white/15">Interrogation base de données DGD · Port Autonome d&apos;Abidjan</p>
                  </motion.div>
                )}

                {notFound && !isScanning && (
                  <motion.div
                    key="notfound"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-3 py-12 text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-900/20 border border-red-500/20 flex items-center justify-center">
                      <X size={20} className="text-red-400" aria-hidden="true" />
                    </div>
                    <p className="text-sm text-white/60">{t("container_not_found")}</p>
                    <p className="text-xs text-white/25">{t("container_not_found_sub")}</p>
                  </motion.div>
                )}

                {result && !isScanning && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Identity bar */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-mono font-semibold text-white">{result.id}</p>
                        <p className="text-xs text-white/40 mt-0.5">{result.ship}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
                          style={{ color: statusColor(result.status), background: `${statusColor(result.status)}18`, border: `1px solid ${statusColor(result.status)}30` }}
                        >
                          {statusLabel(result.status)}
                        </span>
                        {result.nadiaBadge && (
                          <motion.span
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }}
                          >
                            <Leaf size={9} aria-hidden="true" />
                            {t("container_nadia")}
                          </motion.span>
                        )}
                      </div>
                    </div>

                    {/* Delay Protocol notification */}
                    {result.delay > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="rounded-xl p-4 border"
                        style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.25)" }}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
                          <pre className="text-[11px] text-amber-300/80 whitespace-pre-wrap font-mono leading-relaxed">
                            {buildDelayNotification(result)}
                          </pre>
                        </div>
                      </motion.div>
                    )}

                    {/* Radar map */}
                    <RadarMap progress={result.progress} status={result.status} />

                    {/* Ship pulse */}
                    <div className="glass rounded-xl p-4">
                      <ShipTimeline
                        departurePort={result.origin}
                        status={result.status}
                        progress={result.progress}
                      />
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: t("container_vessel"), value: result.ship },
                        { label: t("container_eta"), value: result.eta },
                        { label: t("container_cargo"), value: result.cargo },
                        { label: t("container_weight_teu"), value: `${result.weight} · ${result.teu} TEU` },
                        { label: t("container_signal"), value: result.lastSignal },
                        { label: t("container_progress"), value: `${result.progress}%` },
                      ].map((item) => (
                        <div key={item.label} className="glass rounded-lg p-3">
                          <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1">{item.label}</p>
                          <p className="text-xs text-white/70 font-medium">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Event timeline */}
                    <div className="glass rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-widest text-white/25 mb-3">{t("container_history")}</p>
                      <div className="space-y-2.5">
                        {result.events.map((ev, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className={`mt-0.5 w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${ev.done ? "bg-[#38bdf8]/15 border border-[#38bdf8]/40" : "border border-white/10"}`}>
                              {ev.done && <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />}
                            </div>
                            <div>
                              <p className={`text-xs ${ev.done ? "text-white/55" : "text-white/20"}`}>{ev.label}</p>
                              <p className="text-[9px] text-white/20 mt-0.5">{ev.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {!isScanning && !result && !notFound && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 py-12 text-center"
                  >
                    <Package size={32} className="text-white/10" aria-hidden="true" />
                    <p className="text-xs text-white/25">{t("container_empty")}</p>
                    <p className="text-[10px] text-white/15">{t("container_empty_sub")}</p>
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
