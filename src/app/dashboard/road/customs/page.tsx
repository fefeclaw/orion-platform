"use client";

import { motion } from "framer-motion";
import { FileText, CheckCircle, Clock, FileCheck } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const CUSTOMS_DECLARATIONS = [
  { id: "C-2026-089", type: "EXA", shipper: "SOTRA", status: "validated", border: "Noé", eta: "Livré" },
  { id: "C-2026-088", type: "IMP", shipper: "COFFEE-CI", status: "pending", border: "Elubo", eta: "2h" },
  { id: "C-2026-087", type: "TRN", shipper: "SAPH", status: "processing", border: "Ferké", eta: "4h" },
  { id: "C-2026-086", type: "EXA", shipper: "CARGILL", status: "validated", border: "Noé", eta: "Livré" },
];

export default function RoadCustomsPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Douanes CEDEAO</h1>
            <p className="text-sm text-white/40">Déclarations EXA/IMP/TRN</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-sm border border-emerald-500/30 hover:bg-emerald-500/30 transition">
            + Nouvelle déclaration
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
          {CUSTOMS_DECLARATIONS.map((decl, i) => (
            <div key={decl.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  decl.status === "validated" ? "bg-green-500/10" :
                  decl.status === "pending" ? "bg-yellow-500/10" :
                  "bg-emerald-500/10"
                }`}>
                  {decl.status === "validated" && <CheckCircle className="w-5 h-5 text-green-400" />}
                  {decl.status === "pending" && <Clock className="w-5 h-5 text-yellow-400" />}
                  {decl.status === "processing" && <FileCheck className="w-5 h-5 text-emerald-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{decl.id}</p>
                  <p className="text-xs text-white/40">{decl.shipper} · {decl.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40">{decl.border}</p>
                <span className={`inline-flex items-center gap-1 text-xs mt-1 ${
                  decl.status === "validated" ? "text-green-400" :
                  decl.status === "pending" ? "text-yellow-400" :
                  "text-emerald-400"
                }`}>
                  {decl.eta}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
