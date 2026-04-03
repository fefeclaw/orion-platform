"use client";

import { motion } from "framer-motion";
import { Train, Wrench, Gauge, AlertCircle } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const LOCOMOTIVES = [
  { id: "LOC-001", model: "SIT C26", status: "active", km: 45000, lastMaintenance: "15/03/2026" },
  { id: "LOC-002", model: "SIT C26", status: "maintenance", km: 67800, lastMaintenance: "En cours" },
  { id: "LOC-003", model: "EMD GT26", status: "active", km: 82300, lastMaintenance: "28/03/2026" },
  { id: "LOC-004", model: "EMD GT26", status: "warning", km: 91000, lastMaintenance: "01/04/2026" },
];

export default function RailLocomotivesPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Locomotives</h1>
            <p className="text-sm text-white/40">Gestion de flotte et maintenance</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <Train className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-300">4 locomotives</span>
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
            <Gauge className="w-4 h-4 text-red-400" />
            État de la flotte
          </h2>

          <div className="space-y-3">
            {LOCOMOTIVES.map((loco, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    loco.status === "active" ? "bg-green-500/10" :
                    loco.status === "warning" ? "bg-orange-500/10" : "bg-red-500/10"
                  }`}>
                    <Train className={`w-5 h-5 ${
                      loco.status === "active" ? "text-green-400" :
                      loco.status === "warning" ? "text-orange-400" : "text-red-400"
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{loco.id}</p>
                    <p className="text-xs text-white/40">{loco.model}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-white/60">{loco.km.toLocaleString()} km</p>
                    <p className="text-xs text-white/40">Dernier entretien: {loco.lastMaintenance}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs ${
                    loco.status === "active" ? "bg-green-500/10 text-green-400" :
                    loco.status === "warning" ? "bg-orange-500/10 text-orange-400" :
                    "bg-red-500/10 text-red-400"
                  }`}>
                    {loco.status === "active" ? "En service" :
                     loco.status === "warning" ? "Attention" : "Maintenance"}
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
          className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
        >
          <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-red-400" />
            Plan de maintenance
          </h2>
          <div className="space-y-4">
            {[
              { task: "Révision 45 000km", loco: "LOC-001", due: "3 jours", urgent: false },
              { task: "Changement roues", loco: "LOC-004", due: "7 jours", urgent: true },
            ].map((task, i) => (
              <div key={i} className={`p-3 rounded-xl border ${task.urgent ? "bg-red-500/5 border-red-500/20" : "bg-white/[0.02] border-white/5"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">{task.task}</span>
                  <AlertCircle className={`w-4 h-4 ${task.urgent ? "text-red-400" : "text-white/20"}`} />
                </div>
                <p className="text-xs text-white/40 mt-1">{task.loco} · Échéance: {task.due}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DeckLayout>
  );
}
