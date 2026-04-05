"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Clock, ChevronLeft, ChevronRight, AlertTriangle, Truck, MapPin, Package, User, Navigation, FileText, Search } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";
import type { DeckConfig } from "@/components/deck/DeckLayout";
import { useRoadData } from "@/hooks/useRoadData";
import type { Truck as TruckType, Checkpoint } from "@/hooks/useRoadData";
import { generateCMR, generateBSC, generateTRIE } from "@/lib/pdf-service";

const CHECKPOINT_TYPE_LABELS: Record<Checkpoint["type"], string> = {
  border:   "FRONTIÈRE",
  weighing: "PESAGE",
  customs:  "DOUANE",
  toll:     "PÉAGE",
};

const CHECKPOINT_STATUS: Record<Checkpoint["status"], { bg: string; border: string; text: string; label: string }> = {
  open:   { bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.25)", text: "#10B981", label: "Ouvert" },
  slow:   { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)", text: "#F59E0B", label: "Lent" },
  closed: { bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.25)",  text: "#EF4444", label: "Fermé" },
};

const TRUCK_STATUS_COLORS: Record<TruckType["status"], string> = {
  active:     "#10B981",
  delayed:    "#EF4444",
  stopped:    "#F59E0B",
  checkpoint: "#F59E0B",
};

function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function formatDelay(min: number): string {
  return min > 0 ? `+${formatMinutes(min)}` : "";
}

// ─── Panneau Checkpoints ───────────────────────────────────────────────────────
function CheckpointPanel({ checkpoints, trucks, open, onToggle }: {
  checkpoints: Checkpoint[];
  trucks: TruckType[];
  open: boolean;
  onToggle: () => void;
}) {
  const totalWait = checkpoints
    .filter((c) => c.status === "slow" || c.status === "closed")
    .reduce((acc, c) => acc + c.waitTime, 0);

  return (
    <div className="relative flex shrink-0" style={{ zIndex: 20 }}>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="h-full overflow-hidden"
            style={{ background: "rgba(6,14,26,0.96)", borderRight: "1px solid rgba(52,211,153,0.12)", backdropFilter: "blur(16px)" }}
          >
            <div className="w-64 h-full flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(52,211,153,0.10)" }}>
<<<<<<< HEAD
                <Shield className="h-4 w-4 shrink-0" style={{ color: "#34d399" }} />
=======
                <Shield className="h-4 w-4 shrink-0" style={{ color: "#4ade80" }} />
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
                <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">Postes & Frontières</span>
              </div>

              {totalWait > 120 && (
                <div className="mx-3 mt-2 px-3 py-2 rounded-lg flex items-start gap-2"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)" }}>
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-red-400 leading-snug">Temps perdu total : <strong>{formatMinutes(totalWait)}</strong> sur les axes actifs</p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto mt-1">
                {checkpoints.map((cp) => {
                  const sc = CHECKPOINT_STATUS[cp.status];
                  const retainedTrucks = trucks.filter(
                    (t) => Math.abs(t.lat - cp.lat) < 0.05 && Math.abs(t.lng - cp.lng) < 0.05
                  );
                  return (
                    <div key={cp.id} className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-[13px] font-semibold text-white/85 leading-tight">{cp.name}</p>
                          <span className="text-[10px] font-bold tracking-wider text-white/35 uppercase">
                            {CHECKPOINT_TYPE_LABELS[cp.type]}
                          </span>
                        </div>
                        <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
                          {sc.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Clock className="h-3 w-3 text-white/30" />
                        <span className="text-[11px] text-white/55">
                          Attente ~<span className="text-white/80 font-semibold">{formatMinutes(cp.waitTime)}</span>
                        </span>
                      </div>
                      {retainedTrucks.length > 0 && (
                        <div className="mt-1.5 space-y-1">
                          {retainedTrucks.map((t) => (
                            <div key={t.id} className="flex items-center gap-1.5 px-2 py-1 rounded"
                              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
                              <Truck className="h-3 w-3 text-red-400 shrink-0" />
                              <span className="text-[10px] text-red-400 font-medium">{t.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={onToggle}
        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-10 rounded-r-lg hover:bg-white/10 transition-all"
        style={{ right: "-20px", background: "rgba(6,14,26,0.90)", border: "1px solid rgba(52,211,153,0.18)", borderLeft: "none", color: "rgba(52,211,153,0.7)" }}
        title={open ? "Masquer" : "Postes & Frontières"}
      >
        {open ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
    </div>
  );
}

// ─── Détail Camion ─────────────────────────────────────────────────────────────
function TruckDetail({ truck, onClose }: { truck: TruckType; onClose: () => void }) {
  const col = TRUCK_STATUS_COLORS[truck.status];
  const label = truck.status === "active" ? "En route" : truck.status === "delayed" ? "En retard" : truck.status === "checkpoint" ? "Checkpoint" : "Arrêté";

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2 }}
      className="absolute right-4 top-16 z-30 w-72 rounded-xl shadow-2xl overflow-hidden"
      style={{ background: "rgba(6,14,26,0.97)", border: "1px solid rgba(52,211,153,0.22)", backdropFilter: "blur(16px)" }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(52,211,153,0.10)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.22)" }}>
<<<<<<< HEAD
            <Truck className="h-4 w-4" style={{ color: "#34d399" }} />
=======
            <Truck className="h-4 w-4" style={{ color: "#4ade80" }} />
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
          </div>
          <div>
            <p className="text-sm font-bold text-white/90">{truck.name}</p>
            <p className="text-[10px] font-mono text-white/40">{truck.plate}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">✕</button>
      </div>
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: col, boxShadow: `0 0 5px ${col}` }} />
          <span className="text-[12px] font-semibold" style={{ color: col }}>{label}</span>
          {truck.delay > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-red-400 ml-auto">
              <AlertTriangle className="h-3 w-3" />{formatDelay(truck.delay)}
            </span>
          )}
        </div>
        {truck.delay > 0 && (
          <div className="px-3 py-2 rounded-lg flex items-center gap-2"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <p className="text-[11px] text-red-400">Retard en cours : {formatDelay(truck.delay)}</p>
          </div>
        )}
        <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
              <p className="text-[11px] text-white/60">Départ · <span className="text-white/80 font-medium">{truck.origin}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="h-3 w-3 text-white/30 shrink-0" />
              <p className="text-[11px] text-white/60">Arrivée · <span className="text-white/80 font-medium">{truck.destination}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-white/30 shrink-0" />
              <p className="text-[11px] text-white/60">ETA · <span className="text-white/80 font-medium">{truck.eta}</span></p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-1.5 mb-1"><Package className="h-3 w-3 text-white/30" /><span className="text-[10px] text-white/40 uppercase">Cargo</span></div>
            <p className="text-[11px] font-semibold text-white/75">{truck.cargo}</p>
          </div>
          <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-1.5 mb-1"><User className="h-3 w-3 text-white/30" /><span className="text-[10px] text-white/40 uppercase">Conducteur</span></div>
            <p className="text-[11px] font-semibold text-white/75">{truck.driver}</p>
          </div>
        </div>
        <p className="text-[10px] text-white/25 text-right font-mono">Mis à jour {truck.lastUpdate}</p>
        {/* Boutons PDF */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => generateCMR({
              cmrNumber: `CMR-ABJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
              plate: truck.plate,
              driver: truck.driver,
              origin: truck.origin,
              destination: truck.destination,
              cargo: truck.cargo,
              eta: truck.eta,
              delay: truck.delay,
            })}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-semibold transition-all hover:opacity-80"
<<<<<<< HEAD
            style={{ border: "1px solid rgba(52,211,153,0.35)", color: "#34d399", background: "rgba(52,211,153,0.07)" }}
=======
            style={{ border: "1px solid rgba(52,211,153,0.35)", color: "#4ade80", background: "rgba(52,211,153,0.07)" }}
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
          >
            <FileText className="h-3 w-3" /> CMR
          </button>
          <button
            onClick={() => generateBSC({
              bscNumber: `BSC-ABJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
              expediteur: "NEXIM Trading Abidjan",
              destinataire: "STS " + truck.destination,
              marchandise: truck.cargo,
              poidsNet: 18500,
              poidsBrut: 20000,
              valeurCFA: 12500000,
              transporteur: truck.driver,
              dateEmission: new Date().toLocaleDateString("fr-FR"),
            })}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-semibold transition-all hover:opacity-80"
<<<<<<< HEAD
            style={{ border: "1px solid rgba(212,175,55,0.35)", color: "#D4AF37", background: "rgba(212,175,55,0.07)" }}
=======
            style={{ border: "1px solid rgba(212,175,55,0.35)", color: "#F59E0B", background: "rgba(212,175,55,0.07)" }}
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
          >
            <FileText className="h-3 w-3" /> BSC
          </button>
          <button
            onClick={() => generateTRIE({
              trieNumber: `TRIE-CI-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
              plate: truck.plate,
              driver: truck.driver,
              transporteur: "ORION Logistics CI",
              paysEmission: "Côte d'Ivoire",
              paysTransit: truck.destination.includes("Ouagadougou") || truck.destination.includes("BF")
                ? ["Côte d'Ivoire", "Burkina Faso"]
                : truck.destination.includes("Bamako") || truck.destination.includes("Mali")
                  ? ["Côte d'Ivoire", "Burkina Faso", "Mali"]
                  : ["Côte d'Ivoire"],
              paysDestination: truck.destination,
              pointEntree: "Poste de Noé / Abidjan",
              pointSortie: truck.destination.includes("Ouagadougou") ? "Poste de Ouangolodougou" : "Poste de Pogo",
              cargo: truck.cargo,
              poidsNet: 18500,
              valeurCFA: 12500000,
              asycudaRef: `ASYCUDA-CI-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`,
              cautionMontant: 2500000,
              dateEmission: new Date().toLocaleDateString("fr-FR"),
              dateExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR"),
            })}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-semibold transition-all hover:opacity-80"
            style={{ border: "1px solid rgba(0,132,61,0.35)", color: "#00843D", background: "rgba(0,132,61,0.07)" }}
          >
            <FileText className="h-3 w-3" /> TRIE
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Tracking public ───────────────────────────────────────────────────────────
const TRACKING_CITIES = ["Abidjan", "Yamoussoukro", "Bouaké", "Ferkéssédougou", "Ouagadougou"];

function PublicTrackingWidget() {
  const [ref, setRef] = useState("");
  const [result, setResult] = useState<null | { found: boolean; city?: string; eta?: string; status?: string }>(null);

  const handleSearch = () => {
    if (!ref.trim()) return;
    if (ref.toUpperCase().startsWith("ORN")) {
      const cityIdx = ref.length % TRACKING_CITIES.length;
      setResult({
        found: true,
        city: TRACKING_CITIES[cityIdx],
        eta: new Date(Date.now() + (cityIdx + 1) * 3_600_000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        status: cityIdx > 2 ? "En retard" : "En transit",
      });
    } else {
      setResult({ found: false });
    }
  };

  return (
    <div
      className="absolute top-4 right-4 z-20 rounded-xl shadow-2xl overflow-hidden"
      style={{ background: "rgba(6,14,26,0.92)", border: "1px solid rgba(52,211,153,0.18)", backdropFilter: "blur(12px)", width: 230 }}
    >
      <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(52,211,153,0.08)" }}>
<<<<<<< HEAD
        <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "#34d399" }} />
=======
        <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "#4ade80" }} />
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
        <span className="text-[10px] font-bold tracking-widest text-white/60 uppercase">Suivi Public</span>
      </div>
      <div className="px-3 pt-2 pb-3">
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="ORN-ROAD-2026-..."
            value={ref}
            onChange={e => setRef(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="flex-1 px-2 py-1 rounded text-[10px] font-mono outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(52,211,153,0.15)", color: "rgba(255,255,255,0.75)" }}
          />
          <button
            onClick={handleSearch}
            className="px-2 py-1 rounded text-[10px] font-semibold transition-all hover:opacity-80"
<<<<<<< HEAD
            style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399" }}
=======
            style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", color: "#4ade80" }}
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
          >
            OK
          </button>
        </div>
        {result && (
          <div className="mt-2 px-2 py-2 rounded-lg" style={{ background: result.found ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.06)", border: `1px solid ${result.found ? "rgba(16,185,129,0.20)" : "rgba(239,68,68,0.18)"}` }}>
            {result.found ? (
              <>
                <p className="text-[11px] font-semibold" style={{ color: result.status === "En retard" ? "#EF4444" : "#10B981" }}>
                  {result.status}
                </p>
                <p className="text-[10px] text-white/55 mt-0.5">Près de <span className="text-white/80">{result.city}</span></p>
                <p className="text-[10px] text-white/55">ETA estimé <span className="text-white/80 font-mono">{result.eta}</span></p>
              </>
            ) : (
              <p className="text-[10px] text-red-400">Référence non trouvée</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function RoadDeck() {
  const { trucks, checkpoints, kpi, loading, isLive, refetch } = useRoadData();
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedTruck, setSelectedTruck] = useState<TruckType | null>(null);

  const frontierWaitMin = useMemo(
    () => checkpoints.filter((c) => c.status === "slow" || c.status === "closed").reduce((a, c) => a + c.waitTime, 0),
    [checkpoints]
  );

  const deckConfig: DeckConfig = {
    type: "road",
    name: "ROAD DECK",
<<<<<<< HEAD
    color: "#34d399",
    forecastLabel: "Réseau CEDEAO · 4h",
    kpis: trucks.length > 0
      ? [
          { label: "Camions Actifs",    value: kpi.activeTrucks,           color: "#34d399" },
=======
    color: "#4ade80",
    forecastLabel: "Réseau CEDEAO · 4h",
    kpis: trucks.length > 0
      ? [
          { label: "Camions Actifs",    value: kpi.activeTrucks,           color: "#4ade80" },
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
          { label: "À l'heure",         value: kpi.onTime,                  color: "#10B981" },
          { label: "En Retard",         value: kpi.delayed,                 color: "#EF4444" },
          { label: "Délai Moyen",       value: kpi.avgDelay,                color: "#F59E0B" },
          { label: "Attente Frontières", value: frontierWaitMin > 0 ? formatMinutes(frontierWaitMin) : "—",
<<<<<<< HEAD
            color: frontierWaitMin > 120 ? "#EF4444" : "#34d399" },
        ]
      : [
          { label: "Camions Actifs",    value: 284,    color: "#34d399" },
          { label: "Livraisons / mois", value: "1 247", color: "#34d399" },
          { label: "Pays CEDEAO",       value: 5,       color: "#34d399" },
          { label: "Ponctualité",        value: "94%",  color: "#34d399" },
=======
            color: frontierWaitMin > 120 ? "#EF4444" : "#4ade80" },
        ]
      : [
          { label: "Camions Actifs",    value: 284,    color: "#4ade80" },
          { label: "Livraisons / mois", value: "1 247", color: "#4ade80" },
          { label: "Pays CEDEAO",       value: 5,       color: "#4ade80" },
          { label: "Ponctualité",        value: "94%",  color: "#4ade80" },
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
        ],
    assets: trucks.length > 0
      ? trucks.map((t) => ({
          id: t.id,
          name: t.name,
          lat: t.lat,
          lng: t.lng,
          status: (t.status === "active" ? "active" : t.status === "delayed" ? "delayed" : "stopped") as "active" | "delayed" | "stopped",
          info: [t.speed > 0 ? `${t.speed} km/h` : "À l'arrêt", `${t.origin} → ${t.destination}`, t.delay > 0 ? formatDelay(t.delay) : null].filter(Boolean).join(" · "),
        }))
      : [
          { id: "TRK-001", name: "Convoi CI-GH-0845",   lat: 5.35,  lng: -3.50,  status: "active"  as const, info: "88 km/h · ABJ → Accra via Elubo" },
          { id: "TRK-002", name: "Camion TRK-217",      lat: 7.68,  lng: -5.03,  status: "active"  as const, info: "72 km/h · Bouaké → Ouagadougou" },
          { id: "TRK-003", name: "Convoi DKR-ABJ",      lat: 11.86, lng: -15.55, status: "delayed" as const, info: "Arrêté frontière Guinée · Retard +5h" },
          { id: "TRK-004", name: "Camion RN1-054",      lat: 6.82,  lng: -4.35,  status: "active"  as const, info: "68 km/h · Yamoussoukro → Bouaké" },
          { id: "TRK-005", name: "Convoi CEDEAO-008",   lat: 9.54,  lng: -13.68, status: "active"  as const, info: "62 km/h · Conakry → Dakar" },
          { id: "TRK-006", name: "Camion GH-CI-112",    lat: 5.10,  lng: -3.20,  status: "stopped" as const, info: "En pause — poste frontière Noé" },
        ],
  };

  const delayedTrucks = trucks.filter((t) => t.status === "delayed");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#030712" }}>
      <CheckpointPanel checkpoints={checkpoints} trucks={trucks} open={panelOpen} onToggle={() => setPanelOpen((v) => !v)} />
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence>
          {selectedTruck && <TruckDetail truck={selectedTruck} onClose={() => setSelectedTruck(null)} />}
        </AnimatePresence>
        {isLive && (
          <div className="absolute top-16 left-4 z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.20)", color: "#10B981" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            API LIVE
            <button onClick={refetch} className="ml-1 opacity-60 hover:opacity-100 transition-opacity" title="Rafraîchir">↻</button>
          </div>
        )}
        {delayedTrucks.length > 0 && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(6,14,26,0.92)", border: "1px solid rgba(239,68,68,0.25)", backdropFilter: "blur(12px)" }}>
            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <span className="text-[11px] text-red-400 font-semibold mr-1">Retards :</span>
            {delayedTrucks.map((t) => (
              <button key={t.id}
                onClick={() => setSelectedTruck((prev) => prev?.id === t.id ? null : t)}
                className="text-[10px] font-mono px-2 py-0.5 rounded transition-all hover:bg-red-500/20"
                style={{
                  background: selectedTruck?.id === t.id ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#EF4444",
                }}>
                {t.plate}
              </button>
            ))}
          </div>
        )}
        <PublicTrackingWidget />
        <DeckLayout config={deckConfig} isLoading={loading} />
      </div>
    </div>
  );
}
