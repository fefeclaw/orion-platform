"use client";

import { motion } from "framer-motion";
import { FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const BSC_LIST = [
  { id: "BSC-2026-001", shipper: "SOTRA", consignee: "SODEMI", cargo: "Matériel minier", status: "valid" },
  { id: "BSC-2026-002", shipper: "COFFEE-CI", consignee: "NESTLE", cargo: "Café robusta", status: "pending" },
  { id: "BSC-2026-003", shipper: "SAPH", consignee: "BASF", cargo: "Hévéa brut", status: "valid" },
  { id: "BSC-2026-004", shipper: "CARGILL", consignee: "CARGILL-EU", cargo: "Cacao", status: "alert" },
];

export default function MaritimeBSCPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Bordereau Suivi Cargaison</h1>
            <p className="text-sm text-white/40">Documents BSC</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-sky-500/20 text-sky-300 text-sm border border-sky-500/30 hover:bg-sky-500/30 transition">
            + Nouveau BSC
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
          {BSC_LIST.map((bsc, i) => (
            <div key={bsc.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  bsc.status === "valid" ? "bg-green-500/10" :
                  bsc.status === "pending" ? "bg-yellow-500/10" :
                  "bg-red-500/10"
                }`}>
                  <FileText className={`w-5 h-5 ${
                    bsc.status === "valid" ? "text-green-400" :
                    bsc.status === "pending" ? "text-yellow-400" :
                    "text-red-400"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{bsc.id}</p>
                  <p className="text-xs text-white/40">{bsc.cargo}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40">{bsc.shipper} → {bsc.consignee}</p>
                <span className={`inline-flex items-center gap-1 text-xs mt-1 ${
                  bsc.status === "valid" ? "text-green-400" :
                  bsc.status === "pending" ? "text-yellow-400" :
                  "text-red-400"
                }`}>
                  {bsc.status === "valid" && <CheckCircle className="w-3 h-3" />}
                  {bsc.status === "pending" && <Clock className="w-3 h-3" />}
                  {bsc.status === "alert" && <AlertCircle className="w-3 h-3" />}
                  {bsc.status === "valid" ? "Validé" : bsc.status === "pending" ? "En attente" : "Alerte"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
