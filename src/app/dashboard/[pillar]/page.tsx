"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useRole } from "@/hooks/useRole";
import BSCDrawer from "@/components/dashboard/BSCDrawer";
import ContainerDrawer from "@/components/dashboard/ContainerDrawer";
import RoadTransitDrawer from "@/components/dashboard/RoadTransitDrawer";
import ClientDashboard from "@/components/dashboard/ClientDashboard";
import {
  Anchor, Train, Truck, Plane,
  Ship, PackageCheck, MapPin, TrendingUp,
  Activity, Clock, Route, Wind, FileText, Search, Navigation,
} from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import MiniChart from "@/components/dashboard/MiniChart";
import VesselTracker from "@/components/dashboard/VesselTracker";
import FlightTracker from "@/components/dashboard/FlightTracker";
import RailTracker from "@/components/dashboard/RailTracker";
import RoadTracker from "@/components/dashboard/RoadTracker";
import type { LucideIcon } from "lucide-react";

// ─── Mock data per pillar ────────────────────────────────────────

const PILLAR_CONFIG: Record<string, {
  label: string;
  color: string;
  icon: LucideIcon;
  kpis: Array<{ label: string; value: string; sub?: string; trend: number; icon: LucideIcon }>;
  charts: Array<{ label: string; data: number[] }>;
  activity: string[];
}> = {
  maritime: {
    label: "Maritime",
    color: "#38bdf8",
    icon: Anchor,
    kpis: [
      { label: "Navires actifs", value: "48", sub: "Port d'Abidjan + Lagos", trend: 12, icon: Ship },
      { label: "Conteneurs en transit", value: "3 842", sub: "TEU — en mer", trend: 8, icon: PackageCheck },
      { label: "Ports desservis", value: "14", sub: "Afrique de l'Ouest", trend: 2, icon: MapPin },
      { label: "CA mensuel", value: "2.4M €", sub: "Objectif: 2.8M €", trend: -5, icon: TrendingUp },
    ],
    charts: [
      { label: "Conteneurs / semaine", data: [210, 240, 195, 280, 310, 295, 340, 360, 385, 342, 390, 410] },
      { label: "Navires entrés / mois", data: [18, 22, 20, 25, 28, 24, 30, 32, 28, 35, 38, 48] },
    ],
    activity: [
      "🚢 MSC Abidjan — arrivée Port Autonome Abidjan · 14:32",
      "📦 Lot #ABJ-2847 — dédouanement validé DGD · 14:15",
      "⚓ CMA CGM Lagos — départ pour Rotterdam · 13:55",
      "🔄 Transbordement Dakar — 312 conteneurs · 13:40",
      "📡 Balise GPS #MAR-09 — signal reçu Casablanca · 13:22",
    ],
  },
  rail: {
    label: "Ferroviaire",
    color: "#f87171",
    icon: Train,
    kpis: [
      { label: "Wagons actifs", value: "126", sub: "Corridor ABJ-OUA-BKO", trend: 5, icon: Activity },
      { label: "Tonnage mensuel", value: "18 400 T", sub: "Marchandises diverses", trend: 14, icon: PackageCheck },
      { label: "Corridors actifs", value: "3", sub: "CI, BF, Mali", trend: 0, icon: Route },
      { label: "Délai moyen", value: "2.4j", sub: "Abidjan → Ouagadougou", trend: -8, icon: Clock },
    ],
    charts: [
      { label: "Tonnage / semaine (T)", data: [800, 950, 870, 1100, 1050, 1200, 1150, 1300, 1280, 1400, 1500, 1550] },
      { label: "Wagons / semaine", data: [40, 48, 44, 55, 52, 60, 58, 65, 64, 70, 75, 78] },
    ],
    activity: [
      "🚂 Train #CI-BF-047 — départ Abidjan 06:00 · arrivée Ouaga 18:30",
      "📋 Manifeste #RAIL-1284 — validé SITARAIL · 12:45",
      "⚡ Locomotive #SIT-22 — maintenance préventive planifiée · 11:00",
      "📦 Lot #BKO-0312 — chargement Bamako Terminal · 10:30",
      "🛤️ Corridor CI-BF — voie libre toutes sections · 10:00",
    ],
  },
  road: {
    label: "Routier",
    color: "#34d399",
    icon: Truck,
    kpis: [
      { label: "Camions actifs", value: "284", sub: "Réseau CI + CEDEAO", trend: 7, icon: Truck },
      { label: "Livraisons / mois", value: "1 247", sub: "Taux de ponctualité 94%", trend: 11, icon: PackageCheck },
      { label: "Corridors couverts", value: "8", sub: "5 pays CEDEAO", trend: 1, icon: Route },
      { label: "KM parcourus", value: "384K", sub: "Ce mois-ci", trend: 9, icon: TrendingUp },
    ],
    charts: [
      { label: "Livraisons / semaine", data: [70, 85, 78, 98, 105, 95, 115, 120, 110, 130, 125, 140] },
      { label: "Camions actifs / jour", data: [180, 210, 195, 230, 245, 220, 260, 270, 255, 280, 275, 284] },
    ],
    activity: [
      "🚛 Convoi #CI-GH-0845 — passage poste Elubo · 14:48",
      "📍 Camion #TRK-217 — arrivée Bouaké · ETA Ouaga 22:00",
      "⚠️ Alerte trafic — RN1 ralentissement Tiébissou · 14:30",
      "✅ Livraison #ABJ-1093 — confirmée Abidjan Centre · 14:10",
      "📡 Tracking GPS actif — 284 véhicules connectés · live",
    ],
  },
  air: {
    label: "Aérien",
    color: "#a78bfa",
    icon: Plane,
    kpis: [
      { label: "Vols actifs", value: "32", sub: "FHB + Lagos + Dakar", trend: 18, icon: Plane },
      { label: "Fret traité", value: "420 T", sub: "Ce mois, +3 hubs", trend: 22, icon: PackageCheck },
      { label: "Hubs desservis", value: "7", sub: "AOF + Europe + Asie", trend: 3, icon: MapPin },
      { label: "Délai moyen", value: "6.2h", sub: "ABJ → CDG", trend: -4, icon: Wind },
    ],
    charts: [
      { label: "Fret traité / semaine (T)", data: [22, 28, 25, 34, 38, 32, 42, 45, 40, 50, 48, 55] },
      { label: "Vols / mois", data: [12, 15, 14, 18, 20, 17, 22, 24, 21, 26, 28, 32] },
    ],
    activity: [
      "✈️ Air Côte d'Ivoire #HF104 — décollage FHB 15:00 · CDG 22:10",
      "📦 Lot #AIR-0482 — dédouanement express validé · 14:55",
      "🛬 Ethiopian Airlines ET871 — atterrissage FHB · 14:30",
      "📡 Tracking #AIR-217 — en transit Dubai → Abidjan · live",
      "🔄 Correspondance fret — hub Dakar LSS · 3 palettes · 14:00",
    ],
  },
};

export default function PillarDashboard() {
  const params = useParams();
  const pillarId = (params.pillar as string) ?? "maritime";
  const cfg = PILLAR_CONFIG[pillarId] ?? PILLAR_CONFIG.maritime;
  const Icon = cfg.icon;
  const [bscOpen, setBscOpen] = useState(false);
  const [containerOpen, setContainerOpen] = useState(false);
  const [transitOpen, setTransitOpen] = useState(false);
  const t = useTranslation();
  const { isClient, loading: roleLoading } = useRole();

  // Client role → simplified Concierge view
  if (!roleLoading && isClient) {
    return <ClientDashboard pillarId={pillarId} />;
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Maritime Drawers */}
      {pillarId === "maritime" && (
        <>
          <BSCDrawer isOpen={bscOpen} onClose={() => setBscOpen(false)} />
          <ContainerDrawer isOpen={containerOpen} onClose={() => setContainerOpen(false)} />
        </>
      )}

      {/* Road Drawer */}
      {pillarId === "road" && (
        <RoadTransitDrawer isOpen={transitOpen} onClose={() => setTransitOpen(false)} />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4 mb-8"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${cfg.color}18` }}
        >
          <Icon size={20} style={{ color: cfg.color }} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white tracking-wide">
            Module {cfg.label}
          </h1>
          <p className="text-xs text-white/30 tracking-widest uppercase">
            {t("nav_dashboard")} — {t("dash_realtime")}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {pillarId === "maritime" && (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setContainerOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: "rgba(56,189,248,0.08)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.25)", boxShadow: "0 0 12px rgba(56,189,248,0.1)" }}
              >
                <Search size={13} aria-hidden="true" />
                {t("dash_container")}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setBscOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-black transition-all"
                style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)", boxShadow: "0 0 20px rgba(56,189,248,0.25)" }}
              >
                <FileText size={13} aria-hidden="true" />
                {t("dash_bsc")}
              </motion.button>
            </>
          )}
          {pillarId === "road" && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTransitOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-black transition-all"
              style={{ background: "linear-gradient(135deg, #34d399, #10b981)", boxShadow: "0 0 20px rgba(52,211,153,0.25)" }}
            >
              <Navigation size={13} aria-hidden="true" />
              Transit CEDEAO
            </motion.button>
          )}
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-white/30">{t("dash_live")}</span>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cfg.kpis.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} color={cfg.color} delay={i * 0.08} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {cfg.charts.map((chart) => (
          <MiniChart key={chart.label} data={chart.data} color={cfg.color} label={chart.label} />
        ))}
      </div>

      {/* Live Trackers — one per pillar */}
      {pillarId === "maritime" && <div className="mb-6"><VesselTracker /></div>}
      {pillarId === "air"      && <div className="mb-6"><FlightTracker /></div>}
      {pillarId === "rail"     && <div className="mb-6"><RailTracker /></div>}
      {pillarId === "road"     && <div className="mb-6"><RoadTracker /></div>}

      {/* Activity feed */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="glass rounded-2xl p-5"
      >
        <p className="text-xs tracking-widest uppercase text-white/30 mb-4">
          {t("tracker_activity")}
        </p>
        <div className="space-y-3">
          {cfg.activity.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="flex items-start gap-3 text-sm"
            >
              <div
                className="w-1 h-1 rounded-full mt-2 shrink-0"
                style={{ background: cfg.color }}
              />
              <span className="text-white/50 leading-relaxed">{item}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
