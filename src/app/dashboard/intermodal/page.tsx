"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Ship, Train, Truck, Plane,
  AlertTriangle, Clock, Package, ArrowRight, MapPin, FileText,
} from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";
import type { DeckConfig } from "@/components/deck/DeckLayout";
import { useIntermodalData } from "@/hooks/useIntermodalData";
import type { IntermodalShipment, Segment, TransportMode } from "@/hooks/useIntermodalData";
import { generateRapportIntermodal } from "@/lib/pdf-service";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const MODE_ICON: Record<TransportMode, React.ReactNode> = {
  sea:  <Ship  className="h-3 w-3 shrink-0" />,
  rail: <Train className="h-3 w-3 shrink-0" />,
  road: <Truck className="h-3 w-3 shrink-0" />,
  air:  <Plane className="h-3 w-3 shrink-0" />,
};

const MODE_COLOR: Record<TransportMode, string> = {
  sea:  "#0EA5E9",
  rail: "#8B5CF6",
  road: "#10B981",
  air:  "#A78BFA",
};

const STATUS_CONFIG: Record<IntermodalShipment["status"], { color: string; label: string; bg: string; border: string }> = {
  on_track: { color: "#10B981", label: "En cours",  bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.22)"  },
  delayed:  { color: "#F59E0B", label: "Retardé",   bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.22)"  },
  critical: { color: "#EF4444", label: "Critique",  bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.22)"   },
  delivered:{ color: "#6B7280", label: "Livré",     bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.22)" },
};

const SEG_STATUS_COLOR: Record<Segment["status"], string> = {
  completed: "#10B981",
  active:    "#D4AF37",
  pending:   "rgba(255,255,255,0.20)",
  delayed:   "#EF4444",
};

function formatDelay(min: number): string {
  if (min <= 0) return "";
  if (min < 60) return `+${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `+${h}h${String(m).padStart(2, "0")}` : `+${h}h`;
}

// ─── Panneau liste expéditions ─────────────────────────────────────────────────
function ShipmentsPanel({ shipments, selected, onSelect, open, onToggle }: {
  shipments: IntermodalShipment[];
  selected: IntermodalShipment | null;
  onSelect: (s: IntermodalShipment) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const [filter, setFilter] = useState<IntermodalShipment["status"] | "all">("all");

  const filtered = useMemo(
    () => filter === "all" ? shipments : shipments.filter(s => s.status === filter),
    [shipments, filter]
  );

  return (
    <div className="relative flex shrink-0" style={{ zIndex: 20 }}>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="h-full overflow-hidden"
            style={{ background: "rgba(6,14,26,0.96)", borderRight: "1px solid rgba(212,175,55,0.12)", backdropFilter: "blur(16px)" }}
          >
            <div className="w-70 h-full flex flex-col" style={{ width: 280 }}>
              <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(212,175,55,0.10)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">Expéditions</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium"
                    style={{ background: "rgba(212,175,55,0.10)", border: "1px solid rgba(212,175,55,0.20)", color: "#D4AF37" }}>
                    {shipments.length}
                  </span>
                </div>
                {/* Filtres */}
                <div className="flex gap-1 flex-wrap">
                  {(["all", "on_track", "delayed", "critical"] as const).map(f => (
                    <button key={f}
                      onClick={() => setFilter(f)}
                      className="px-2 py-0.5 rounded text-[9px] font-semibold transition-all"
                      style={{
                        background: filter === f ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${filter === f ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.08)"}`,
                        color: filter === f ? "#D4AF37" : "rgba(255,255,255,0.35)",
                      }}>
                      {f === "all" ? "Tous" : f === "on_track" ? "En cours" : f === "delayed" ? "Retardé" : "Critique"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filtered.map(ship => {
                  const sc = STATUS_CONFIG[ship.status];
                  const isSelected = selected?.id === ship.id;
                  return (
                    <button key={ship.id}
                      onClick={() => onSelect(ship)}
                      className="w-full px-4 py-3 text-left transition-all hover:bg-white/[0.03]"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: isSelected ? "rgba(212,175,55,0.06)" : undefined,
                        borderLeft: isSelected ? "2px solid rgba(212,175,55,0.50)" : "2px solid transparent",
                      }}>
                      {/* ID + statut */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-white/70">{ship.id}</span>
                        <span className="ml-auto text-[9px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
                          {sc.label}
                        </span>
                      </div>
                      {/* Cargo + tonnage */}
                      <p className="text-[11px] text-white/60 mb-1.5 truncate">{ship.cargo}</p>
                      {/* Barre de progression modes */}
                      <div className="flex items-center gap-1">
                        {ship.segments.map((seg, idx) => (
                          <div key={idx} className="flex items-center gap-0.5">
                            <span style={{ color: seg.status === "completed" ? SEG_STATUS_COLOR.completed : seg.status === "active" ? SEG_STATUS_COLOR.active : SEG_STATUS_COLOR.pending, opacity: seg.status === "pending" ? 0.4 : 1 }}>
                              {MODE_ICON[seg.mode]}
                            </span>
                            {idx < ship.segments.length - 1 && (
                              <ArrowRight className="h-2.5 w-2.5" style={{ color: "rgba(255,255,255,0.15)" }} />
                            )}
                          </div>
                        ))}
                        {ship.totalDelay > 0 && (
                          <span className="ml-auto text-[9px] font-mono" style={{ color: ship.status === "critical" ? "#EF4444" : "#F59E0B" }}>
                            {formatDelay(ship.totalDelay)}
                          </span>
                        )}
                      </div>
                    </button>
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
        style={{ right: "-20px", background: "rgba(6,14,26,0.90)", border: "1px solid rgba(212,175,55,0.18)", borderLeft: "none", color: "rgba(212,175,55,0.7)" }}
        title={open ? "Masquer" : "Expéditions"}
      >
        {open ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
    </div>
  );
}

// ─── Panneau détail expédition ─────────────────────────────────────────────────
function ShipmentDetail({ ship, onClose }: { ship: IntermodalShipment; onClose: () => void }) {
  const sc = STATUS_CONFIG[ship.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2 }}
      className="absolute right-4 top-4 z-30 w-80 rounded-xl shadow-2xl overflow-hidden flex flex-col"
      style={{ background: "rgba(6,14,26,0.97)", border: "1px solid rgba(212,175,55,0.22)", backdropFilter: "blur(16px)", maxHeight: "calc(100% - 2rem)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(212,175,55,0.10)" }}>
        <div>
          <p className="text-[11px] font-mono font-bold text-white/85">{ship.id}</p>
          <p className="text-[9px] text-white/35 mt-0.5">{ship.clientRef} · {ship.tonnage}T</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
            {sc.label}
          </span>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors text-sm">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Tracking info */}
        <div className="px-3 py-2.5 rounded-lg" style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.14)" }}>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-3 w-3 text-yellow-400/60" />
            <span className="text-[10px] text-white/45">{ship.origin}</span>
            <ArrowRight className="h-3 w-3 text-white/20" />
            <span className="text-[10px] text-white/60 font-semibold">{ship.finalDestination}</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-3 w-3 text-white/30" />
            <span className="text-[10px] text-white/55">{ship.cargo}</span>
            <Clock className="h-3 w-3 text-white/20 ml-auto" />
            <span className="text-[10px] text-white/55">{ship.eta}</span>
          </div>
          {ship.totalDelay > 0 && (
            <p className="text-[10px] mt-1.5 font-semibold" style={{ color: ship.status === "critical" ? "#EF4444" : "#F59E0B" }}>
              ⚠ Retard cumulé {formatDelay(ship.totalDelay)}
            </p>
          )}
        </div>

        {/* Timeline segments */}
        <div>
          <p className="text-[9px] font-bold tracking-widest text-white/25 uppercase mb-2">TIMELINE SEGMENTS</p>
          <div className="space-y-2">
            {ship.segments.map((seg, idx) => {
              const isActive = idx === ship.currentSegmentIndex;
              const modeColor = MODE_COLOR[seg.mode];
              const segColor = SEG_STATUS_COLOR[seg.status];
              return (
                <div key={idx}
                  className="px-3 py-2.5 rounded-lg"
                  style={{
                    background: isActive ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.025)",
                    border: `1px solid ${isActive ? "rgba(212,175,55,0.20)" : "rgba(255,255,255,0.06)"}`,
                  }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ color: modeColor }}>{MODE_ICON[seg.mode]}</span>
                    <span className="text-[10px] font-semibold" style={{ color: modeColor }}>
                      {seg.mode.toUpperCase()}
                    </span>
                    {isActive && (
                      <span className="text-[8px] px-1 py-0.5 rounded font-bold animate-pulse"
                        style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)", color: "#D4AF37" }}>
                        EN COURS
                      </span>
                    )}
                    <span className="ml-auto text-[9px] font-medium" style={{ color: segColor }}>
                      {seg.status === "completed" ? "✓ Terminé" : seg.status === "active" ? "Actif" : seg.status === "delayed" ? `Retardé ${formatDelay(seg.delay)}` : "En attente"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] text-white/45">{seg.from}</span>
                    <ArrowRight className="h-2.5 w-2.5 text-white/20" />
                    <span className="text-[10px] text-white/65">{seg.to}</span>
                  </div>
                  <p className="text-[9px] text-white/35">{seg.carrier}</p>
                  <p className="text-[9px] font-mono text-white/25 mt-0.5">{seg.trackingRef}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Jonctions */}
        {ship.segments.length > 1 && (
          <div>
            <p className="text-[9px] font-bold tracking-widest text-white/25 uppercase mb-2">JONCTIONS</p>
            <div className="space-y-1.5">
              {ship.segments.slice(0, -1).map((seg, idx) => {
                const next = ship.segments[idx + 1];
                return (
                  <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ color: MODE_COLOR[seg.mode] }}>{MODE_ICON[seg.mode]}</span>
                    <ArrowRight className="h-3 w-3 text-white/20" />
                    <span style={{ color: MODE_COLOR[next.mode] }}>{MODE_ICON[next.mode]}</span>
                    <span className="text-[9px] text-white/40 ml-1">{seg.to}</span>
                    <span className="ml-auto text-[9px] text-white/25 font-mono">Transfert</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────
export default function IntermodalDeck() {
  const { shipments, kpi, loading, isLive } = useIntermodalData();
  const [panelOpen, setPanelOpen]   = useState(true);
  const [selected, setSelected]     = useState<IntermodalShipment | null>(null);

  const criticalCount = kpi.critical;

  function handleRapportPDF() {
    generateRapportIntermodal({
      generatedAt: new Date().toLocaleDateString("fr-FR"),
      kpis: {
        total:     kpi.totalShipments,
        onTrack:   kpi.onTrack,
        delayed:   kpi.delayed,
        critical:  kpi.critical,
        avgDelay:  kpi.avgDelay,
        jonctions: kpi.jonctionsActives,
      },
      shipments: shipments.map(s => ({
        id:          s.id,
        origin:      s.origin,
        destination: s.finalDestination,
        modes:       s.segments.map(seg => seg.mode),
        status:      s.status,
        eta:         s.eta,
        totalDelay:  s.totalDelay,
        cargo:       s.cargo,
        tonnage:     s.tonnage,
        clientRef:   s.clientRef,
        segments:    s.segments.map(seg => ({
          mode:    seg.mode,
          from:    seg.from,
          to:      seg.to,
          status:  seg.status,
          delay:   seg.delay,
          carrier: seg.carrier,
        })),
      })),
    });
  }

  const deckConfig: DeckConfig = useMemo((): DeckConfig => ({
    type: "road",
    name: "INTERMODAL",
    color: "#D4AF37",
    forecastLabel: "Moteur jonction multi-modal · Temps réel",
    kpis: [
      { label: "Expéditions",   value: kpi.totalShipments, color: "#D4AF37" },
      { label: "On Track",      value: kpi.onTrack,        color: "#10B981" },
      { label: "Retardées",     value: kpi.delayed,        color: kpi.delayed > 0 ? "#F59E0B" : "#10B981" },
      { label: "Critiques",     value: kpi.critical,       color: kpi.critical > 0 ? "#EF4444" : "#10B981" },
      { label: "Délai Moyen",   value: kpi.avgDelay > 0 ? `${kpi.avgDelay} min` : "—", color: kpi.avgDelay > 60 ? "#EF4444" : "#F59E0B" },
      { label: "Jonctions",     value: kpi.jonctionsActives, color: "#38bdf8" },
    ],
    assets: shipments.map(s => ({
      id: s.id,
      name: s.id,
      lat: s.lat,
      lng: s.lng,
      status: s.status === "on_track" || s.status === "delivered" ? "active" :
              s.status === "critical" ? "delayed" : "stopped",
      info: `${s.cargo} · ${s.origin}→${s.finalDestination}${s.totalDelay > 0 ? ` · ${formatDelay(s.totalDelay)}` : ""}`,
    })),
  }), [shipments, kpi]);

  return (
    <>
      {/* Banner critique */}
      {criticalCount > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3 px-5 py-3"
          style={{ background: "rgba(15,0,0,0.97)", borderTop: "1px solid rgba(239,68,68,0.45)", boxShadow: "0 -4px 24px rgba(239,68,68,0.20)" }}
        >
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </motion.div>
          <p className="text-[11px] font-bold text-red-400">
            {criticalCount} expédition{criticalCount > 1 ? "s" : ""} en état critique — intervention requise
          </p>
        </div>
      )}

      <div className="flex h-screen overflow-hidden" style={{ background: "#030712" }}>
        <ShipmentsPanel
          shipments={shipments}
          selected={selected}
          onSelect={s => setSelected(prev => prev?.id === s.id ? null : s)}
          open={panelOpen}
          onToggle={() => setPanelOpen(v => !v)}
        />

        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence>
            {selected && <ShipmentDetail ship={selected} onClose={() => setSelected(null)} />}
          </AnimatePresence>

          {isLive && (
            <div className="absolute top-16 left-4 z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold"
              style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.20)", color: "#D4AF37" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#D4AF37" }} />
              MOTEUR ACTIF
            </div>
          )}

          {/* Bouton Rapport PDF */}
          <button
            onClick={handleRapportPDF}
            className="absolute top-16 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.28)", color: "#D4AF37", backdropFilter: "blur(8px)" }}
            title="Générer rapport PDF intermodal"
          >
            <FileText className="h-3 w-3" />
            Rapport PDF
          </button>

          <DeckLayout config={deckConfig} isLoading={loading} />
        </div>
      </div>
    </>
  );
}
