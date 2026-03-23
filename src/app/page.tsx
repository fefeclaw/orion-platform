"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Radio, AlertTriangle, Activity, Anchor, Train, Truck, Plane, ArrowRight } from "lucide-react";
import { useMaritimeData } from "@/hooks/useMaritimeData";
import { useWeather } from "@/hooks/useWeather";
import WorldMap from "@/components/map/WorldMap";

// ─── Config statique par deck ──────────────────────────────────────────────
const DECKS = [
  {
    id: "maritime",
    label: "Maritime",
    route: "/dashboard/maritime",
    color: "#0EA5E9",
    Icon: Anchor,
    kpis: [
      { label: "Navires",   value: "25",    unit: "" },
      { label: "À quai",   value: "10",    unit: "" },
      { label: "En transit", value: "4",  unit: "" },
      { label: "Alerte",   value: "1",    unit: "" },
    ],
    status: "live" as const,
    region: "Golfe de Guinée · PAA",
  },
  {
    id: "rail",
    label: "Rail",
    route: "/dashboard/rail",
    color: "#f87171",
    Icon: Train,
    kpis: [
      { label: "Wagons",    value: "126",  unit: "" },
      { label: "Tonnage/j", value: "1.84", unit: "kT" },
      { label: "Corridors", value: "3",    unit: "" },
      { label: "Délai moy", value: "2.4",  unit: "j" },
    ],
    status: "live" as const,
    region: "Corridor ABJ-OUA-BKO",
  },
  {
    id: "road",
    label: "Road",
    route: "/dashboard/road",
    color: "#34d399",
    Icon: Truck,
    kpis: [
      { label: "Camions",   value: "284",  unit: "" },
      { label: "Livraisons", value: "1247", unit: "/mois" },
      { label: "Pays CEDEAO", value: "5", unit: "" },
      { label: "Ponctualité", value: "94",  unit: "%" },
    ],
    status: "live" as const,
    region: "Réseau CEDEAO 5 pays",
  },
  {
    id: "air",
    label: "Air",
    route: "/dashboard/air",
    color: "#a78bfa",
    Icon: Plane,
    kpis: [
      { label: "Vols actifs", value: "32",  unit: "" },
      { label: "Fret traité", value: "420", unit: "T" },
      { label: "Hubs",        value: "7",   unit: "" },
      { label: "Délai moy",   value: "6.2", unit: "h" },
    ],
    status: "live" as const,
    region: "Hub FHB Abidjan",
  },
];

export default function HomePage() {
  const { kpi, alerts, isLive } = useMaritimeData(30_000);
  const { weather } = useWeather(5.32, -4.02);
  const [hovered, setHovered] = useState<string | null>(null);

  // KPIs live du maritime
  const liveKpis = kpi
    ? [
        { label: "À quai",     value: String(kpi.atBerth) },
        { label: "En transit", value: String(kpi.inTransit) },
        { label: "Actifs",     value: String(kpi.activeVessels) },
        { label: "Alertes",    value: String(alerts.filter(a => a.type === "critical").length) },
      ]
    : null;

  const totalAssets  = 25 + 126 + 284 + 32;   // maritime + rail + road + air
  const criticalAlerts = alerts.filter(a => a.type === "critical").length + 1; // +1 rail delayed

  return (
    <main className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#05080f]">

      {/* ── Background — satellite world map ── */}
      <WorldMap selectedPillar={null} />

      {/* ── Ambient glows ── */}
      <div className="fixed inset-0 pointer-events-none z-[2]">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#0EA5E9]/6 blur-[160px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-[#D4AF37]/5 blur-[140px]" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3"
        >
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/40" />
            <div className="absolute inset-[3px] rounded-full border border-[#D4AF37]/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            </div>
          </div>
          <span className="text-sm font-light tracking-[0.2em] text-white/60 uppercase">
            Orion Logistics
          </span>
        </motion.div>

        {/* Global status bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 text-[11px] font-mono"
        >
          {/* Live signal */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <Radio className="h-3 w-3 text-emerald-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 5px #10B981" }} />
            <span className="text-emerald-400 tracking-widest">LIVE</span>
          </div>
          {/* Total assets */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(14,165,233,0.07)", border: "1px solid rgba(14,165,233,0.18)" }}>
            <Activity className="h-3 w-3 text-sky-400" />
            <span className="text-sky-400">{totalAssets} assets</span>
          </div>
          {/* Alerts */}
          {criticalAlerts > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <AlertTriangle className="h-3 w-3 text-red-400" />
              <span className="text-red-400">{criticalAlerts} alertes</span>
            </div>
          )}
          {/* Weather */}
          {weather && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-sm leading-none">{weather.icon}</span>
              <span className="text-white/45">{weather.temp}°C ABJ</span>
            </div>
          )}
        </motion.div>
      </header>

      {/* ── Hub title ── */}
      <div className="relative z-10 text-center pt-6 pb-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] tracking-[0.35em] text-white/30 uppercase mb-2 font-mono"
        >
          Autonomous Logistics Brain
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-light text-white/80 tracking-widest"
        >
          Command Center
        </motion.h1>
      </div>

      {/* ── 4 Deck cards ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
          {DECKS.map((deck, i) => {
            const isHov = hovered === deck.id;
            // Override maritime KPIs avec données live
            const kpiList = deck.id === "maritime" && liveKpis ? liveKpis : deck.kpis;

            return (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                onMouseEnter={() => setHovered(deck.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <Link href={deck.route} className="block">
                  <motion.div
                    animate={{ scale: isHov ? 1.02 : 1 }}
                    transition={{ duration: 0.2 }}
                    className="relative rounded-2xl overflow-hidden cursor-pointer"
                    style={{
                      background: isHov ? `${deck.color}0c` : "rgba(5,10,22,0.82)",
                      border: `1px solid ${isHov ? `${deck.color}45` : `${deck.color}18`}`,
                      backdropFilter: "blur(16px)",
                      boxShadow: isHov
                        ? `0 12px 40px ${deck.color}20, 0 0 0 1px ${deck.color}30`
                        : "0 4px 20px rgba(0,0,0,0.35)",
                    }}
                  >
                    {/* Header strip */}
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: `1px solid ${deck.color}12` }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: `${deck.color}15`, border: `1px solid ${deck.color}25` }}
                        >
                          <deck.Icon className="h-3.5 w-3.5" style={{ color: deck.color }} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold tracking-wider text-white/80">{deck.label.toUpperCase()}</p>
                          <p className="text-[9px] text-white/25 font-mono">{deck.region}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: deck.color, boxShadow: `0 0 5px ${deck.color}` }}
                        />
                      </div>
                    </div>

                    {/* KPIs grid */}
                    <div className="grid grid-cols-2 gap-0 px-1 py-1">
                      {(deck.id === "maritime" && liveKpis ? liveKpis : deck.kpis).map((kpi) => {
                        const unit = "unit" in kpi ? String(kpi.unit ?? "") : "";
                        return (
                          <div key={kpi.label} className="px-3 py-2.5">
                            <p className="text-[9px] uppercase tracking-wide text-white/25 mb-0.5">{kpi.label}</p>
                            <p className="text-lg font-semibold leading-tight tabular-nums"
                              style={{ color: deck.color }}>
                              {kpi.value}
                              {unit && <span className="text-[10px] font-normal text-white/30 ml-0.5">{unit}</span>}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* CTA footer */}
                    <div
                      className="flex items-center justify-between px-4 py-2.5"
                      style={{ borderTop: `1px solid ${deck.color}08` }}
                    >
                      <span className="text-[10px] font-mono text-white/20">
                        {deck.id === "maritime" && isLive ? "● LIVE" : "● SIM"}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-semibold"
                        style={{ color: isHov ? deck.color : `${deck.color}60` }}>
                        Ouvrir
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>

                    {/* Hover glow bar */}
                    {isHov && (
                      <motion.div
                        layoutId="glow-bar"
                        className="absolute top-0 left-0 right-0 h-px"
                        style={{ background: `linear-gradient(90deg, transparent, ${deck.color}, transparent)` }}
                      />
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center py-4 text-[9px] tracking-widest uppercase text-white/12 font-mono">
        Orion Platform · 123inov · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
