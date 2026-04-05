"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Clock, Train, TrendingUp } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const DELAYS = [
  { train: "CI-BF-048", reason: "Panne signalisation", delay: "+45min", impact: "3 trains", status: "critical" },
  { train: "VOLTA-EXP", reason: "Attente douane", delay: "+2h", impact: "1 train", status: "warning" },
  { train: "BKO-001", reason: "Voie unique", delay: "+30min", impact: "2 trains", status: "moderate" },
];

export default function RailDelaysPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Alertes Retards</h1>
            <p className="text-sm text-white/40">Prédiction et gestion des retards en cascade</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-orange-300">3 retards actifs</span>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-6 h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-2 bg-[#0a1120] rounded-2xl border border-white/5 p-6"
        >
          <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-400" />
            Retards en cours et prévisions
          </h2>

          <div className="space-y-3">
            {DELAYS.map((delay, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  delay.status === "critical"
                    ? "bg-red-500/5 border-red-500/20"
                    : delay.status === "warning"
                    ? "bg-orange-500/5 border-orange-500/20"
                    : "bg-yellow-500/5 border-yellow-500/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      delay.status === "critical" ? "bg-red-500/10" : "bg-orange-500/10"
                    }`}>
                      <Train className={`w-5 h-5 ${
                        delay.status === "critical" ? "text-red-400" : "text-orange-400"
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{delay.train}</p>
                      <p className="text-xs text-white/40">{delay.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      delay.status === "critical" ? "text-red-400" : "text-orange-400"
                    }`}>{delay.delay}</p>
                    <p className="text-xs text-white/40">Impact: {delay.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="bg-[#0a1120] rounded-2xl border border-white/5 p-6">
            <h2 className="text-sm font-medium text-white/60 mb-4">Cascade d'impact</h2>
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-red-500/20" />
              {[
                { time: "14:30", event: "Retard initial CI-BF-048", icon: "●" },
                { time: "15:15", event: "Impact CI-BF-049", icon: "●" },
                { time: "16:00", event: "Rerouting possible", icon: "○" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 mb-4 pl-8">
                  <span className="text-xs text-white/40">{item.time}</span>
                  <div className="w-2 h-2 rounded-full bg-red-400 ring-4 ring-red-400/20" />
                  <span className="text-sm text-white/60">{item.event}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </DeckLayout>
  );
}
