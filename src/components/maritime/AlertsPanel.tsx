"use client";

import { Bell, AlertTriangle, Info, CheckCircle, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaritimeAlert } from "@/hooks/useMaritimeData";

interface AlertsPanelProps {
  alerts: MaritimeAlert[];
  isOpen: boolean;
  onClose: () => void;
  isLive?: boolean;
}

const ALERT_CONFIG = {
  critical: {
    icon: <AlertTriangle className="h-4 w-4 text-red-400" />,
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    label: "CRITIQUE",
    bar: "bg-red-500",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 text-orange-400" />,
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    label: "ATTENTION",
    bar: "bg-orange-500",
  },
  info: {
    icon: <Info className="h-4 w-4 text-sky-400" />,
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    label: "INFO",
    bar: "bg-sky-500",
  },
  success: {
    icon: <CheckCircle className="h-4 w-4 text-emerald-400" />,
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    label: "OK",
    bar: "bg-emerald-500",
  },
};

export function AlertsPanel({ alerts, isOpen, onClose, isLive }: AlertsPanelProps) {
  if (!isOpen) return null;

  const criticalCount = alerts.filter(a => a.type === "critical").length;
  const warningCount = alerts.filter(a => a.type === "warning").length;

  return (
    <div
      className="absolute right-4 top-20 z-30 w-80 rounded-xl overflow-hidden shadow-2xl"
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
          <Bell className="h-4 w-4 text-white/40" />
          <h3 className="text-sm font-semibold text-white/85">Alertes</h3>
          <span className="text-[11px] px-1.5 py-0.5 rounded text-white/40"
            style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)" }}>
            {alerts.length}
          </span>
          {isLive && (
            <div className="flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400/70">LIVE</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/[0.06] text-white/30 hover:text-white/70 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Stats bar */}
      {(criticalCount > 0 || warningCount > 0) && (
        <div className="flex gap-3 px-4 py-2"
          style={{ borderBottom: "1px solid rgba(14,165,233,0.08)" }}>
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {criticalCount} critique{criticalCount > 1 ? "s" : ""}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-orange-400">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              {warningCount} attention
            </span>
          )}
        </div>
      )}

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <CheckCircle className="h-8 w-8 text-emerald-500/40 mx-auto mb-2" />
            <p className="text-sm text-white/30">Aucune alerte active</p>
          </div>
        ) : (
          alerts.map(alert => {
            const cfg = ALERT_CONFIG[alert.type];
            return (
              <div
                key={alert.id}
                className="px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer relative"
                style={{ borderBottom: "1px solid rgba(14,165,233,0.06)" }}
              >
                {/* Left accent bar */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-0.5", cfg.bar)} />
                <div className="flex items-start gap-3 pl-2">
                  <div className="mt-0.5 shrink-0">{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border", cfg.badge)}>
                        {cfg.label}
                      </span>
                      {alert.vessel && (
                        <span className="text-[11px] text-white/30 font-mono truncate">
                          {alert.vessel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/80 font-medium leading-snug">{alert.title}</p>
                    <p className="text-[12px] text-white/40 mt-1 leading-relaxed line-clamp-2">
                      {alert.message}
                    </p>
                    <p className="text-[10px] text-white/25 mt-2 font-mono">{alert.timestamp}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(14,165,233,0.08)" }}>
        <button className="text-xs text-sky-400/70 hover:text-sky-400 transition-colors">
          Historique complet →
        </button>
        <RefreshCw className="h-3 w-3 text-white/20" />
      </div>
    </div>
  );
}
