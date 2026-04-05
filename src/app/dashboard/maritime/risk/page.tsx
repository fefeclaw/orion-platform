"use client";

import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, AlertCircle, Ship } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const RISKS = [
  { vessel: "ORION-03", risk: "low", probability: 12, factor: "Météo", eta_delay: "+0h" },
  { vessel: "ORION-01", risk: "low", probability: 8, factor: "Normal", eta_delay: "+0h" },
  { vessel: "MSC Sarah", risk: "medium", probability: 45, factor: "Congestion", eta_delay: "+4h" },
  { vessel: "CMA CGM Rio", risk: "high", probability: 78, factor: "Météo + Panne", eta_delay: "+12h" },
];

export default function MaritimeRiskPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Prédiction IA · Risques</h1>
            <p className="text-sm text-white/40">Analyse prédictive retards</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Brain className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-violet-300">Modèle v2.1</span>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        {RISKS.map((risk, i) => (
          <motion.div
            key={risk.vessel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-[#0a1120] rounded-xl border p-4 ${
              risk.risk === "high" ? "border-red-500/20" :
              risk.risk === "medium" ? "border-orange-500/20" :
              "border-green-500/20"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  risk.risk === "high" ? "bg-red-500/10" :
                  risk.risk === "medium" ? "bg-orange-500/10" :
                  "bg-green-500/10"
                }`}>
                  <Ship className={`w-5 h-5 ${
                    risk.risk === "high" ? "text-red-400" :
                    risk.risk === "medium" ? "text-orange-400" :
                    "text-green-400"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{risk.vessel}</p>
                  <p className="text-xs text-white/40">{risk.factor}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs ${
                risk.risk === "high" ? "bg-red-500/10 text-red-400" :
                risk.risk === "medium" ? "bg-orange-500/10 text-orange-400" :
                "bg-green-500/10 text-green-400"
              }`}>
                {risk.probability}% risque
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Probabilité retard</span>
                <span className={risk.risk === "high" ? "text-red-400" : "text-white/60"}>{risk.probability}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    risk.risk === "high" ? "bg-red-400" :
                    risk.risk === "medium" ? "bg-orange-400" :
                    "bg-green-400"
                  }`}
                  style={{ width: `${risk.probability}%` }}
                />
              </div>
              <p className="text-xs text-white/40 mt-2">Impact estimé: {risk.eta_delay}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </DeckLayout>
  );
}
