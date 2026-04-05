"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, Satellite, BarChart3, Columns2,
  Maximize2, ExternalLink, TrendingUp, TrendingDown, CloudRain,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useWeather } from "@/hooks/useWeather";
import WeatherRadarOverlay from "@/components/ui/WeatherRadarOverlay";

type ViewMode = "plan" | "satellite" | "kpi" | "split";

export interface TrackingZone {
  id: string;
  label: string;
  lat: number;
  lon: number;
  zoom: number;
}

export interface TrackingKPI {
  label: string;
  value: string;
  sub?: string;
  trend: number;
  sparkline?: number[];
}

interface TrackingViewProps {
  color: string;
  title: string;
  liveLabel: string;
  icon: LucideIcon;
  zones: TrackingZone[];
  buildMapUrl: (lat: number, lon: number, zoom: number) => string;
  kpis: TrackingKPI[];
  activity: string[];
  externalUrl: string;
  externalLabel: string;
}

function buildSatUrl(lat: number, lon: number, zoom: number): string {
  const z = Math.min(zoom + 1, 18);
  return `https://maps.google.com/maps?q=${lat},${lon}&z=${z}&t=h&output=embed`;
}

const VIEW_MODES: { id: ViewMode; label: string; icon: LucideIcon }[] = [
  { id: "plan",      label: "Plan",      icon: Map },
  { id: "satellite", label: "Satellite", icon: Satellite },
  { id: "kpi",       label: "KPI",       icon: BarChart3 },
  { id: "split",     label: "Split",     icon: Columns2 },
];

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 64, h = 24;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-16 h-5" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

function KPIPanel({
  kpis,
  activity,
  color,
}: {
  kpis: TrackingKPI[];
  activity: string[];
  color: string;
}) {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl p-3"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-start justify-between mb-1">
              <p className="text-[9px] uppercase tracking-widest text-white/30 leading-tight">
                {kpi.label}
              </p>
              <span
                className="text-[9px] font-medium flex items-center gap-0.5 shrink-0 ml-1"
                style={{ color: kpi.trend >= 0 ? "#4ade80" : "#fb923c" }}
              >
                {kpi.trend >= 0 ? (
                  <TrendingUp size={8} />
                ) : (
                  <TrendingDown size={8} />
                )}
                {Math.abs(kpi.trend)}%
              </span>
            </div>
            <p className="text-xl font-semibold text-white leading-none tracking-tight">
              {kpi.value}
            </p>
            {kpi.sub && (
              <p className="text-[9px] text-white/25 mt-1 leading-tight">{kpi.sub}</p>
            )}
            {kpi.sparkline && (
              <div className="mt-2">
                <MiniSparkline data={kpi.sparkline} color={color} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Activity feed */}
      <div
        className="rounded-xl p-3"
        style={{
          background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <p className="text-[9px] uppercase tracking-widest text-white/20 mb-3">
          Flux d&apos;activité
        </p>
        <div className="space-y-2.5">
          {activity.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex items-start gap-2"
            >
              <div
                className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                style={{ background: color }}
              />
              <p className="text-[10px] text-white/40 leading-relaxed">{item}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapFrame({
  src,
  title,
  color,
  loadingLabel,
  keyId,
}: {
  src: string;
  title: string;
  color: string;
  loadingLabel: string;
  keyId: string;
}) {
  const [loading, setLoading] = useState(true);
  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#060d1a] z-10">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: color + "20", borderTopColor: color }}
          />
          <p className="text-[10px] text-white/30 uppercase tracking-widest">{loadingLabel}</p>
        </div>
      )}
      <iframe
        key={keyId}
        src={src}
        className="w-full h-full border-0"
        title={title}
        onLoad={() => setLoading(false)}
        loading="lazy"
      />
    </div>
  );
}

export default function TrackingView({
  color,
  title,
  liveLabel,
  icon: Icon,
  zones,
  buildMapUrl,
  kpis,
  activity,
  externalUrl,
  externalLabel,
}: TrackingViewProps) {
  const [activeZone, setActiveZone] = useState(zones[0]);
  const [viewMode, setViewMode] = useState<ViewMode>("plan");
  const [expanded, setExpanded] = useState(false);
  const [radarVisible, setRadarVisible] = useState(false);
  const { weather } = useWeather(activeZone.lat, activeZone.lon);

  const mapUrl = buildMapUrl(activeZone.lat, activeZone.lon, activeZone.zoom);
  const satUrl = buildSatUrl(activeZone.lat, activeZone.lon, activeZone.zoom);

  const mapHeight = expanded
    ? "h-[calc(100vh-160px)]"
    : viewMode === "split"
    ? "h-[480px]"
    : "h-[420px]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className={`glass rounded-2xl overflow-hidden ${expanded ? "fixed inset-4 z-50" : ""}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: color + "18" }}
          >
            <Icon size={14} style={{ color }} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-white/30 uppercase tracking-widest">
                {liveLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Weather badge */}
          {weather && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] cursor-pointer select-none"
              style={{
                background: radarVisible ? `${color}18` : "rgba(255,255,255,0.04)",
                border: `1px solid ${radarVisible ? color + "40" : "rgba(255,255,255,0.08)"}`,
                color: radarVisible ? color : "rgba(255,255,255,0.45)",
                transition: "all 0.25s",
              }}
              onClick={() => setRadarVisible(!radarVisible)}
              title="Activer / désactiver le radar météo"
            >
              <span>{weather.icon}</span>
              <span className="font-medium">{weather.temp}°</span>
              <CloudRain size={10} aria-hidden="true" />
            </motion.div>
          )}
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/20 hover:text-white/50 transition-colors"
            title={externalLabel}
          >
            <ExternalLink size={14} aria-hidden="true" />
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-white/20 hover:text-white/50 transition-colors"
            title={expanded ? "Réduire" : "Agrandir"}
          >
            <Maximize2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Controls: View toggle + Zone selector */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 overflow-x-auto scrollbar-none">
        {/* View mode pills */}
        <div
          className="flex gap-0.5 shrink-0 p-1 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {VIEW_MODES.map(({ id, label, icon: ModeIcon }) => (
            <motion.button
              key={id}
              onClick={() => setViewMode(id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 uppercase tracking-wide"
              style={
                viewMode === id
                  ? {
                      background: color + "22",
                      color,
                      border: `1px solid ${color}40`,
                      boxShadow: `0 0 12px ${color}20`,
                    }
                  : {
                      color: "rgba(255,255,255,0.3)",
                      border: "1px solid transparent",
                    }
              }
            >
              <ModeIcon size={10} aria-hidden="true" />
              {label}
            </motion.button>
          ))}
        </div>

        {/* Zone selector */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setActiveZone(zone)}
              className="shrink-0 px-3 py-1 rounded-full text-xs transition-all duration-200"
              style={
                activeZone.id === zone.id
                  ? {
                      color,
                      background: color + "18",
                      border: `1px solid ${color}40`,
                    }
                  : {
                      color: "rgba(255,255,255,0.3)",
                      border: "1px solid transparent",
                    }
              }
            >
              {zone.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map/Content area */}
      <div className={`relative ${mapHeight}`}>
        {/* Weather radar overlay — over all map views */}
        {weather && <WeatherRadarOverlay weather={weather} visible={radarVisible} />}

        <AnimatePresence mode="wait">
          {/* Plan view */}
          {viewMode === "plan" && (
            <motion.div
              key="plan"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <MapFrame
                src={mapUrl}
                title={`${title} — ${activeZone.label}`}
                color={color}
                loadingLabel="Synchronisation…"
                keyId={`plan-${activeZone.id}`}
              />
            </motion.div>
          )}

          {/* Satellite view */}
          {viewMode === "satellite" && (
            <motion.div
              key="satellite"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <MapFrame
                src={satUrl}
                title={`Vue satellite — ${activeZone.label}`}
                color="#22d3ee"
                loadingLabel="Vue satellite…"
                keyId={`sat-${activeZone.id}`}
              />
              {/* Satellite badge overlay */}
              <div
                className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg pointer-events-none"
                style={{
                  background: "rgba(4,10,20,0.75)",
                  border: "1px solid rgba(56,189,248,0.2)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Satellite size={10} className="text-[#22d3ee]" aria-hidden="true" />
                <span className="text-[9px] text-[#22d3ee]/80 uppercase tracking-widest font-medium">
                  Google Maps · Hybride
                </span>
              </div>
            </motion.div>
          )}

          {/* KPI view */}
          {viewMode === "kpi" && (
            <motion.div
              key="kpi"
              className="absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <KPIPanel kpis={kpis} activity={activity} color={color} />
            </motion.div>
          )}

          {/* Split view: Satellite (left) + KPI (right) */}
          {viewMode === "split" && (
            <motion.div
              key="split"
              className="absolute inset-0 flex"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Satellite — 60% */}
              <div className="relative" style={{ width: "60%" }}>
                <MapFrame
                  src={satUrl}
                  title={`Vue satellite — ${activeZone.label}`}
                  color="#22d3ee"
                  loadingLabel="Satellite…"
                  keyId={`split-sat-${activeZone.id}`}
                />
                <div
                  className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg pointer-events-none"
                  style={{
                    background: "rgba(4,10,20,0.75)",
                    border: "1px solid rgba(56,189,248,0.2)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-pulse" />
                  <span className="text-[9px] text-[#22d3ee]/70 uppercase tracking-widest">
                    Satellite
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div
                className="w-px shrink-0"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />

              {/* KPI panel — 40% */}
              <div className="overflow-hidden" style={{ width: "40%" }}>
                <KPIPanel kpis={kpis} activity={activity} color={color} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          <p className="text-[10px] text-white/20">{activeZone.label}</p>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === "satellite" && (
            <span
              className="text-[9px] px-2 py-0.5 rounded-full"
              style={{
                color: "#22d3ee",
                background: "rgba(56,189,248,0.08)",
                border: "1px solid rgba(56,189,248,0.2)",
              }}
            >
              Google Maps · Hybride
            </span>
          )}
          {viewMode === "split" && (
            <span
              className="text-[9px] px-2 py-0.5 rounded-full"
              style={{
                color,
                background: color + "10",
                border: `1px solid ${color}30`,
              }}
            >
              Satellite + KPI
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
