"use client";

import { useMemo } from "react";
import { Ship, Clock, AlertTriangle, TrendingDown, Anchor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Vessel } from "@/hooks/useMaritimeData";

interface ArrivalsPanelProps {
  vessels: Vessel[];
  onSelectVessel?: (vessel: Vessel) => void;
}

const CARGO_ICON: Record<string, string> = {
  container: "📦",
  bulk:      "⛏️",
  tanker:    "🛢️",
  roro:      "🚗",
  general:   "📦",
};

const CARGO_COLOR: Record<string, string> = {
  container: "#38bdf8",
  bulk:      "#a3e635",
  tanker:    "#f97316",
  roro:      "#c084fc",
  general:   "#94a3b8",
};

function formatEta(eta: string): string {
  if (!eta || eta === "—" || eta.startsWith("À quai") || eta.startsWith("En retard")) return eta;
  try {
    const d = new Date(eta);
    if (isNaN(d.getTime())) return eta;
    return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return eta; }
}

function hoursUntil(eta: string): number | null {
  try {
    const ms = new Date(eta).getTime() - Date.now();
    return ms > 0 ? ms / 3_600_000 : null;
  } catch { return null; }
}

export default function ArrivalsPanel({ vessels, onSelectVessel }: ArrivalsPanelProps) {
  // Navires en approche < 24h, triés par ETA croissant
  const approaching = useMemo(() =>
    vessels
      .filter(v => v.approachIn24h && v.status !== "berth")
      .sort((a, b) => {
        try { return new Date(a.eta).getTime() - new Date(b.eta).getTime(); }
        catch { return 0; }
      })
      .slice(0, 5),
    [vessels]
  );

  // Navires dont l'ETA a changé de plus de 2h
  const etaChanges = useMemo(() =>
    vessels.filter(v => v.etaChanged),
    [vessels]
  );

  const panelStyle: React.CSSProperties = {
    background:    "rgba(6,14,26,0.88)",
    backdropFilter: "blur(10px)",
    border:        "1px solid rgba(212,175,55,0.25)",
    borderRadius:  "0.75rem",
    padding:       "1rem",
    display:       "flex",
    flexDirection: "column",
    gap:           "0.75rem",
  };

  return (
    <div style={panelStyle}>
      {/* En-tête */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Anchor size={15} color="#D4AF37" />
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#D4AF37", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Arrivées prévues
        </span>
        <span style={{
          marginLeft: "auto",
          fontSize: "0.7rem",
          background: approaching.length > 0 ? "rgba(212,175,55,0.18)" : "rgba(100,116,139,0.2)",
          color: approaching.length > 0 ? "#D4AF37" : "#64748b",
          padding: "0.1rem 0.4rem",
          borderRadius: "9999px",
          fontWeight: 700,
        }}>
          {approaching.length} &lt; 24h
        </span>
      </div>

      {/* Alertes ETA changées */}
      <AnimatePresence>
        {etaChanges.map(v => (
          <motion.div
            key={`eta-alert-${v.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.6rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.4rem",
            }}
          >
            <AlertTriangle size={13} color="#ef4444" style={{ marginTop: "0.1rem", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "0.7rem", color: "#ef4444", fontWeight: 600 }}>
                ETA modifié &gt; 2h
              </div>
              <div style={{ fontSize: "0.68rem", color: "#fca5a5" }}>
                {v.name} — {v.etaPrevious ? `${formatEta(v.etaPrevious)} → ` : ""}{formatEta(v.eta)}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Liste des 5 prochaines arrivées */}
      {approaching.length === 0 ? (
        <div style={{ textAlign: "center", padding: "1rem 0", color: "#475569", fontSize: "0.75rem" }}>
          <Ship size={24} color="#1e3a5f" style={{ margin: "0 auto 0.4rem" }} />
          Aucune arrivée dans les 24h
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {approaching.map((v, idx) => {
            const h = hoursUntil(v.eta);
            const urgency = h !== null && h < 6;
            const color = CARGO_COLOR[v.cargoType ?? "general"] ?? "#94a3b8";
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onSelectVessel?.(v)}
                style={{
                  background: urgency ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${urgency ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "0.5rem",
                  padding: "0.5rem 0.6rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "background 0.15s",
                }}
                whileHover={{ background: "rgba(212,175,55,0.1)" }}
              >
                {/* Position rank */}
                <span style={{ fontSize: "0.65rem", color: "#475569", width: "14px", flexShrink: 0, fontWeight: 700 }}>
                  #{idx + 1}
                </span>
                {/* Cargo icon */}
                <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{CARGO_ICON[v.cargoType ?? "general"]}</span>
                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#64748b" }}>
                    <span style={{ color }}>{v.cargoType ?? "general"}</span>
                    {v.flag ? ` · 🏳 ${v.flag}` : ""}
                    {v.tonnage ? ` · ${v.tonnage.toLocaleString()}T` : ""}
                  </div>
                </div>
                {/* ETA badge */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "flex-end" }}>
                    <Clock size={10} color={urgency ? "#D4AF37" : "#38bdf8"} />
                    <span style={{ fontSize: "0.65rem", color: urgency ? "#D4AF37" : "#38bdf8", fontWeight: 700 }}>
                      {h !== null ? `${h.toFixed(1)}h` : "—"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "#475569", marginTop: "0.1rem" }}>
                    {formatEta(v.eta)}
                  </div>
                </div>
                {/* ETA changed indicator */}
                {v.etaChanged && (
                  <TrendingDown size={12} color="#f97316" style={{ flexShrink: 0 }} />
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Compteur global approche */}
      {approaching.length > 0 && (
        <div style={{
          borderTop: "1px solid rgba(212,175,55,0.15)",
          paddingTop: "0.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ fontSize: "0.65rem", color: "#475569" }}>
            Vitesse moy. approche
          </span>
          <span style={{ fontSize: "0.7rem", color: "#38bdf8", fontWeight: 600 }}>
            {(approaching.reduce((acc, v) => acc + v.speed, 0) / approaching.length).toFixed(1)} kn
          </span>
        </div>
      )}
    </div>
  );
}
