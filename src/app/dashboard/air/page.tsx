"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plane, Clock, Package, AlertTriangle, Navigation, FileText } from "lucide-react";
import { generateAWB, generateLTA } from "@/lib/pdf-service";
import { DeckLayout } from "@/components/deck/DeckLayout";
import type { DeckConfig } from "@/components/deck/DeckLayout";
import { useAirData } from "@/hooks/useAirData";
import type { Flight } from "@/hooks/useAirData";

// Heure simulée pour les tests : 18h45 → HF104 cutoff 19h30 = 45 min → ALERTE
const SIMULATED_HOUR = 18;
const SIMULATED_MINUTE = 45;

const FLIGHT_STATUS_COLORS: Record<Flight["status"], string> = {
  active:       "#10B981",
  delayed:      "#EF4444",
  ground_hold:  "#F59E0B",
  diverted:     "#EF4444",
  landed:       "#6B7280",
};

const FLIGHT_STATUS_LABELS: Record<Flight["status"], string> = {
  active:      "En vol",
  delayed:     "Retardé",
  ground_hold: "Ground Hold",
  diverted:    "Dérouté",
  landed:      "Posé",
};

function toDeckStatus(s: Flight["status"]): "active" | "delayed" | "stopped" {
  if (s === "active" || s === "landed") return "active";
  if (s === "delayed" || s === "ground_hold" || s === "diverted") return "delayed";
  return "stopped";
}

function minutesUntilCutoff(cutoffTime: string): number {
  const [hStr, mStr] = cutoffTime.split(":");
  const cutoffTotal = parseInt(hStr) * 60 + parseInt(mStr);
  const nowTotal = SIMULATED_HOUR * 60 + SIMULATED_MINUTE;
  return cutoffTotal - nowTotal;
}

// ─── Badge cutoff ──────────────────────────────────────────────────────────────
function CutoffBadge({ cutoffTime }: { cutoffTime: string }) {
  const mins = minutesUntilCutoff(cutoffTime);
  if (mins <= 0) return <span className="text-[10px] text-white/30 font-mono">Cutoff dépassé</span>;

  const urgent = mins < 60;
  const warning = mins < 120;
  const color = urgent ? "#EF4444" : warning ? "#F59E0B" : "#10B981";

  return (
    <div className="flex items-center gap-1.5">
      <Clock className="h-3 w-3 shrink-0" style={{ color }} />
      <span className={`text-[10px] font-semibold${urgent ? " animate-pulse" : ""}`} style={{ color }}>
        Cutoff {cutoffTime} {urgent ? `— ${mins}min` : warning ? `— ${Math.floor(mins / 60)}h${mins % 60 > 0 ? String(mins % 60).padStart(2, "0") : ""}` : ""}
      </span>
      {urgent && <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider">⚠ RISQUE MISS FLIGHT</span>}
    </div>
  );
}

// ─── Banner Miss Flight ────────────────────────────────────────────────────────
function MissFlightBanner({ flights, onDismiss }: { flights: Flight[]; onDismiss: (id: string) => void }) {
  const urgent = flights.filter(
    (f) => f.cutoffTime && minutesUntilCutoff(f.cutoffTime) > 0 && minutesUntilCutoff(f.cutoffTime) < 60
  );
  if (urgent.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col gap-1 p-3 pointer-events-none">
      <AnimatePresence>
        {urgent.map((f) => {
          const mins = minutesUntilCutoff(f.cutoffTime!);
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto mx-auto w-full max-w-2xl rounded-xl px-5 py-3 flex items-center gap-4"
              style={{
                background: "rgba(15,0,0,0.97)",
                border: "1px solid rgba(239,68,68,0.55)",
                boxShadow: "0 0 24px rgba(239,68,68,0.25)",
                backdropFilter: "blur(16px)",
              }}
            >
              <motion.div
                animate={{ rotate: [-8, 8, -8, 8, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-400 leading-tight">
                  RISQUE MISS FLIGHT — {f.flightNumber}
                </p>
                <p className="text-[11px] text-red-300/70 mt-0.5">
                  Cutoff fret dans <strong>{mins} min</strong> ({f.cutoffTime}). Action requise immédiatement.
                </p>
              </div>
              <button
                onClick={() => onDismiss(f.id)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all hover:bg-white/10"
                style={{ border: "1px solid rgba(239,68,68,0.35)", color: "rgba(239,68,68,0.85)" }}
              >
                Confirmer prise en charge
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ─── Panneau Vols ──────────────────────────────────────────────────────────────
function FlightsPanel({ flights, open, onToggle, dismissedIds }: {
  flights: Flight[];
  open: boolean;
  onToggle: () => void;
  dismissedIds: Set<string>;
}) {
  const sorted = [...flights].sort((a, b) => {
    try { return new Date(a.eta).getTime() - new Date(b.eta).getTime(); } catch { return 0; }
  });

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
            style={{ background: "rgba(6,14,26,0.96)", borderRight: "1px solid rgba(167,139,250,0.12)", backdropFilter: "blur(16px)" }}
          >
            <div className="w-64 h-full flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(167,139,250,0.10)" }}>
                <Plane className="h-4 w-4 shrink-0" style={{ color: "#a78bfa" }} />
                <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">Vols en cours</span>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ background: "rgba(167,139,250,0.10)", border: "1px solid rgba(167,139,250,0.20)", color: "#a78bfa" }}>
                  {flights.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {sorted.map((f) => {
                  const sc = FLIGHT_STATUS_COLORS[f.status];
                  const hasCutoffAlert = f.cutoffTime && minutesUntilCutoff(f.cutoffTime) < 60 && minutesUntilCutoff(f.cutoffTime) > 0 && !dismissedIds.has(f.id);
                  return (
                    <div key={f.id} className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sc }} />
                          <p className="text-[12px] font-bold text-white/85">{f.flightNumber}</p>
                        </div>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: `${sc}12`, border: `1px solid ${sc}28`, color: sc }}>
                          {FLIGHT_STATUS_LABELS[f.status]}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/45 mb-1">{f.airline}</p>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Navigation className="h-3 w-3 text-white/25" />
                        <span className="text-[11px] text-white/55">{f.origin} → {f.destination}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Clock className="h-3 w-3 text-white/25" />
                        <span className="text-[11px] text-white/55">ETA <span className="text-white/75">{f.eta}</span></span>
                      </div>
                      {f.cutoffTime && (
                        <div className={`mt-1.5 px-2 py-1.5 rounded-lg${hasCutoffAlert ? " animate-pulse" : ""}`}
                          style={{ background: hasCutoffAlert ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${hasCutoffAlert ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.06)"}` }}>
                          <CutoffBadge cutoffTime={f.cutoffTime} />
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
        style={{ right: "-20px", background: "rgba(6,14,26,0.90)", border: "1px solid rgba(167,139,250,0.18)", borderLeft: "none", color: "rgba(167,139,250,0.7)" }}
        title={open ? "Masquer" : "Vols en cours"}
      >
        {open ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
    </div>
  );
}

// ─── Détail Vol ────────────────────────────────────────────────────────────────
function FlightDetail({ flight, onClose }: { flight: Flight; onClose: () => void }) {
  const col = FLIGHT_STATUS_COLORS[flight.status];
  const hasCutoffAlert = flight.cutoffTime && minutesUntilCutoff(flight.cutoffTime) < 60 && minutesUntilCutoff(flight.cutoffTime) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2 }}
      className="absolute right-4 top-16 z-30 w-72 rounded-xl shadow-2xl overflow-hidden"
      style={{ background: "rgba(6,14,26,0.97)", border: `1px solid rgba(167,139,250,0.22)`, backdropFilter: "blur(16px)" }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(167,139,250,0.10)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(167,139,250,0.10)", border: "1px solid rgba(167,139,250,0.22)" }}>
            <Plane className="h-4 w-4" style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white/90">{flight.flightNumber}</p>
            <p className="text-[10px] text-white/40">{flight.airline} · {flight.type === "cargo" ? "Cargo" : flight.type === "combi" ? "Combi" : "Charter"}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">✕</button>
      </div>
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: col, boxShadow: `0 0 5px ${col}` }} />
          <span className="text-[12px] font-semibold" style={{ color: col }}>{FLIGHT_STATUS_LABELS[flight.status]}</span>
          {flight.delay > 0 && <span className="text-[11px] text-red-400 ml-auto">+{flight.delay} min</span>}
        </div>
        <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Navigation className="h-3 w-3 text-white/30 shrink-0" />
              <span className="text-[11px] text-white/60">{flight.origin} → {flight.destination}</span>
            </div>
            {flight.altitude > 0 && (
              <span className="text-[11px] text-white/40 ml-5">FL{Math.round(flight.altitude / 100)} · {flight.speed} kt · Cap {flight.heading}°</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-1.5 mb-1"><Clock className="h-3 w-3 text-white/30" /><span className="text-[10px] text-white/40 uppercase">ETA</span></div>
            <p className="text-[11px] font-semibold text-white/75">{flight.eta}</p>
          </div>
          <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-1.5 mb-1"><Package className="h-3 w-3 text-white/30" /><span className="text-[10px] text-white/40 uppercase">Fret</span></div>
            <p className="text-[11px] font-semibold text-white/75">{flight.cargo}</p>
          </div>
          {flight.gate && (
            <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-1.5 mb-1"><span className="text-[10px] text-white/40 uppercase">Gate</span></div>
              <p className="text-[11px] font-bold text-white/80 font-mono">{flight.gate}</p>
            </div>
          )}
        </div>
        {flight.cutoffTime && (
          <div className={`px-3 py-2.5 rounded-lg${hasCutoffAlert ? " animate-pulse" : ""}`}
            style={{ background: hasCutoffAlert ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${hasCutoffAlert ? "rgba(239,68,68,0.30)" : "rgba(255,255,255,0.06)"}` }}>
            <CutoffBadge cutoffTime={flight.cutoffTime} />
          </div>
        )}
        <p className="text-[10px] text-white/25 text-right font-mono">Mis à jour {flight.lastUpdate}</p>

        {/* ── Douanes aériennes EXA / IMP ── */}
        {(() => {
          const seed = flight.id.charCodeAt(0) % 3;
          const statuses = [
            { label: "Autorisé", color: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.22)" },
            { label: "En cours", color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.22)" },
            { label: "Contrôle requis", color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.22)" },
          ] as const;
          const exaSt = statuses[seed];
          const impSt = statuses[(seed + 1) % 3];
          const droits = (Math.random() * 5 + 2).toFixed(1);
          const valeurCFA = new Intl.NumberFormat("fr-FR").format(Math.floor(Math.random() * 50_000_000) + 5_000_000);
          return (
            <div>
              <p className="text-[9px] font-bold tracking-widest text-white/25 uppercase mb-1.5">DOUANES AÉRIENNES</p>
              <div className="grid grid-cols-2 gap-1.5">
                {/* EXA */}
                <div className="px-2.5 py-2 rounded-lg" style={{ background: exaSt.bg, border: `1px solid ${exaSt.border}` }}>
                  <p className="text-[9px] text-white/40 mb-1">🛫 EXPORT EXA</p>
                  <p className="text-[9px] font-mono text-white/50 mb-1 truncate">EXA-ABJ-{flight.flightNumber}-2026</p>
                  <span className="text-[10px] font-bold" style={{ color: exaSt.color }}>{exaSt.label}</span>
                  <p className="text-[9px] text-white/35 mt-1 truncate">Val. {valeurCFA} FCFA</p>
                </div>
                {/* IMP */}
                <div className="px-2.5 py-2 rounded-lg" style={{ background: impSt.bg, border: `1px solid ${impSt.border}` }}>
                  <p className="text-[9px] text-white/40 mb-1">🛬 IMPORT IMP</p>
                  <p className="text-[9px] font-mono text-white/50 mb-1 truncate">IMP-ABJ-{flight.flightNumber}-2026</p>
                  <span className="text-[10px] font-bold" style={{ color: impSt.color }}>{impSt.label}</span>
                  <p className="text-[9px] text-white/35 mt-1">Droits {droits}%</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Bouton AWB */}
        <button
          onClick={() => generateAWB({
            awbNumber: `AWB-${flight.airline.replace(/\s/g, "").toUpperCase().slice(0, 3)}-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`,
            flightNumber: flight.flightNumber,
            airline: flight.airline,
            origin: flight.origin,
            destination: flight.destination,
            eta: flight.eta,
            cargo: flight.cargo,
            shipper: "ORION Cargo Abidjan",
            consignee: "Import Logistics " + flight.destination,
            issueDate: new Date().toLocaleDateString("fr-FR"),
            cutoffTime: flight.cutoffTime,
            gate: flight.gate,
          })}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-semibold transition-all hover:opacity-80"
          style={{ border: "1px solid rgba(212,175,55,0.35)", color: "#D4AF37", background: "rgba(212,175,55,0.07)" }}
        >
          <FileText className="h-3 w-3" /> Générer AWB
        </button>
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AirDeck() {
  const { flights, kpi, loading, isLive, refetch } = useAirData();
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleDismiss = (id: string) => setDismissedIds((prev) => new Set(Array.from(prev).concat(id)));

  function handleGenerateLTA() {
    const activeFlights = flights.filter(f => f.status === "active" || f.status === "delayed");
    const ltaFlights = activeFlights.length > 0 ? activeFlights : flights.slice(0, 5);
    generateLTA({
      ltaNumber: `LTA-ABJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`,
      flightNumber: ltaFlights[0]?.flightNumber ?? "HF104",
      airline: ltaFlights[0]?.airline ?? "Air Côte d'Ivoire",
      originAirport: "ABJ – Aéroport International FHB Abidjan",
      destinationAirport: ltaFlights[0]?.destination ?? "CDG – Paris Charles de Gaulle",
      departureDate: new Date().toLocaleDateString("fr-FR"),
      eta: ltaFlights[0]?.eta ?? "—",
      issueDate: new Date().toLocaleDateString("fr-FR"),
      issuedBy: "ORION Air Cargo — Hub FHB Abidjan",
      totalPieces: ltaFlights.reduce((acc, f) => acc + Math.floor(Math.random() * 20 + 5), 0),
      totalWeightKg: ltaFlights.reduce((acc, f) => acc + parseFloat(f.cargo.replace(/[^\d.]/g, "") || "500"), 0),
      shipments: ltaFlights.map(f => ({
        awbRef: `AWB-${f.airline.replace(/\s/g, "").toUpperCase().slice(0, 3)}-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`,
        shipper: "ORION Cargo Abidjan",
        consignee: `Import Logistics ${f.destination}`,
        cargo: f.cargo,
        pieces: Math.floor(Math.random() * 20 + 5),
        weightKg: parseFloat(f.cargo.replace(/[^\d.]/g, "") || "500"),
        declaredValue: `${(Math.random() * 50_000_000 + 5_000_000).toFixed(0)} FCFA`,
      })),
    });
  }

  const undismissedFlights = useMemo(() => flights.filter((f) => !dismissedIds.has(f.id)), [flights, dismissedIds]);

  const deckConfig: DeckConfig = {
    type: "air",
    name: "AIR DECK",
    color: "#a78bfa",
    forecastLabel: "Hub FHB Abidjan · 4h",
    kpis: flights.length > 0
      ? [
          { label: "Vols Actifs",    value: kpi.activeFlights,                  color: "#a78bfa" },
          { label: "Posés",          value: kpi.landed,                          color: "#6B7280" },
          { label: "Retardés",       value: kpi.delayed,                         color: kpi.delayed > 0 ? "#EF4444" : "#a78bfa" },
          { label: "Fret Traité",    value: kpi.totalFreight,                    color: "#a78bfa" },
        ]
      : [
          { label: "Vols Actifs",      value: 32,       color: "#a78bfa" },
          { label: "Fret Traité",      value: "420 T",  color: "#a78bfa" },
          { label: "Hubs Desservis",   value: 7,         color: "#a78bfa" },
          { label: "Délai Moyen",      value: "6.2h", sub: "ABJ→CDG", color: "#a78bfa" },
        ],
    assets: flights.length > 0
      ? flights.map((f) => ({
          id: f.id,
          name: `${f.flightNumber} ${f.airline}`,
          lat: f.lat,
          lng: f.lng,
          status: toDeckStatus(f.status),
          info: [
            f.altitude > 0 ? `FL${Math.round(f.altitude / 100)}` : null,
            f.origin && f.destination ? `${f.origin}→${f.destination}` : null,
            `ETA ${f.eta}`,
            f.delay > 0 ? `+${f.delay}min` : null,
          ].filter(Boolean).join(" · "),
        }))
      : [
          { id: "HF104",  name: "Air CI HF104",          lat: 18.0, lng: -3.0,  status: "active"  as const, info: "FL350 · ABJ→CDG · ETA 22:10" },
          { id: "ET871",  name: "Ethiopian ET871",         lat: 8.0,  lng: 18.0, status: "active"  as const, info: "FL320 · ADD→ABJ · ETA 14:30" },
          { id: "AH1047", name: "Air Algérie AH1047",     lat: 22.0, lng: 5.0,  status: "delayed" as const, info: "Déroutement météo · +2h · ALG→ABJ" },
          { id: "QR552",  name: "Qatar QR552 Cargo",      lat: 15.0, lng: 40.0, status: "active"  as const, info: "FL390 · DOH→LOS · ETA 18:45" },
          { id: "LH8412", name: "Lufthansa Cargo LH8412", lat: 30.0, lng: 15.0, status: "active"  as const, info: "FL370 · FRA→ABJ · ETA 06:20" },
          { id: "AF8723", name: "Air France AF8723",       lat: 40.0, lng: 5.0,  status: "active"  as const, info: "FL350 · CDG→ABJ · ETA 23:15" },
          { id: "EK9054", name: "Emirates Cargo EK9054",  lat: 12.0, lng: 50.0, status: "stopped" as const, info: "Ground hold DXB — vents forts · +1h30" },
        ],
  };

  return (
    <>
      <MissFlightBanner flights={undismissedFlights} onDismiss={handleDismiss} />
      <div className="flex h-screen overflow-hidden" style={{ background: "#030712" }}>
        <FlightsPanel flights={flights} open={panelOpen} onToggle={() => setPanelOpen((v) => !v)} dismissedIds={dismissedIds} />
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence>
            {selectedFlight && <FlightDetail flight={selectedFlight} onClose={() => setSelectedFlight(null)} />}
          </AnimatePresence>
          {isLive && (
            <div className="absolute top-16 left-4 z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.20)", color: "#10B981" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              API LIVE
              <button onClick={refetch} className="ml-1 opacity-60 hover:opacity-100 transition-opacity" title="Rafraîchir">↻</button>
            </div>
          )}

          {/* Bouton LTA groupé */}
          <button
            onClick={handleGenerateLTA}
            className="absolute top-16 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.28)", color: "#a78bfa", backdropFilter: "blur(8px)" }}
            title="Générer LTA groupée (tous les vols actifs)"
          >
            <FileText className="h-3 w-3" />
            LTA Groupée
          </button>

          <DeckLayout config={deckConfig} isLoading={loading} />
        </div>
      </div>
    </>
  );
}
