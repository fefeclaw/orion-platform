"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

export default function RoadAuditPage() {
  return (
    <DeckLayout header={<div><h1 className="text-xl font-semibold text-white/90">Audit Trail</h1><p className="text-sm text-white/40">Historique logistique routière</p></div>}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6 min-h-[400px] flex items-center justify-center">
        <div className="text-center"><FileText className="w-12 h-12 text-emerald-400/30 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white/60">Audit Trail</h2><p className="text-sm text-white/40">Historique des opérations</p></div>
      </motion.div>
    </DeckLayout>
  );
}
