"use client";

import { motion } from "framer-motion";
import { FileText, CheckCircle, Clock, AlertTriangle, Euro } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

const CUSTOMS_DECLARATIONS = [
  { id: "EXA-2026-089", type: "EXA", company: "ECA", status: "validated", duties: "2,450 €", items: 45 },
  { id: "IMP-2026-088", type: "IMP", company: "SOTRA", status: "processing", duties: "18,200 €", items: 120 },
  { id: "IMP-2026-087", type: "IMP", company: "NESTLE", status: "pending", duties: "8,500 €", items: 89 },
  { id: "EXA-2026-086", type: "EXA", company: "SAPH", status: "validated", duties: "1,200 €", items: 23 },
];

export default function AirCustomsPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Douanes EXA/IMP</h1>
            <p className="text-sm text-white/40">Déclarations export/import</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 text-sm border border-violet-500/30 hover:bg-violet-500/30 transition">
            + Nouveau
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
                  "bg-violet-500/10"
                }`}>
                  {decl.status === "validated" && <CheckCircle className="w-5 h-5 text-green-400" />}
                  {decl.status === "pending" && <Clock className="w-5 h-5 text-yellow-400" />}
                  {decl.status === "processing" && <FileText className="w-5 h-5 text-violet-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{decl.id}</p>
                  <p className="text-xs text-white/40">
                    {decl.company} · {decl.items} articles
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/60">{decl.duties}</p>
                <span className={`inline-flex items-center gap-1 text-xs mt-1 ${
                  decl.status === "validated" ? "text-green-400" :
                  decl.status === "pending" ? "text-yellow-400" :
                  "text-violet-400"
                }`}>
                  {decl.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </DeckLayout>
  );
}
