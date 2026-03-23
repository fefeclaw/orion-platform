"use client";

import { useState, useCallback } from "react";
import { BarChart2 } from "lucide-react";
import { useMaritimeData } from "@/hooks/useMaritimeData";
import { MaritimeHeader } from "@/components/maritime/MaritimeHeader";
import { MaritimeMap } from "@/components/maritime/MaritimeMap";
import { VesselsTable } from "@/components/maritime/VesselsTable";
import { AlertsPanel } from "@/components/maritime/AlertsPanel";
import { AnalyticsPanel } from "@/components/maritime/AnalyticsPanel";
import { ForecastCard } from "@/components/maritime/ForecastCard";
import type { Vessel } from "@/hooks/useMaritimeData";

export default function MaritimeDashboard() {
  const { vessels, kpi, alerts, loading, isLive, refetch } = useMaritimeData(30_000);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);

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
        <MaritimeMap vessels={vessels} onVesselClick={handleVesselClick} />

        {/* Analytiques toggle — top-left */}
        <button
          onClick={() => setShowAnalytics(v => !v)}
          className="absolute left-4 top-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: showAnalytics ? "rgba(14,165,233,0.15)" : "rgba(6,14,26,0.82)",
            border: `1px solid ${showAnalytics ? "rgba(14,165,233,0.35)" : "rgba(14,165,233,0.12)"}`,
            color: showAnalytics ? "#38bdf8" : "rgba(255,255,255,0.4)",
            backdropFilter: "blur(8px)",
          }}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          Analytiques
        </button>

        {/* Floating panels */}
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

        {/* Forecast Model — bottom-right flottant */}
        <ForecastCard kpi={kpi} alertCount={criticalAlerts.length} />

        {/* Selected vessel detail */}
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
