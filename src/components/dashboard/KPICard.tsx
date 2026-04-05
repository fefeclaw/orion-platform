"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  icon: LucideIcon;
  color: string;
  delay?: number;
}

export default function KPICard({ label, value, sub, trend, icon: Icon, color, delay = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative rounded-2xl p-5 flex flex-col gap-3 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(14,28,54,0.85), rgba(6,12,26,0.92))`,
        border: `1px solid ${color}22`,
        backdropFilter: "blur(24px)",
        boxShadow: `0 4px 32px rgba(0,0,0,0.45), 0 0 0 1px ${color}10`,
      }}
    >
      {/* Accent line top */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}70, transparent)` }}
      />

      {/* Ambient glow corner */}
      <div
        className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${color}10 0%, transparent 65%)`,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] tracking-[0.18em] uppercase font-medium" style={{ color: "rgba(255,255,255,0.38)" }}>
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: `${color}18`,
            border: `1px solid ${color}30`,
            boxShadow: `0 0 12px ${color}20`,
          }}
        >
          <Icon size={15} style={{ color, filter: `drop-shadow(0 0 4px ${color}80)` }} aria-hidden="true" />
        </div>
      </div>

      {/* Value */}
      <div className="relative z-10">
        <p
          className="text-2xl font-bold tracking-tight"
          style={{
            color: "rgba(255,255,255,0.95)",
            textShadow: `0 0 20px ${color}25`,
          }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[11px] mt-0.5" style={{ color: `${color}80` }}>
            {sub}
          </p>
        )}
      </div>

      {/* Trend */}
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 relative z-10">
          <span
            className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
            style={{
              color: trend >= 0 ? "#4ade80" : "#fb923c",
              background: trend >= 0 ? "rgba(74,222,128,0.12)" : "rgba(251,146,60,0.12)",
              border: `1px solid ${trend >= 0 ? "rgba(74,222,128,0.25)" : "rgba(251,146,60,0.25)"}`,
            }}
          >
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.20)" }}>vs mois dernier</span>
        </div>
      )}
    </motion.div>
  );
}
