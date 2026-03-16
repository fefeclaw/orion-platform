"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: number; // positive = up, negative = down
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
      className="glass rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-widest uppercase text-white/30">{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={16} style={{ color }} aria-hidden="true" />
        </div>
      </div>

      <div>
        <p className="text-2xl font-semibold text-white tracking-tight">{value}</p>
        {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1">
          <span
            className="text-xs font-medium"
            style={{ color: trend >= 0 ? "#34d399" : "#f87171" }}
          >
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-white/20">vs mois dernier</span>
        </div>
      )}
    </motion.div>
  );
}
