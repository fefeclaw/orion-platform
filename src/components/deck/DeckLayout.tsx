"use client";

import { useState, useCallback, ReactNode } from "react";
import dynamic from "next/dynamic";
import { BarChart2, Layers, Bell, ArrowLeft, Radio } from "lucide-react";
import Link from "next/link";
import type { DeckAsset, DeckType } from "./DeckMapGL";

const DeckMapGL = dynamic(
  () => import("./DeckMapGL").then(m => ({ default: m.DeckMapGL })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center" style={{ background: "#030712" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
          <p className="text-xs text-white/25 font-mono tracking-widest">CHARGEMENT CARTE</p>
        </div>
      </div>
    ),
  }
);

export interface DeckKPI {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

export interface DeckConfig {
  type: DeckType;
  name: string;         // "RAIL DECK"
  color: string;        // accent color
  kpis: DeckKPI[];
  assets: DeckAsset[];
  forecastLabel: string; // "Corridor ABJ-OUA · 4h"
}

interface DeckLayoutProps {
  config?: DeckConfig;
  isLoading?: boolean;
  header?: ReactNode;
  children?: ReactNode;
}

function SkeletonRow({ color }: { color: string }) {
  return (
    <div className="flex gap-3 px-4 py-3 animate-pulse">
      <div className="h-3 rounded w-1/3" style={{ background: `${color}15` }} />
      <div className="h-3 rounded w-1/4" style={{ background: `${color}10` }} />
      <div className="h-3 rounded w-1/2" style={{ background: `${color}08` }} />
    </div>
  );
}

export function DeckLayout({ config, isLoading = false, header, children }: DeckLayoutProps) {
  const [is3D, setIs3D]         = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<DeckAsset | null>(null);

  // Mode simple : header + children sans carte ni config
  if (!config) {
    return (
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#030712" }}>
        {header && (
          <header
            className="relative flex h-14 shrink-0 items-center justify-between px-5 z-10"
            style={{
              background: "rgba(6, 14, 26, 0.95)",
              backdropFilter: "blur(16px)",
              borderBottom: "1px solid rgba(56,189,248,0.1)",
            }}
          >
            <div className="flex items-center gap-4">
              <Link href="/" className="text-white/25 hover:text-white/60 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex-1">{header}</div>
          </header>
        )}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    );
  }

  const delayedCount = config.assets.filter(a => a.status === "delayed").length;

  const handleAssetClick = useCallback((asset: DeckAsset) => {
    setSelectedAsset(asset);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#030712" }}>

      {/* ── Header ── */}
      <header
        className="relative flex h-14 shrink-0 items-center justify-between px-5 z-10"
        style={{
          background: "rgba(6, 14, 26, 0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${config.color}1a`,
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white/25 hover:text-white/60 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${config.color}18`, border: `1px solid ${config.color}30` }}
            >
              <div className="w-3 h-3 rounded-sm" style={{ background: config.color, opacity: 0.85 }} />
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded tracking-widest"
              style={{ background: `${config.color}12`, border: `1px solid ${config.color}28`, color: config.color }}
            >
              {config.name}
            </span>
          </div>
          <div className="h-5 w-px mx-1" style={{ background: `${config.color}18` }} />
          {/* Live signal */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <Radio className="h-3.5 w-3.5 text-emerald-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 5px #10B981" }} />
            <span className="hidden sm:inline text-[11px] font-semibold text-emerald-400 tracking-widest">LIVE SIGNAL</span>
          </div>
        </div>

        {/* Center — KPIs */}
        <div className="flex items-center gap-3">
          {config.kpis.map((kpi, index) => (
            <div
              key={kpi.label}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg${index >= 2 ? " hidden md:flex" : ""}`}
              style={{ background: `${kpi.color}08`, border: `1px solid ${kpi.color}18` }}
            >
              <div>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.3)" }}>{kpi.label}</p>
                <p className={`text-sm md:text-base font-semibold text-white/90 tabular-nums leading-tight${isLoading ? " animate-pulse opacity-50" : ""}`}>{kpi.value}</p>
                {kpi.sub && <p className="text-[10px] leading-none mt-0.5" style={{ color: `${kpi.color}80` }}>{kpi.sub}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAlerts(v => !v)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: showAlerts ? `${config.color}18` : "rgba(255,255,255,0.04)",
              border: `1px solid ${showAlerts ? `${config.color}40` : "rgba(255,255,255,0.08)"}`,
              color: showAlerts ? config.color : "rgba(255,255,255,0.45)",
            }}
          >
            <Bell className="h-4 w-4" />
            <span>Alertes</span>
            {delayedCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse"
                style={{ background: "#EF4444", color: "white", boxShadow: "0 0 6px #EF4444" }}
              >
                {delayedCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Map ── */}
      <div className="relative flex-1 overflow-hidden">
        <DeckMapGL deck={config.type} assets={config.assets} is3D={is3D} onAssetClick={handleAssetClick} />
        {config.assets.length === 0 && !isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-xl"
              style={{ background: "rgba(6,14,26,0.88)", border: `1px solid ${config.color}18`, backdropFilter: "blur(10px)" }}>
              <Layers className="h-8 w-8 text-white/20" />
              <p className="text-sm text-white/35 font-medium">Aucun asset disponible</p>
            </div>
          </div>
        )}

        {/* 2D/3D toggle */}
        <div
          className="absolute right-4 top-4 z-20 flex items-center rounded-lg overflow-hidden"
          style={{ background: "rgba(6,14,26,0.88)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}
        >
          <Layers className="h-3.5 w-3.5 ml-2.5 text-white/25" />
          {(["2D", "3D"] as const).map((mode) => {
            const active = (mode === "3D") === is3D;
            return (
              <button
                key={mode}
                onClick={() => setIs3D(mode === "3D")}
                className="px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: active ? `${config.color}28` : "transparent",
                  color: active ? config.color : "rgba(255,255,255,0.3)",
                  borderLeft: mode === "3D" ? "1px solid rgba(255,255,255,0.08)" : undefined,
                }}
              >
                {mode}
              </button>
            );
          })}
        </div>

        {/* Alertes panel */}
        {showAlerts && (
          <div
            className="absolute right-4 top-14 z-30 w-72 rounded-xl overflow-hidden shadow-2xl"
            style={{ background: "rgba(6,14,26,0.96)", border: `1px solid ${config.color}25`, backdropFilter: "blur(12px)" }}
          >
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `1px solid ${config.color}12` }}>
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" style={{ color: `${config.color}80` }} />
                <span className="text-sm font-semibold text-white/80">Alertes {config.name.split(" ")[0]}</span>
              </div>
              <button onClick={() => setShowAlerts(false)} className="text-white/30 hover:text-white/70 text-xs">✕</button>
            </div>
            {delayedCount === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-white/25">Aucun asset en retard</p>
              </div>
            ) : (
              config.assets.filter(a => a.status === "delayed").map(a => (
                <div key={a.id} className="px-4 py-3" style={{ borderBottom: `1px solid ${config.color}0a` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[11px] font-semibold text-red-400">RETARD</span>
                  </div>
                  <p className="text-sm text-white/80">{a.name}</p>
                  <p className="text-[11px] text-white/35 mt-1">{a.info}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Forecast mini-card */}
        <div
          className="absolute bottom-14 right-4 z-20 w-40 sm:w-52 rounded-xl overflow-hidden shadow-xl"
          style={{ background: "rgba(6,14,26,0.93)", border: `1px solid ${config.color}18`, backdropFilter: "blur(12px)" }}
        >
          <div className="px-3 py-2.5" style={{ borderBottom: `1px solid ${config.color}10` }}>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-3.5 w-3.5" style={{ color: `${config.color}80` }} />
              <p className="text-[11px] font-semibold text-white/75">Forecast</p>
            </div>
            <p className="text-[10px] text-white/30 mt-0.5">{config.forecastLabel}</p>
          </div>
          <div className="px-3 py-2.5 space-y-2">
            {[
              { label: "Ponctuel",  pct: Math.max(5, 85 - delayedCount * 15), color: "#10B981" },
              { label: "Retard ±",  pct: Math.min(40, 10 + delayedCount * 10), color: "#F59E0B" },
              { label: "Critique",  pct: Math.min(30, delayedCount * 8),        color: "#EF4444" },
            ].map(s => {
              // Normalize to 100
              return s;
            }).map(s => (
              <div key={s.label}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[11px] text-white/60">{s.label}</span>
                  <span className="text-[11px] font-semibold tabular-nums" style={{ color: s.color }}>{s.pct}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${s.pct}%`, background: `linear-gradient(90deg, ${s.color}88, ${s.color})` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected asset card */}
        {selectedAsset && (
          <div
            className="absolute left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 top-4 z-30 px-5 py-3 rounded-xl shadow-2xl"
            style={{ background: "rgba(6,14,26,0.96)", border: `1px solid ${config.color}30`, backdropFilter: "blur(12px)", minWidth: "240px" }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white/90">{selectedAsset.name}</p>
                <p className="text-[11px] text-white/35 font-mono mt-0.5">{selectedAsset.info}</p>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="text-white/30 hover:text-white/70 text-xs">✕</button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full"
                style={{ background: STATUS_COLOR_MAP[selectedAsset.status] }} />
              <span className="text-[11px] text-white/45">
                {selectedAsset.status === "active" ? "Actif" : selectedAsset.status === "delayed" ? "En retard" : "Arrêté"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Asset table ── */}
      <div
        className={`relative shrink-0 w-full backdrop-blur-md border-t transition-all duration-300 ${tableExpanded ? "h-40 md:h-56" : "h-11"}`}
        style={{ background: "rgba(6,14,26,0.96)", borderColor: `${config.color}18` }}
      >
        <button
          onClick={() => setTableExpanded(v => !v)}
          className="w-full h-11 flex items-center justify-between px-5 hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white/70">Assets {config.name.split(" ")[0]}</span>
            <span className="text-[11px] px-2 py-0.5 rounded text-white/30"
              style={{ background: `${config.color}08`, border: `1px solid ${config.color}14` }}>
              {isLoading ? "..." : `${config.assets.length} unités`}
            </span>
            {delayedCount > 0 && (
              <span className="text-[11px] text-red-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {delayedCount} retard{delayedCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <span className="text-white/25 text-xs">{tableExpanded ? "▼" : "▲"}</span>
        </button>

        {tableExpanded && (
          <div className="h-[calc(100%-44px)] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0" style={{ background: "rgba(6,14,26,0.99)" }}>
                <tr style={{ borderBottom: `1px solid ${config.color}12` }}>
                  {["Asset", "Statut", "Info", "Position"].map(h => (
                    <th key={h} className={`text-left px-4 py-2 font-medium text-white/30${h === "Position" ? " hidden md:table-cell" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={4}><SkeletonRow color={config.color} /></td></tr>
                  ))
                ) : config.assets.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-white/25">Aucun asset à afficher</td></tr>
                ) : (
                  config.assets.map(a => (
                    <tr key={a.id}
                      onClick={() => setSelectedAsset(a)}
                      className="cursor-pointer hover:bg-white/[0.03] transition-colors"
                      style={{ borderBottom: `1px solid ${config.color}08` }}>
                      <td className="px-4 py-2 text-white/80 font-medium">{a.name}</td>
                      <td className="px-4 py-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            background: `${STATUS_COLOR_MAP[a.status]}12`,
                            color: STATUS_COLOR_MAP[a.status],
                            border: `1px solid ${STATUS_COLOR_MAP[a.status]}25`,
                          }}>
                          {a.status === "active" ? "Actif" : a.status === "delayed" ? "Retardé" : "Arrêté"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-white/40 font-mono">{a.info}</td>
                      <td className="hidden md:table-cell px-4 py-2 text-white/25 font-mono">{a.lat.toFixed(2)}°, {a.lng.toFixed(2)}°</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_COLOR_MAP: Record<DeckAsset["status"], string> = {
  active:  "#10B981",
  delayed: "#EF4444",
  stopped: "#F59E0B",
};
