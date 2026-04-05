"use client";

import { motion } from "framer-motion";
import { FileText, Download, Ship, Package } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const MANIFESTS = [
  { id: "MF-2026-089", vessel: "ORION-01", date: "04/04/2026", containers: 124, weight: "2,450 T" },
  { id: "MF-2026-088", vessel: "MSC Sarah", date: "03/04/2026", containers: 89, weight: "1,820 T" },
  { id: "MF-2026-087", vessel: "CMA CGM Rio", date: "02/04/2026", containers: 156, weight: "3,120 T" },
  { id: "MF-2026-086", vessel: "ORION-02", date: "01/04/2026", containers: 98, weight: "1,950 T" },
];

export default function MaritimeManifestPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Manifeste Cargo</h1>
            <p className="text-sm text-white/40">Liste marchandises embarquées</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 text-sky-300 text-sm border border-sky-500/30 hover:bg-sky-500/30 transition">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6"
      >
        <div className="space-y-3">
          {MANIFESTS.map((mf, i) => (
            <div key={mf.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{mf.id}</p>
                    <p className="text-xs text-white/40">{mf.date}</p>
                  </div>
                </div>
                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
                  <Download className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <div className="flex items-center gap-6 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <Ship className="w-3 h-3" /> {mf.vessel}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" /> {mf.containers} conteneurs
                </span>
                <span>{mf.weight}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
