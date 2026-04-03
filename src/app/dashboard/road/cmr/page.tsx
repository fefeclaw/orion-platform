"use client";

import { motion } from "framer-motion";
import { FileText, Download, Clock, CheckCircle2 } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";
import { generateCMR } from "@/lib/pdf-service";

const RECENT_CMR = [
  { id: "CMR-2026-0047", origin: "Abidjan", destination: "Ouagadougou", date: "02/04/2026", status: "active" },
  { id: "CMR-2026-0046", origin: "San-Pédro", destination: "Bamako", date: "01/04/2026", status: "completed" },
];

export default function RoadCMRPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Documents CMR</h1>
            <p className="text-sm text-white/40">Lettre de voiture internationale</p>
          </div>
          <button 
            onClick={() => generateCMR({ shipmentId: "SHP-NEW", origin: "Abidjan", destination: "Bobo-Dioulasso", cargo: "Cacao" })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-sm hover:bg-emerald-500/30 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Nouveau CMR
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
          <Clock className="w-4 h-4 text-emerald-400" />
          CMR récents
        </h2>

        <div className="space-y-3">
          {RECENT_CMR.map((cmr, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{cmr.id}</p>
                  <p className="text-xs text-white/40">{cmr.origin} → {cmr.destination}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-white/60">{cmr.date}</p>
                  <div className="flex items-center gap-1 justify-end">
                    {cmr.status === "completed" ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-green-400">Livré</span>
                      </>
                    ) : (
                      <span className="text-xs text-emerald-400">En cours</span>
                    )}
                  </div>
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
