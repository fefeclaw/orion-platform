"use client";

import { motion } from "framer-motion";
import { Bell, AlertTriangle } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

export default function RailAlertsPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Alertes</h1>
            <p className="text-sm text-white/40">Configuration notifications</p>
          </div>
        </div>
      }
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Bell className="w-12 h-12 text-red-400/30 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white/60">Alertes Ferroviaires</h2>
          <p className="text-sm text-white/40">Retards, incidents, maintenances</p>
        </div>
      </motion.div>
    </DeckLayout>
  );
}
