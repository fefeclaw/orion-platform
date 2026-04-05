"use client";

import { motion } from "framer-motion";
import { Shield, MapPin, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const BARRIERS = [
  { id: "B001", name: "Barrage Noé", type: "Douane", status: "open", wait_time: "45 min", direction: "CI → BF" },
  { id: "B002", name: "Frontière Elubo", type: "Douane", status: "congested", wait_time: "2h 30min", direction: "CI → GH" },
  { id: "B003", name: "Pesage Yamoussoukro", type: "Pesage", status: "open", wait_time: "15 min", direction: "Nord-Sud" },
  { id: "B004", name: "Barrage Ferké", type: "Douane", status: "closed", wait_time: "Fermé", direction: "CI → BF" },
  { id: "B005", name: "Poste Adjamé", type: "Police", status: "open", wait_time: "5 min", direction: "Abidjan" },
];

export default function RoadBarriersPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Barrages & Frontières</h1>
            <p className="text-sm text-white/40">Temps d'attente CEDEAO</p>
          </div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
      >
        <div className="space-y-3">
          {BARRIERS.map((barrier, i) => (
            <div key={barrier.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  barrier.status === "open" ? "bg-emerald-500/10" :
                  barrier.status === "congested" ? "bg-orange-500/10" :
                  "bg-red-500/10"
                }`}>
                  {barrier.status === "open" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {barrier.status === "congested" && <Clock className="w-5 h-5 text-orange-400" />}
                  {barrier.status === "closed" && <Shield className="w-5 h-5 text-red-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{barrier.name}</p>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {barrier.direction}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm ${
                  barrier.status === "open" ? "text-emerald-400" :
                  barrier.status === "congested" ? "text-orange-400" :
                  "text-red-400"
                }`}>
                  {barrier.wait_time}
                </p>
                <p className="text-xs text-white/40">{barrier.type}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
