"use client";

import { motion } from "framer-motion";
import { Star, Package, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const PRIORITY_CARGO = [
  { id: "PRI-001", content: "Medicaments", level: "emergency", flight: "HF-301", status: "loaded" },
  { id: "PRI-002", content: "Pièces auto", level: "high", flight: "HF-405", status: "ready" },
  { id: "PRI-003", content: "Documents", level: "high", flight: "SN-502", status: "ready" },
  { id: "PRI-004", content: "Vaccins", level: "emergency", flight: "TU-712", status: "loading" },
];

export default function AirPriorityPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Priorité Cargo</h1>
            <p className="text-sm text-white/40">Express · Urgent · Emergency</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">2 emergency</span>
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
          {PRIORITY_CARGO.map((item, i) => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  item.level === "emergency" ? "bg-red-500/10" :
                  item.level === "high" ? "bg-orange-500/10" :
                  "bg-violet-500/10"
                }`}>
                  <Star className={`w-5 h-5 ${
                    item.level === "emergency" ? "text-red-400" :
                    item.level === "high" ? "text-orange-400" :
                    "text-violet-400"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{item.content}</p>
                  <p className="text-xs text-white/40">{item.id} · {item.flight}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded capitalize ${
                  item.level === "emergency" ? "bg-red-500/10 text-red-400" :
                  item.level === "high" ? "bg-orange-500/10 text-orange-400" :
                  "bg-violet-500/10 text-violet-400"
                }`}>
                  {item.level}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  item.status === "loaded" ? "bg-green-500/10 text-green-400" :
                  item.status === "ready" ? "bg-blue-500/10 text-blue-400" :
                  "bg-yellow-500/10 text-yellow-400"
                }`}>
                  {item.status === "loaded" && <CheckCircle className="w-3 h-3 inline mr-1" />}
                  {item.status === "loading" && <Clock className="w-3 h-3 inline mr-1" />}
                  {item.status === "ready" && <Package className="w-3 h-3 inline mr-1" />}
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
