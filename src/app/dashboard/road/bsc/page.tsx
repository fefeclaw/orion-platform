"use client";

import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const BSC_LIST = [
  { id: "BSC-2026-0156", shipper: "CacaoExport CI", destination: "Rotterdam", bl: "BL-001234", date: "28/03/2026", status: "active" },
  { id: "BSC-2026-0157", shipper: "CimentCI", destination: "Dakar", bl: "BL-001235", date: "29/03/2026", status: "closed" },
];

export default function RoadBSCPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">BSC · Bordereau de Suivi</h1>
            <p className="text-sm text-white/40">Tracking cargaison OIC/ASYCUDA</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/30 transition-colors">
            <FileText className="w-4 h-4" />
            Nouveau BSC
          </button>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
      >
        <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Bordereaux récents
        </h2>

        <div className="space-y-3">
          {BSC_LIST.map((bsc, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{bsc.id}</p>
                  <p className="text-xs text-white/40">{bsc.shipper} → {bsc.destination}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-full text-xs ${
                  bsc.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/10 text-white/60"
                }`}>
                  {bsc.status === "active" ? "En cours" : "Clôturé"}
                </div>
                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <Download className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
