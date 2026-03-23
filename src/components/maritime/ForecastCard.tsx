"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KpiSummary } from "@/hooks/useMaritimeData";

interface Scenario {
  label: string;
  sublabel: string;
  pct: number;
  color: string;
  icon: React.ReactNode;
}

interface ForecastCardProps {
  kpi: KpiSummary;
  alertCount: number;
}

/** Calcule les probabilités à partir du contexte opérationnel */
function computeForecast(congestion: number, atBerth: number, alertCount: number): Scenario[] {
  // Modèle heuristique basé sur 3 signaux : congestion, occupation quai, alertes actives
  const pressure = congestion / 100;
  const berthLoad = Math.min(atBerth / 20, 1); // 20 = capacité max berths ABJ
  const alertPressure = Math.min(alertCount * 0.08, 0.3);

  const rawCritique = pressure * 0.5 + berthLoad * 0.3 + alertPressure * 0.2;
  const rawStable = 0.35 - Math.abs(rawCritique - 0.35) * 0.4;
  const rawReduction = Math.max(0, 1 - rawCritique - rawStable);

  // Normalisation à 100%
  const total = rawCritique + rawStable + rawReduction;
  const pCritique = Math.round((rawCritique / total) * 100);
  const pReduction = Math.round((rawReduction / total) * 100);
  const pStable = 100 - pCritique - pReduction;

  return [
    {
      label: "Escalade",
      sublabel: "Congestion monte",
      pct: pCritique,
      color: pCritique > 60 ? "#EF4444" : pCritique > 40 ? "#F97316" : "#F59E0B",
      icon: <TrendingUp className="h-3 w-3" />,
    },
    {
      label: "Stable",
      sublabel: "Maintien situation",
      pct: pStable,
      color: "#6B7280",
      icon: <Minus className="h-3 w-3" />,
    },
    {
      label: "Réduction",
      sublabel: "Fluidification",
      pct: pReduction,
      color: "#10B981",
      icon: <TrendingDown className="h-3 w-3" />,
    },
  ];
}

export function ForecastCard({ kpi, alertCount }: ForecastCardProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const next = computeForecast(kpi.congestionIndex, kpi.atBerth, alertCount);
    setScenarios(next);
    setUpdatedAt(
      new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + " UTC"
    );
    // Déclenche l'animation des barres
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, [kpi, alertCount]);

  if (scenarios.length === 0) return null;

  const dominant = scenarios.reduce((a, b) => (a.pct > b.pct ? a : b));

  return (
    <div
      className="absolute bottom-16 right-4 z-20 w-56 rounded-xl overflow-hidden shadow-2xl"
      style={{
        background: "rgba(6, 14, 26, 0.94)",
        border: "1px solid rgba(14, 165, 233, 0.15)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{ borderBottom: "1px solid rgba(14,165,233,0.08)" }}
      >
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: "rgba(14,165,233,0.12)" }}
        >
          <BrainCircuit className="h-3.5 w-3.5 text-sky-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-white/80 leading-none">Forecast Model</p>
          <p className="text-[10px] text-white/30 mt-0.5 leading-none">Port Abidjan · +4h</p>
        </div>
        {/* Dominant scenario badge */}
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: `${dominant.color}18`, color: dominant.color }}
        >
          {dominant.pct}%
        </span>
      </div>

      {/* Probability bars */}
      <div className="px-3 py-3 space-y-2.5">
        {scenarios.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span style={{ color: s.color }}>{s.icon}</span>
                <span className="text-[11px] text-white/70 font-medium">{s.label}</span>
                <span className="text-[10px] text-white/25">{s.sublabel}</span>
              </div>
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: s.color }}
              >
                {s.pct}%
              </span>
            </div>
            {/* Bar */}
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: animated ? `${s.pct}%` : "0%",
                  background: `linear-gradient(90deg, ${s.color}99, ${s.color})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderTop: "1px solid rgba(14,165,233,0.06)" }}
      >
        <span className="text-[10px] text-white/20 font-mono">Modèle heuristique v1</span>
        <span className="text-[10px] text-white/25 font-mono">{updatedAt}</span>
      </div>
    </div>
  );
}
