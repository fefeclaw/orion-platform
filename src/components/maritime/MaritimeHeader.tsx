"use client";

import { Ship, Anchor, Activity, Bell, ArrowLeft, RefreshCw, Radio } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { KpiSummary } from "@/hooks/useMaritimeData";

interface MaritimeHeaderProps {
  kpi: KpiSummary;
  alertCount: number;
  loading: boolean;
  isLive: boolean;
  showAlerts: boolean;
  onToggleAlerts: () => void;
  onRefresh: () => void;
}

export function MaritimeHeader({
  kpi, alertCount, loading, isLive, showAlerts, onToggleAlerts, onRefresh,
}: MaritimeHeaderProps) {
  const congestion = kpi.congestionIndex;
  const congestionColor =
    congestion < 40 ? "#10B981" :
    congestion < 70 ? "#F59E0B" : "#EF4444";
  const congestionLabel =
    congestion < 40 ? "Faible" :
    congestion < 70 ? "Modéré" : "Critique";

  // Horodatage "last updated"
  const [lastUpdate, setLastUpdate] = useState("");
  useEffect(() => {
    const tick = () =>
      setLastUpdate(
        new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="relative flex h-14 shrink-0 items-center justify-between px-5 z-10"
      style={{
        background: "rgba(6, 14, 26, 0.95)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(14, 165, 233, 0.12)",
      }}
    >
      {/* Left — Brand */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/25 hover:text-white/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(14, 165, 233, 0.12)", border: "1px solid rgba(14,165,233,0.2)" }}
          >
            <Ship className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white/90">Orion</span>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded tracking-wide"
                style={{
                  background: "rgba(14,165,233,0.1)",
                  border: "1px solid rgba(14,165,233,0.2)",
                  color: "#38bdf8",
                }}
              >
                MARITIME DECK
              </span>
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="h-5 w-px" style={{ background: "rgba(14,165,233,0.12)" }} />

        {/* Live Signal proéminent */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: isLive
              ? "rgba(16, 185, 129, 0.08)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${isLive ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.08)"}`,
          }}
        >
          <Radio
            className="h-3.5 w-3.5"
            style={{ color: isLive ? "#10B981" : "#6B7280" }}
          />
          <div className="flex items-center gap-1.5">
            {isLive ? (
              <>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  style={{
                    boxShadow: "0 0 6px #10B981",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                <span className="text-[11px] font-semibold text-emerald-400 tracking-widest">
                  LIVE SIGNAL
                </span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <span className="text-[11px] font-medium text-white/30 tracking-wide">
                  SIMULATION
                </span>
              </>
            )}
          </div>
          {isLive && (
            <span className="text-[10px] text-emerald-400/50 font-mono ml-1">
              {lastUpdate}
            </span>
          )}
        </div>
      </div>

      {/* Center — KPIs */}
      <div className="flex items-center gap-3">
        {/* Navires actifs */}
        <div
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(14, 165, 233, 0.06)", border: "1px solid rgba(14,165,233,0.12)" }}
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: "rgba(14, 165, 233, 0.12)" }}
          >
            <Ship className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wide">Actifs</p>
            <p className="text-base font-semibold text-white/90 tabular-nums leading-tight">
              {kpi.activeVessels}
            </p>
          </div>
        </div>

        {/* À quai */}
        <div
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16,185,129,0.12)" }}
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: "rgba(16, 185, 129, 0.12)" }}
          >
            <Anchor className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wide">À Quai</p>
            <p className="text-base font-semibold text-white/90 tabular-nums leading-tight">
              {kpi.atBerth}
            </p>
          </div>
        </div>

        {/* Congestion */}
        <div
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245,158,11,0.12)" }}
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: "rgba(245, 158, 11, 0.12)" }}
          >
            <Activity className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wide">Congestion</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div
                className="relative h-1.5 w-14 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                  style={{ width: `${congestion}%`, background: congestionColor }}
                />
              </div>
              <span className="text-xs font-semibold text-white/85 tabular-nums">{congestion}%</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-semibold tracking-wide"
                style={{ background: `${congestionColor}18`, color: congestionColor }}
              >
                {congestionLabel.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className={`p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors ${loading ? "animate-spin" : ""}`}
          title="Actualiser"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        <button
          onClick={onToggleAlerts}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
          style={{
            background: showAlerts ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${showAlerts ? "rgba(14,165,233,0.3)" : "rgba(255,255,255,0.08)"}`,
            color: showAlerts ? "#38bdf8" : "rgba(255,255,255,0.45)",
          }}
        >
          <Bell className="h-4 w-4" />
          <span className="text-xs font-medium">Alertes</span>
          {alertCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse"
              style={{ background: "#EF4444", color: "white", boxShadow: "0 0 8px #EF4444" }}
            >
              {alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
