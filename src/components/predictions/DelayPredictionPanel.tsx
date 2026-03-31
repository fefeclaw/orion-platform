"use client";

import { Clock, AlertTriangle, TrendingUp, Wind, Anchor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DelayPrediction {
  vesselId: string;
  vesselName: string;
  currentEta: string;
  predictedEta: string;
  delayHours: number;
  confidence: number;
  factors: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

interface DelayPredictionPanelProps {
  predictions: DelayPrediction[];
  isOpen: boolean;
  onClose: () => void;
}

const riskColors = {
  low: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
  medium: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" },
  high: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
  critical: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
};

const riskLabels = {
  low: "Faible risque",
  medium: "Risque modéré",
  high: "Risque élevé",
  critical: "Risque critique",
};

export function DelayPredictionPanel({ predictions, isOpen, onClose }: DelayPredictionPanelProps) {
  if (!isOpen) return null;

  const criticalCount = predictions.filter((p) => p.riskLevel === "critical" || p.riskLevel === "high").length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-16 bottom-0 w-96 bg-[#060e1a]/98 border-l border-white/10 backdrop-blur-xl z-40 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold">Prédictions IA</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-white/50 hover:text-white">
          ×
        </button>
      </div>

      {/* Stats */}
      <div className="p-4 bg-white/5 border-b border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">Alertes prioritaires</span>
          <span className={`font-bold ${criticalCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {criticalCount}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-white/50">Confiance moyenne</span>
          <span className="text-sky-400 font-bold">
            {Math.round(predictions.reduce((acc, p) => acc + p.confidence, 0) / (predictions.length || 1) * 100)}%
          </span>
        </div>
      </div>

      {/* Predictions List */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        <AnimatePresence>
          {predictions.length === 0 ? (
            <p className="text-center text-white/30 py-8">Aucune prédiction active</p>
          ) : (
            predictions.map((prediction) => (
              <motion.div
                key={prediction.vesselId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border ${riskColors[prediction.riskLevel].border} ${riskColors[prediction.riskLevel].bg}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{prediction.vesselName}</h3>
                    <span className={`text-xs ${riskColors[prediction.riskLevel].text}`}>
                      {riskLabels[prediction.riskLevel]}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-white/60">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">+{prediction.delayHours.toFixed(1)}h</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Anchor className="w-3 h-3" />
                    <span>ETA actuel: {new Date(prediction.currentEta).toLocaleString("fr-FR", { day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <TrendingUp className="w-3 h-3" />
                    <span>Prévu: {new Date(prediction.predictedEta).toLocaleString("fr-FR", { day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-white/40 mb-1">Facteurs détectés:</p>
                  <div className="flex flex-wrap gap-1">
                    {prediction.factors.map((factor, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/60">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-white/30">
                    Confiance: {Math.round(prediction.confidence * 100)}%
                  </span>
                  <button className="text-[10px] text-sky-400 hover:text-sky-300">
                    Voir détails →
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
