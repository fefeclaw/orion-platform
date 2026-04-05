"use client";

import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertTriangle, Package } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const EQUIPMENT = [
  { id: "ULD-001", type: "Container", location: "Tarmac A", status: "available", last_check: "2h" },
  { id: "ULD-042", type: "Palette AKE", location: "Entrepôt 3", status: "in_use", last_check: "5h" },
  { id: "ULD-067", type: "Container", location: "Tarmac B", status: "maintenance", last_check: "1j" },
  { id: "ULD-089", type: "Palette PMC", location: "Entrepôt 1", status: "available", last_check: "3h" },
];

export default function AirEquipmentPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Équipements Sol</h1>
            <p className="text-sm text-white/40">ULD · Ground handling · FHB</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">2 dispo</span>
            <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs">1 utilisation</span>
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
          {EQUIPMENT.map((eq, i) => (
            <div key={eq.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  eq.status === "available" ? "bg-green-500/10" :
                  eq.status === "in_use" ? "bg-violet-500/10" :
                  "bg-orange-500/10"
                }`}>
                  <Package className={`w-5 h-5 ${
                    eq.status === "available" ? "text-green-400" :
                    eq.status === "in_use" ? "text-violet-400" :
                    "text-orange-400"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{eq.id}</p>
                  <p className="text-xs text-white/40">{eq.type} · {eq.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  eq.status === "available" ? "bg-green-500/10 text-green-400" :
                  eq.status === "in_use" ? "bg-violet-500/10 text-violet-400" :
                  "bg-orange-500/10 text-orange-400"
                }`}>
                  {eq.status === "available" && <CheckCircle className="w-3 h-3 inline mr-1" />}
                  {eq.status === "in_use" && <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />}
                  {eq.status === "maintenance" && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                  {eq.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
