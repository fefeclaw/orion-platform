"use client";

import { motion } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const PREDICTIONS = [
  { vessel: "ORION-1", currentEta: "06/04 14:00", predictedEta: "06/04 16:30", reason: "Conditions météo", confidence: "87%" },
  { vessel: "MAERSK-452", currentEta: "07/04 08:00", predictedEta: "07/04 08:00", reason: "Stable", confidence: "94%" },
];

export default function MaritimeETAPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Prédiction ETA</h1>
            <p className="text-sm text-white/40">IA de prédiction des arrivées</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Brain className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-violet-300">Modèle IA actif</span>
          </div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
      >
        <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-400" />
          Prévisions temps réel
        </h2>

        <div className="space-y-3">
          {PREDICTIONS.map((pred, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3"
003e
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{pred.vessel}</p>
                    <p className="text-xs text-white/40">Confiance: {pred.confidence}</p>
                  </div>
                </div>              </div>

              <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-white/5">
                <div>
                  <p className="text-xs text-white/40">ETA Original</p>
                  <p className="text-sm text-white/60">{pred.currentEta}</p>
                </div>                
                <div>
                  <p className="text-xs text-white/40">ETA Prédit</p>
                  <p className={`text-sm font-semibold ${
                    pred.currentEta !== pred.predictedEta ? "text-orange-400" : "text-green-400"
                  }`}>{pred.predictedEta}</p>
                </div>                
                <div>
                  <p className="text-xs text-white/40">Raison</p>
                  <p className="text-sm text-white/60">{pred.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
