"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RotateCcw, Package, Shuffle, X, ChevronRight, Zap } from "lucide-react";
import type { KpiSummary, MaritimeAlert } from "@/hooks/useMaritimeData";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ContingencyPlan {
  id: "A" | "B" | "C";
  label: string;
  code: string;
  description: string;
  eta: string;
  probability: number;
  color: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  actions: string[];
}

// ─── Déclencheur de crise ─────────────────────────────────────────────────────
export function useCrisisTrigger(
  kpi: KpiSummary,
  alerts: MaritimeAlert[],
): { triggered: boolean; severity: "ORANGE" | "RED"; reason: string } {
  const criticalCount = alerts.filter(a => a.type === "critical").length;
  const warningCount  = alerts.filter(a => a.type === "warning").length;
  const congestion    = kpi.congestionIndex;

  if (criticalCount >= 2 || congestion > 80) {
    return {
      triggered: true,
      severity: "RED",
      reason: criticalCount >= 2
        ? `${criticalCount} alertes critiques simultanées`
        : `Congestion port ${congestion}% — seuil critique dépassé`,
    };
  }
  if (criticalCount >= 1 || warningCount >= 3 || congestion > 60) {
    return {
      triggered: true,
      severity: "ORANGE",
      reason: criticalCount >= 1
        ? "Alerte critique détectée — procédure Force Majeure"
        : `${warningCount} avertissements actifs · congestion ${congestion}%`,
    };
  }
  return { triggered: false, severity: "ORANGE", reason: "" };
}

// ─── Plans de contingence ─────────────────────────────────────────────────────
function buildPlans(kpi: KpiSummary, alerts: MaritimeAlert[]): ContingencyPlan[] {
  const delayedVessel = alerts.find(a => a.vessel)?.vessel ?? "navire inconnu";
  const congestion    = kpi.congestionIndex;

  return [
    {
      id: "A",
      label: "Reroute",
      code: "PLAN-A",
      description: `Déroutement vers Terminal 2 PAA — contournement congestion ${congestion}%`,
      eta: "+1h30",
      probability: Math.max(55, 90 - congestion),
      color: "#10B981",
      Icon: RotateCcw,
      actions: [
        "Allocation berth Terminal 2 (Vridi)",
        "Notification agent manutention → ICTSI",
        "Recalcul ETA corridor ABJ-OUA",
        "Mise à jour système de tracking",
      ],
    },
    {
      id: "B",
      label: "Buffer Storage",
      code: "PLAN-B",
      description: `Entreposage temporaire zone franche PAA — ${delayedVessel} en attente`,
      eta: "+3h",
      probability: Math.min(85, 40 + congestion / 2),
      color: "#F59E0B",
      Icon: Package,
      actions: [
        `Réservation entrepôt tampon Zone 4 (${Math.ceil(Math.random() * 500 + 200)} m²)`,
        "Coordination douanes — BRS provisoire",
        "Alerte client — délai estimé +3h",
        "Victor → évaluation coût stockage",
      ],
    },
    {
      id: "C",
      label: "Intermodal Shift",
      code: "PLAN-C",
      description: "Transfert fret urgent sur corridor ferroviaire SITARAIL → Route CEDEAO",
      eta: "+6h",
      probability: Math.max(15, 35 - congestion / 4),
      color: "#818cf8",
      Icon: Shuffle,
      actions: [
        "Coordonner transfert conteneurs → Gare d'Abidjan",
        "Réservation convoi SITARAIL (ABJ → OUA)",
        "Alternative: convoi routier TRK prioritaire",
        "Nadia → notification client SLA breach",
      ],
    },
  ];
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface CrisisPanelProps {
  kpi: KpiSummary;
  alerts: MaritimeAlert[];
  isOpen: boolean;
  onClose: () => void;
}

export function CrisisPanel({ kpi, alerts, isOpen, onClose }: CrisisPanelProps) {
  const [activePlan, setActivePlan] = useState<"A" | "B" | "C" | null>(null);
  const [deployed, setDeployed] = useState<"A" | "B" | "C" | null>(null);
  const [deployProgress, setDeployProgress] = useState(0);

  const { severity, reason } = useCrisisTrigger(kpi, alerts);
  const plans = buildPlans(kpi, alerts);

  // Simule le déploiement d'un plan
  useEffect(() => {
    if (!deployed) return;
    setDeployProgress(0);
    const id = setInterval(() => {
      setDeployProgress(p => {
        if (p >= 100) { clearInterval(id); return 100; }
        return p + 4;
      });
    }, 80);
    return () => clearInterval(id);
  }, [deployed]);

  const activePlanData = plans.find(p => p.id === activePlan);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25 }}
          className="absolute right-4 top-4 z-30 w-80 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: "rgba(5,8,18,0.97)",
            border: `1px solid ${severity === "RED" ? "rgba(239,68,68,0.4)" : "rgba(245,158,11,0.35)"}`,
            backdropFilter: "blur(16px)",
          }}
        >
          {/* ── Header ── */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              background: severity === "RED" ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.07)",
              borderBottom: `1px solid ${severity === "RED" ? "rgba(239,68,68,0.18)" : "rgba(245,158,11,0.14)"}`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Zap
                  className="h-4 w-4"
                  style={{ color: severity === "RED" ? "#EF4444" : "#F59E0B" }}
                />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: severity === "RED" ? "#EF4444" : "#F59E0B" }}
                  >
                    Crisis Mode — {severity}
                  </span>
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: severity === "RED" ? "#EF4444" : "#F59E0B" }}
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                </div>
                <p className="text-[9px] text-white/35 mt-0.5 leading-tight">{reason}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── 3 Plans ── */}
          <div className="p-3 space-y-2">
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest px-1 mb-3">
              3 Plans de contingence actifs
            </p>

            {plans.map((plan) => {
              const isActive   = activePlan === plan.id;
              const isDeployed = deployed === plan.id;

              return (
                <motion.div
                  key={plan.id}
                  layout
                  className="rounded-xl overflow-hidden cursor-pointer"
                  style={{
                    background: isActive ? `${plan.color}0d` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isActive ? `${plan.color}35` : "rgba(255,255,255,0.06)"}`,
                  }}
                  onClick={() => setActivePlan(isActive ? null : plan.id)}
                >
                  {/* Plan header row */}
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}25` }}
                    >
                      <plan.Icon className="h-3 w-3" style={{ color: plan.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest"
                          style={{ color: `${plan.color}90` }}
                        >
                          {plan.code}
                        </span>
                        <span className="text-[11px] font-semibold text-white/80">{plan.label}</span>
                      </div>
                      <p className="text-[10px] text-white/35 truncate">{plan.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-mono" style={{ color: plan.color }}>{plan.eta}</p>
                      <p className="text-[9px] text-white/25">{plan.probability}%</p>
                    </div>
                    <ChevronRight
                      className="h-3.5 w-3.5 transition-transform shrink-0"
                      style={{ color: "rgba(255,255,255,0.2)", transform: isActive ? "rotate(90deg)" : "rotate(0deg)" }}
                    />
                  </div>

                  {/* Probability bar */}
                  <div className="px-3 pb-2">
                    <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${plan.color}55, ${plan.color})` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${plan.probability}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>

                  {/* Expanded actions */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          className="px-3 pb-3 space-y-1.5"
                          style={{ borderTop: `1px solid ${plan.color}12` }}
                        >
                          <p className="text-[9px] text-white/25 uppercase tracking-widest pt-2 mb-1.5">Actions</p>
                          {plan.actions.map((action, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-[10px] mt-0.5 shrink-0" style={{ color: `${plan.color}70` }}>
                                {i + 1}.
                              </span>
                              <p className="text-[10px] text-white/50 leading-tight">{action}</p>
                            </div>
                          ))}

                          {/* Deploy button */}
                          {!isDeployed ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeployed(plan.id); }}
                              className="w-full mt-2 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all"
                              style={{
                                background: `${plan.color}20`,
                                border: `1px solid ${plan.color}40`,
                                color: plan.color,
                              }}
                            >
                              Déployer Plan {plan.id}
                            </button>
                          ) : deployProgress < 100 ? (
                            <div className="mt-2">
                              <div className="flex justify-between mb-1">
                                <span className="text-[10px] text-white/40 font-mono">DÉPLOIEMENT EN COURS</span>
                                <span className="text-[10px] font-mono" style={{ color: plan.color }}>{deployProgress}%</span>
                              </div>
                              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ width: `${deployProgress}%`, background: plan.color }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div
                              className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{ background: `${plan.color}12`, border: `1px solid ${plan.color}30` }}
                            >
                              <motion.span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: plan.color }}
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              />
                              <span className="text-[11px] font-semibold" style={{ color: plan.color }}>
                                Plan {plan.id} activé — Orion Protocol
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* ── Footer ── */}
          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <p className="text-[9px] text-white/20 font-mono">Orion Black Box · Auto-trigger actif</p>
            <AlertTriangle className="h-3 w-3 text-white/15" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
