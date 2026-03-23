"use client";

import { useState, useEffect } from "react";
import { BarChart2, X, TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface TrendPoint {
  date: string;
  avg_total: number;
  avg_berth: number;
  alerts_red: number;
  alerts_orange: number;
}

interface AnalyticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const MOCK_TRENDS: TrendPoint[] = [
  { date: "17 Mar", avg_total: 38, avg_berth: 11, alerts_red: 1, alerts_orange: 3 },
  { date: "18 Mar", avg_total: 42, avg_berth: 13, alerts_red: 0, alerts_orange: 2 },
  { date: "19 Mar", avg_total: 35, avg_berth: 9,  alerts_red: 2, alerts_orange: 4 },
  { date: "20 Mar", avg_total: 45, avg_berth: 14, alerts_red: 0, alerts_orange: 1 },
  { date: "21 Mar", avg_total: 48, avg_berth: 12, alerts_red: 1, alerts_orange: 2 },
  { date: "22 Mar", avg_total: 44, avg_berth: 11, alerts_red: 0, alerts_orange: 3 },
  { date: "23 Mar", avg_total: 51, avg_berth: 15, alerts_red: 1, alerts_orange: 2 },
];

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs shadow-xl"
      style={{ background: "rgba(6,14,26,0.95)", border: "1px solid rgba(14,165,233,0.2)" }}>
      <p className="text-white/50 mb-1 font-mono">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="tabular-nums">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export function AnalyticsPanel({ isOpen, onClose }: AnalyticsPanelProps) {
  const [days, setDays] = useState(7);
  const [trends, setTrends] = useState<TrendPoint[]>(MOCK_TRENDS);

  useEffect(() => {
    if (!isOpen || !API_URL) return;
    fetch(`${API_URL}/api/analytics/trends?days=${days}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setTrends(data.map((d: Record<string, unknown>) => ({
          date: String(d.date ?? "").slice(5),
          avg_total: Number(d.avg_total ?? 0),
          avg_berth: Number(d.avg_berth ?? 0),
          alerts_red: Number(d.alerts_red ?? 0),
          alerts_orange: Number(d.alerts_orange ?? 0),
        })));
      })
      .catch(() => {});
  }, [isOpen, days]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute left-4 top-4 z-30 w-96 rounded-xl overflow-hidden shadow-2xl"
      style={{
        background: "rgba(6, 14, 26, 0.96)",
        border: "1px solid rgba(14, 165, 233, 0.18)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(14,165,233,0.10)" }}>
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-sky-400/70" />
          <h3 className="text-sm font-semibold text-white/85">Analytiques Trafic</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(14,165,233,0.15)" }}>
            {[7, 30].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className="px-2.5 py-1 text-xs transition-all"
                style={{
                  background: days === d ? "rgba(14,165,233,0.2)" : "transparent",
                  color: days === d ? "#38bdf8" : "rgba(255,255,255,0.3)",
                }}
              >
                {d}j
              </button>
            ))}
          </div>
          <button onClick={onClose}
            className="p-1 rounded hover:bg-white/[0.06] text-white/30 hover:text-white/70 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3" />
          Navires en activité ({days} derniers jours)
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={trends} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(14,165,233,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="avg_total" name="Total" stroke="#0EA5E9" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="avg_berth" name="À quai" stroke="#10B981" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts chart */}
      <div className="px-4 pt-2 pb-4">
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Alertes par jour</p>
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={trends} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(14,165,233,0.04)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="alerts_red" name="RED" stroke="#EF4444" strokeWidth={1.5} dot={{ fill: "#EF4444", r: 2 }} />
            <Line type="monotone" dataKey="alerts_orange" name="ORANGE" stroke="#F97316" strokeWidth={1.5} dot={{ fill: "#F97316", r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
