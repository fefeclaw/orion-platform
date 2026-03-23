"use client";

import { useState } from "react";
import { CloudRain, Wind, Eye, Waves, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWeather } from "@/hooks/useWeather";
import { calcMaritimeImpact } from "@/lib/weather";

// Port Autonome d'Abidjan
const PAA_LAT = 5.32;
const PAA_LON = -4.02;

const RISK_COLOR: Record<string, string> = {
  LOW:      "#10B981",
  MEDIUM:   "#F59E0B",
  HIGH:     "#EF4444",
  CRITICAL: "#EF4444",
};

const TYPE_BG: Record<string, string> = {
  CLEAR:        "rgba(16,185,129,0.10)",
  CLOUDS:       "rgba(14,165,233,0.10)",
  RAIN:         "rgba(56,189,248,0.12)",
  HEAVY_RAIN:   "rgba(56,189,248,0.18)",
  THUNDERSTORM: "rgba(245,158,11,0.18)",
  FOG:          "rgba(255,255,255,0.07)",
  SAND:         "rgba(212,168,67,0.14)",
};

interface WeatherWidgetProps {
  onRadarToggle?: (active: boolean) => void;
  onRainToggle?:  (active: boolean) => void;
  radarActive?: boolean;
  rainActive?:  boolean;
}

export function WeatherWidget({
  onRadarToggle,
  onRainToggle,
  radarActive = false,
  rainActive  = false,
}: WeatherWidgetProps) {
  const { weather, loading } = useWeather(PAA_LAT, PAA_LON);
  const [expanded, setExpanded] = useState(false);

  const impact = weather ? calcMaritimeImpact(weather, 24) : null;
  const hasAlert = impact?.riskLevel === "HIGH" || impact?.riskLevel === "CRITICAL";

  if (loading && !weather) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
        style={{ background: "rgba(5,10,22,0.88)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}
      >
        <div className="w-3 h-3 rounded-full border border-sky-500/30 border-t-sky-400 animate-spin" />
        <span className="text-white/30 font-mono tracking-widest">MÉTÉO</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl"
      style={{
        background: "rgba(5,10,22,0.92)",
        border: `1px solid ${hasAlert ? "rgba(239,68,68,0.35)" : "rgba(14,165,233,0.18)"}`,
        backdropFilter: "blur(14px)",
        minWidth: "180px",
      }}
    >
      {/* ── Compact row ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors"
      >
        <span className="text-base leading-none">{weather.icon}</span>
        <div className="flex-1 text-left">
          <p className="text-[11px] font-semibold text-white/85">{weather.description}</p>
          <p className="text-[10px] text-white/35 font-mono">{weather.temp}°C · ABJ</p>
        </div>
        {hasAlert && (
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ boxShadow: "0 0 6px #EF4444" }}
          />
        )}
        {expanded ? <ChevronUp className="h-3 w-3 text-white/25" /> : <ChevronDown className="h-3 w-3 text-white/25" />}
      </button>

      {/* ── Expanded panel ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="px-3 pb-3 space-y-2.5"
              style={{ borderTop: "1px solid rgba(14,165,233,0.10)" }}
            >
              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-1.5 pt-2.5">
                <div className="flex items-center gap-1.5">
                  <Wind className="h-3 w-3 text-white/30" />
                  <span className="text-[11px] text-white/60">{weather.windSpeed} m/s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3 w-3 text-white/30" />
                  <span className="text-[11px] text-white/60">
                    {weather.visibility >= 1000 ? `${(weather.visibility / 1000).toFixed(1)} km` : `${weather.visibility} m`}
                  </span>
                </div>
                {weather.waveHeight !== undefined && (
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Waves className="h-3 w-3 text-sky-400/60" />
                    <span className="text-[11px] text-sky-400/80 font-semibold">Houle {weather.waveHeight}m</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <CloudRain className="h-3 w-3 text-white/30" />
                  <span className="text-[11px] text-white/60">{weather.humidity}% humidité</span>
                </div>
              </div>

              {/* Impact maritime */}
              {impact && (
                <div
                  className="px-2.5 py-2 rounded-lg"
                  style={{ background: TYPE_BG[weather.type] ?? "rgba(14,165,233,0.08)" }}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: RISK_COLOR[impact.riskLevel] }}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: RISK_COLOR[impact.riskLevel] }}>
                      {impact.riskLevel}
                    </span>
                    {impact.adjustedETA && (
                      <span className="text-[10px] text-red-400 ml-auto font-mono">{impact.adjustedETA}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/45 leading-tight">
                    {impact.riskLevel === "LOW" ? "Opérations maritimes normales" :
                     impact.riskLevel === "MEDIUM" ? "Vigilance — houle modérée" :
                     "Impact opérations — ETA recalculé"}
                  </p>
                </div>
              )}

              {/* Toggles overlay */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => onRadarToggle?.(!radarActive)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all"
                  style={{
                    background: radarActive ? "rgba(14,165,233,0.2)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${radarActive ? "rgba(14,165,233,0.4)" : "rgba(255,255,255,0.07)"}`,
                    color: radarActive ? "#38bdf8" : "rgba(255,255,255,0.3)",
                  }}
                >
                  Radar
                </button>
                {["RAIN", "HEAVY_RAIN", "THUNDERSTORM"].includes(weather.type) && (
                  <button
                    onClick={() => onRainToggle?.(!rainActive)}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all"
                    style={{
                      background: rainActive ? "rgba(56,189,248,0.18)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${rainActive ? "rgba(56,189,248,0.35)" : "rgba(255,255,255,0.07)"}`,
                      color: rainActive ? "#38bdf8" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    Pluie
                  </button>
                )}
              </div>

              {/* Source */}
              <p className="text-[9px] text-white/20 font-mono text-right">
                {weather.source === "live" ? "● LIVE" : "○ MOCK"} · OpenWeather
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
