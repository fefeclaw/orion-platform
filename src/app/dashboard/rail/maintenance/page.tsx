"use client";

import { motion } from "framer-motion";
import { Wrench, Calendar, Clock, AlertCircle } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const MAINTENANCE_TASKS = [
  { id: "MT-001", asset: "LOC-002", type: "Révision moteur", status: "in-progress", progress: 65, due: "05/04/2026" },
  { id: "MT-002", asset: "WG-1203", type: "Freins", status: "pending", progress: 0, due: "07/04/2026" },
  { id: "MT-003", asset: "Voie PK145", type: "Changement rails", status: "scheduled", progress: 0, due: "10/04/2026" },
  { id: "MT-004", asset: "LOC-004", type: "Révision 90k km", status: "urgent", progress: 0, due: "02/04/2026" },
];

export default function RailMaintenancePage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Maintenance</h1>
            <p className="text-sm text-white/40">Planning et suivi des interventions</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Wrench className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-orange-300">4 tâches en cours</span>
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
            <Calendar className="w-4 h-4 text-red-400" />
            Tâches de maintenance
          </h2>

          <div className="space-y-3">
            {MAINTENANCE_TASKS.map((task, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  task.status === "urgent" ? "bg-red-500/5 border-red-500/20" :
                  task.status === "in-progress" ? "bg-blue-500/5 border-blue-500/20" :
                  "bg-white/[0.02] border-white/5"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-white/80">{task.type}</p>
                    <p className="text-xs text-white/40">{task.asset} · Échéance: {task.due}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs ${
                    task.status === "urgent" ? "bg-red-500/10 text-red-400" :
                    task.status === "in-progress" ? "bg-blue-500/10 text-blue-400" :
                    "bg-white/10 text-white/60"
                  }`}>
                    {task.status === "in-progress" ? "En cours" :
                     task.status === "urgent" ? "Urgent" :
                     task.status === "scheduled" ? "Planifié" : "En attente"}
                  </div>
                </div>
                {task.progress > 0 && (
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-400 rounded-full transition-all"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
        >
          <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-400" />
            Métriques
          </h2>
          <div className="space-y-4">
            {[
              { label: "Disponibilité", value: "94%", target: "95%" },
              { label: "MTTR moyen", value: "4.2h", target: "5h" },
              { label: "Interventions", value: "12/mois", target: "15" },
            ].map((metric, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.02]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-white/40">{metric.label}</span>
                  <span className="text-xs text-white/40">Objectif: {metric.target}</span>
                </div>
                <p className="text-lg font-semibold text-white/80">{metric.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DeckLayout>
  );
}
