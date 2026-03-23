"use client";

import { Ship, Anchor, Activity, Bell, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
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

  return (
    <header
      className="relative flex h-14 shrink-0 items-center justify-between px-5 z-10"
      style={{
        background: "rgba(6, 14, 26, 0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(14, 165, 233, 0.12)",
      }}
    >
      {/* Left — Brand + back */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/30 hover:text-white/70 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(14, 165, 233, 0.12)", border: "1px solid rgba(14,165,233,0.2)" }}
          >
            <Ship className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white/90">Orion</span>
            <span
              className="ml-2 text-[11px] font-medium px-2 py-0.5 rounded"
              style={{ background: "rgba(14,165,233,0.1)", color: "#38bdf8" }}
            >
              Maritime Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* Center — KPIs */}
      <div className="flex items-center gap-3">
        {/* Navires actifs */}
        <div
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(14, 165, 233, 0.06)", border: "1px solid rgba(14,165,233,0.12)" }}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: "rgba(14, 165, 233, 0.12)" }}>
            <Ship className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/30">Navires Actifs</p>
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
          <div className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: "rgba(16, 185, 129, 0.12)" }}>
            <Anchor className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/30">À Quai</p>
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
          <div className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ background: "rgba(245, 158, 11, 0.12)" }}>
            <Activity className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] text-white/30">Congestion</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="relative h-1.5 w-14 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                  style={{ width: `${congestion}%`, background: congestionColor }}
                />
              </div>
              <span className="text-xs font-semibold text-white/85 tabular-nums">{congestion}%</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: `${congestionColor}18`, color: congestionColor }}
              >
                {congestionLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 mr-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
          <span className="text-[11px] text-white/30">{isLive ? "LIVE API" : "MOCK"}</span>
        </div>

        <button
          onClick={onRefresh}
          className={`p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors ${loading ? "animate-spin" : ""}`}
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
            color: showAlerts ? "#38bdf8" : "rgba(255,255,255,0.5)",
          }}
        >
          <Bell className="h-4 w-4" />
          <span className="text-xs">Alertes</span>
          {alertCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: "#EF4444", color: "white" }}
            >
              {alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
