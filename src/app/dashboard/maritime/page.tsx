"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { BarChart2, Layers } from "lucide-react";
import { useMaritimeData } from "@/hooks/useMaritimeData";
import { useWeather } from "@/hooks/useWeather";
import { MaritimeHeader } from "@/components/maritime/MaritimeHeader";
import { VesselsTable } from "@/components/maritime/VesselsTable";
import { AlertsPanel } from "@/components/maritime/AlertsPanel";
import { AnalyticsPanel } from "@/components/maritime/AnalyticsPanel";
import { ForecastCard } from "@/components/maritime/ForecastCard";
import { WeatherWidget } from "@/components/maritime/WeatherWidget";
import { CrisisPanel, useCrisisTrigger } from "@/components/maritime/CrisisPanel";
import WeatherRadarOverlay from "@/components/ui/WeatherRadarOverlay";
import RainParticles from "@/components/ui/RainParticles";
import type { Vessel } from "@/hooks/useMaritimeData";

// Import dynamique — MapLibre GL est browser-only (WebGL)
const MaritimeMapGL = dynamic(
  () => import("@/components/maritime/MaritimeMapGL").then(m => ({ default: m.MaritimeMapGL })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center"
        style={{ background: "#030712" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
          <p className="text-xs text-white/30 font-mono tracking-widest">CHARGEMENT CARTE</p>
        </div>
      </div>
    ),
  }
);

export default function MaritimeDashboard() {
  const { vessels, kpi, alerts, loading, isLive, refetch } = useMaritimeData(30_000);
  const { weather } = useWeather(5.32, -4.02); // Port Autonome d'Abidjan
  const [showAlerts, setShowAlerts]     = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [is3D, setIs3D]                 = useState(false);
  const [radarActive, setRadarActive]   = useState(false);
  const [rainActive,  setRainActive]    = useState(false);
  const [showCrisis,  setShowCrisis]    = useState(false);
  const crisis = useCrisisTrigger(kpi, alerts);

  const criticalAlerts = alerts.filter(a => a.type === "critical" || a.type === "warning");

  const handleVesselClick = useCallback((vessel: Vessel) => {
    setSelectedVessel(vessel);
  }, []);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "#030712" }}
    >
      {/* ── Header ── */}
      <MaritimeHeader
        kpi={kpi}
        alertCount={criticalAlerts.length}
        loading={loading}
        isLive={isLive}
        showAlerts={showAlerts}
        onToggleAlerts={() => setShowAlerts(v => !v)}
        onRefresh={refetch}
      />

      {/* ── Map + overlays ── */}
      <div className="relative flex-1 overflow-hidden">
        {/* MapLibre GL — WebGL 2D/3D */}
        <MaritimeMapGL
          vessels={vessels}
          is3D={is3D}
          onVesselClick={handleVesselClick}
        />

        {/* Overlays météo — sous la carte */}
        {weather && radarActive && <WeatherRadarOverlay weather={weather} visible={radarActive} />}
        {weather && rainActive && <RainParticles type={weather.type} intensity="heavy" />}

        {/* Crisis Panel */}
        <CrisisPanel
          kpi={kpi}
          alerts={alerts}
          isOpen={showCrisis}
          onClose={() => setShowCrisis(false)}
        />

        {/* ── Toolbar top-left ── */}
        <div className="absolute left-4 top-4 z-20 flex flex-col gap-2">
          {/* Crisis Mode button — visible si trigger actif */}
          {crisis.triggered && (
            <button
              onClick={() => setShowCrisis(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all animate-pulse"
              style={{
                background: showCrisis
                  ? (crisis.severity === "RED" ? "rgba(239,68,68,0.22)" : "rgba(245,158,11,0.18)")
                  : (crisis.severity === "RED" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.10)"),
                border: `1px solid ${crisis.severity === "RED" ? "rgba(239,68,68,0.5)" : "rgba(245,158,11,0.4)"}`,
                color: crisis.severity === "RED" ? "#EF4444" : "#F59E0B",
                boxShadow: crisis.severity === "RED" ? "0 0 12px rgba(239,68,68,0.25)" : "0 0 12px rgba(245,158,11,0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              ⚡ Crisis Mode
            </button>
          )}
          {/* Analytiques */}
          <button
            onClick={() => setShowAnalytics(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: showAnalytics ? "rgba(14,165,233,0.18)" : "rgba(6,14,26,0.85)",
              border: `1px solid ${showAnalytics ? "rgba(14,165,233,0.4)" : "rgba(14,165,233,0.14)"}`,
              color: showAnalytics ? "#38bdf8" : "rgba(255,255,255,0.42)",
              backdropFilter: "blur(10px)",
            }}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Analytiques
          </button>

          {/* Weather Widget */}
          <WeatherWidget
            radarActive={radarActive}
            rainActive={rainActive}
            onRadarToggle={setRadarActive}
            onRainToggle={setRainActive}
          />
        </div>

        {/* ── Toggle 2D / 3D — top-right ── */}
        <div
          className="absolute right-4 top-4 z-20 flex items-center rounded-lg overflow-hidden"
          style={{
            background: "rgba(6,14,26,0.88)",
            border: "1px solid rgba(14,165,233,0.16)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Layers className="h-3.5 w-3.5 ml-2.5 text-white/30" />
          <button
            onClick={() => setIs3D(false)}
            className="px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              background: !is3D ? "rgba(14,165,233,0.22)" : "transparent",
              color: !is3D ? "#38bdf8" : "rgba(255,255,255,0.35)",
              borderRight: "1px solid rgba(14,165,233,0.12)",
            }}
          >
            2D
          </button>
          <button
            onClick={() => setIs3D(true)}
            className="px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              background: is3D ? "rgba(14,165,233,0.22)" : "transparent",
              color: is3D ? "#38bdf8" : "rgba(255,255,255,0.35)",
            }}
          >
            3D
          </button>
        </div>

        {/* Panels flottants */}
        <AlertsPanel
          alerts={alerts}
          isOpen={showAlerts}
          onClose={() => setShowAlerts(false)}
          isLive={isLive}
        />
        <AnalyticsPanel
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
        />

        {/* Forecast Model */}
        <ForecastCard kpi={kpi} alertCount={criticalAlerts.length} />

        {/* Vessel detail card */}
        {selectedVessel && (
          <div
            className="absolute left-1/2 -translate-x-1/2 top-4 z-30 px-5 py-3 rounded-xl shadow-2xl"
            style={{
              background: "rgba(6,14,26,0.96)",
              border: "1px solid rgba(14,165,233,0.25)",
              backdropFilter: "blur(12px)",
              minWidth: "280px",
            }}
          >
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-white/90">{selectedVessel.name}</p>
                <p className="text-[11px] text-white/30 font-mono mt-0.5">
                  IMO {selectedVessel.imo} · {selectedVessel.type}
                </p>
              </div>
              <button
                onClick={() => setSelectedVessel(null)}
                className="text-white/30 hover:text-white/70 transition-colors text-xs shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <p className="text-[10px] text-white/30">Vitesse</p>
                <p className="text-sm font-mono text-sky-400">{selectedVessel.speed} kn</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30">Destination</p>
                <p className="text-sm text-white/75 truncate">{selectedVessel.destination}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30">ETA</p>
                <p className="text-sm font-mono text-white/60 truncate">{selectedVessel.eta}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background:
                    selectedVessel.status === "berth" ? "#10B981" :
                    selectedVessel.status === "alert" ? "#EF4444" : "#0EA5E9",
                }}
              />
              <span className="text-[11px] text-white/40">
                {selectedVessel.status === "berth" ? "À quai" :
                 selectedVessel.status === "alert" ? "En alerte" : "En transit"}
              </span>
              <span className="text-[11px] text-white/25 ml-auto font-mono">
                {selectedVessel.lat.toFixed(4)}°, {selectedVessel.lng.toFixed(4)}°
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Vessels table drawer ── */}
      <VesselsTable
        vessels={vessels}
        isExpanded={tableExpanded}
        onToggleExpand={() => setTableExpanded(v => !v)}
        onVesselSelect={handleVesselClick}
      />
    </div>
  );
}
