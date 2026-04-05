"use client";

import { motion } from "framer-motion";
import { Package, Box, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const INVENTORY = [
  { id: "INV-001", type: "Export", content: "Textile", weight: "2.4T", location: "Zone A", status: "ready" },
  { id: "INV-002", type: "Import", content: "Électronique", weight: "1.8T", location: "Zone B", status: "pending" },
  { id: "INV-003", type: "Transit", content: "Pharmaceutique", weight: "0.5T", location: "Frigo", status: "ready" },
  { id: "INV-004", type: "Export", content: "Café", weight: "5.2T", location: "Zone C", status: "alert" },
];

export default function AirInventoryPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Inventaire Cargo</h1>
            <p className="text-sm text-white/40">Entrepôt FHB · Tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">10.5T stock</span>
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
          {INVENTORY.map((item, i) => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  item.status === "ready" ? "bg-green-500/10" :
                  item.status === "pending" ? "bg-yellow-500/10" :
                  "bg-red-500/10"
                }`}>
                  <Box className={`w-5 h-5 ${
                    item.status === "ready" ? "text-green-400" :
                    item.status === "pending" ? "text-yellow-400" :
                    "text-red-400"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{item.content}</p>
                  <p className="text-xs text-white/40">{item.id} · {item.type} · {item.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/60">{item.weight}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  item.status === "ready" ? "bg-green-500/10 text-green-400" :
                  item.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                  "bg-red-500/10 text-red-400"
                }`}>
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
