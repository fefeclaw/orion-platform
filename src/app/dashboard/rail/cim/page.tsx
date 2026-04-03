"use client";

import { motion } from "framer-motion";
import { FileText, Download, CheckCircle2 } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

export default function RailCIMPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">CIM · Convention Internationale</h1>
            <p className="text-sm text-white/40">Lettre de voiture ferroviaire</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30 transition-colors">
            <FileText className="w-4 h-4" />
            Nouveau CIM
          </button>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6 flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center">
          <FileText className="w-12 h-12 text-red-400/30 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white/60 mb-2">Documents CIM</h2>
          <p className="text-sm text-white/40 mb-4">Génération et gestion des lettres de voiture ferroviaires</p>
          <button className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors">
            Créer un document
          </button>
        </div>
      </motion.div>
    </DeckLayout>
  );
}
