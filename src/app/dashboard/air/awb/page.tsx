"use client";

import { motion } from "framer-motion";
import { FileText, Download, Plane, CheckCircle2 } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const AWB_LIST = [
  { id: "AWB-235-0123456", dest: "Paris CDG", pieces: "5", weight: "450 kg", status: "shipped" },
  { id: "AWB-235-0123457", dest: "Dubai DXB", pieces: "12", weight: "980 kg", status: "accepted" },
];

export default function AirAWBPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">AWB · Air Waybill</h1>
            <p className="text-sm text-white/40">Bordereaux de transport aérien</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 text-sm hover:bg-violet-500/30 transition-colors">
            <FileText className="w-4 h-4" />
            Nouveau AWB
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
          <FileText className="w-4 h-4 text-violet-400" />
          Bordereaux récents
        </h2>

        <div className="space-y-3">
          {AWB_LIST.map((awb, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{awb.id}</p>
                  <p className="text-xs text-white/40">{awb.dest} · {awb.pieces} colis · {awb.weight}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-full text-xs ${
                  awb.status === "shipped" ? "bg-green-500/10 text-green-400" : "bg-violet-500/10 text-violet-400"
                }`}>
                  {awb.status === "shipped" ? "Expédié" : "Accepté"}
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
