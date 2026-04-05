"use client";

import { motion } from "framer-motion";
import { Bell, AlertTriangle, AlertOctagon, Info, CheckCircle } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const ALERTS = [
  { id: 1, type: "urgent", message: "Retard ORION-03 > 6h aux portes de Abidjan", time: "10 min", icon: AlertOctagon },
  { id: 2, type: "warning", message: "Conditions météo dégradées secteur San-Pédro", time: "25 min", icon: AlertTriangle },
  { id: 3, type: "info", message: "Quai 7 disponible pour amarrage", time: "1h", icon: Info },
  { id: 4, type: "success", message: "ORION-01 arrivée à quai confirmée", time: "2h", icon: CheckCircle },
];

export default function MaritimeAlertsPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Alertes Portuaires</h1>
            <p className="text-sm text-white/40">Notifications temps réel</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs border border-red-500/20">
              1 urgente
            </span>
          </div>
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
            className={`bg-[#0a1120] rounded-xl border p-4 flex items-start gap-4 ${
              alert.type === "urgent" ? "border-red-500/20 bg-red-500/5" :
              alert.type === "warning" ? "border-orange-500/20 bg-orange-500/5" :
              alert.type === "success" ? "border-green-500/20 bg-green-500/5" :
              "border-white/5"
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              alert.type === "urgent" ? "bg-red-500/20" :
              alert.type === "warning" ? "bg-orange-500/20" :
              alert.type === "success" ? "bg-green-500/20" :
              "bg-sky-500/20"
            }`}>
              <alert.icon className={`w-5 h-5 ${
                alert.type === "urgent" ? "text-red-400" :
                alert.type === "warning" ? "text-orange-400" :
                alert.type === "success" ? "text-green-400" :
                "text-sky-400"
              }`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white/80">{alert.message}</p>
              <p className="text-xs text-white/40 mt-1">Il y a {alert.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </DeckLayout>
  );
}
