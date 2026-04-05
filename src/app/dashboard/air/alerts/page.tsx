"use client";

import { motion } from "framer-motion";
import { Bell, AlertCircle, AlertTriangle, Plane, Clock } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const FLIGHT_ALERTS = [
  { id: 1, flight: "HF-405", type: "delay", message: "Retard 45min · Cause technique", time: "10 min" },
  { id: 2, flight: "SN-502", type: "info", message: "Changement gate T2-B1 → T2-B3", time: "15 min" },
  { id: 3, flight: "TU-712", type: "urgent", message: "Vol dérouté vers Lomé", time: "2 min" },
  { id: 4, flight: "HF-301", type: "cargo", message: "Alerte température fret périssable", time: "5 min" },
];

export default function AirAlertsPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Alertes Vols</h1>
            <p className="text-sm text-white/40">Notifications temps réel ABJ</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs border border-red-500/20">
            1 urgente
          </span>
        </div>
      }
    >
      <div className="grid gap-4">
        {FLIGHT_ALERTS.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-[#0a1120] rounded-xl border p-4 ${
              alert.type === "urgent" ? "border-red-500/20 bg-red-500/5" :
              alert.type === "delay" ? "border-orange-500/20 bg-orange-500/5" :
              alert.type === "cargo" ? "border-violet-500/20 bg-violet-500/5" :
              "border-white/5"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                alert.type === "urgent" ? "bg-red-500/20" :
                alert.type === "delay" ? "bg-orange-500/20" :
                alert.type === "cargo" ? "bg-violet-500/20" :
                "bg-blue-500/20"
              }`}>
                {alert.type === "urgent" && <AlertCircle className="w-5 h-5 text-red-400" />}
                {alert.type === "delay" && <Clock className="w-5 h-5 text-orange-400" />}
                {alert.type === "cargo" && <Plane className="w-5 h-5 text-violet-400" />}
                {alert.type === "info" && <Bell className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white/80">{alert.flight}</span>
                  <span className="text-white/30">·</span>
                  <span className="text-xs text-white/40">Il y a {alert.time}</span>
                </div>
                <p className="text-sm text-white/60">{alert.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </DeckLayout>
  );
}
