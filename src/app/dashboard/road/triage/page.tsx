"use client";

import { motion } from "framer-motion";
import { Package, CheckCircle, Clock, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const TRIAGE = [
  { id: "TR-001", cargo: "Cacao", origin: "San-Pédro", destination: "Noé", status: "ready", priority: "high" },
  { id: "TR-002", cargo: "Mangues", origin: "Abidjan", destination: "Elubo", status: "pending", priority: "urgent" },
  { id: "TR-003", cargo: "Café", origin: "Divo", destination: "Noé", status: "transit", priority: "normal" },
  { id: "TR-004", cargo: "Pétrole", origin: "Abidjan", destination: "Ferké", status: "ready", priority: "high" },
];

export default function RoadTriagePage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Triage Cargo</h1>
            <p className="text-sm text-white/40">Dispatch prioritaire</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">1 urgent</span>
            <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs">2 haute</span>
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
          {TRIAGE.map((item, i) => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  item.priority === "urgent" ? "bg-red-500/10" :
                  item.priority === "high" ? "bg-orange-500/10" :
                  "bg-emerald-500/10"
                }`}>
                  <Package className={`w-5 h-5 ${
                    item.priority === "urgent" ? "text-red-400" :
                    item.priority === "high" ? "text-orange-400" :
                    "text-emerald-400"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{item.cargo}</p>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    {item.origin} <ArrowRightLeft className="w-3 h-3" /> {item.destination}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  item.status === "ready" ? "bg-emerald-500/10 text-emerald-400" :
                  item.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                  "bg-sky-500/10 text-sky-400"
                }`}>
                  {item.status === "ready" && <CheckCircle className="w-3 h-3 inline mr-1" />}
                  {item.status === "pending" && <Clock className="w-3 h-3 inline mr-1" />}
                  {item.status === "transit" && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
