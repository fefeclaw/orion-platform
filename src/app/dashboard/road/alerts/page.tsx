"use client";

import { motion } from "framer-motion";
import { Bell, AlertTriangle, AlertOctagon, Info } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const ALERTS = [
  { id: 1, type: "urgent", message: "Camion ORN-R-342 accidenté sur N1", location: "Grand-Bassam", time: "5 min" },
  { id: 2, type: "warning", message: "Retard douane > 3h au poste Noé", location: "Frontière CI/BF", time: "12 min" },
  { id: 3, type: "info", message: "Route N7 rouverte circulation", location: "Yamoussoukro", time: "45 min" },
  { id: 4, type: "warning", message: "Poids véhicule excessif détecté", location: "Station pesage", time: "1h" },
];

export default function RoadAlertsPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Alertes Routières</h1>
            <p className="text-sm text-white/40">Dispatch & incidents</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs border border-red-500/20">
            1 urgente
          </span>
        </div>
      }
    >
      <div className="grid gap-4">
        {ALERTS.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-[#0a1120] rounded-xl border p-4 ${
              alert.type === "urgent" ? "border-red-500/20 bg-red-500/5" :
              alert.type === "warning" ? "border-orange-500/20 bg-orange-500/5" :
              "border-emerald-500/20 bg-emerald-500/5"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                alert.type === "urgent" ? "bg-red-500/20" :
                alert.type === "warning" ? "bg-orange-500/20" :
                "bg-emerald-500/20"
              }`}>
                {alert.type === "urgent" && <AlertOctagon className="w-5 h-5 text-red-400" />}
                {alert.type === "warning" && <AlertTriangle className="w-5 h-5 text-orange-400" />}
                {alert.type === "info" && <Info className="w-5 h-5 text-emerald-400" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/80">{alert.message}</p>
                <p className="text-xs text-white/40 mt-1">{alert.location} · Il y a {alert.time}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </DeckLayout>
  );
}
