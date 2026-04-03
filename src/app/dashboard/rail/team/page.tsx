"use client";

import { motion } from "framer-motion";
import { Users, UserPlus } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

export default function RailTeamPage() {
  return (
    <DeckLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Équipe</h1>
            <p className="text-sm text-white/40">Gestion utilisateurs rail</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-300 text-sm">
            <UserPlus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      }
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="w-12 h-12 text-red-400/30 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white/60">Gestion d'équipe</h2>
          <p className="text-sm text-white/40">5 membres actifs</p>
        </div>
      </motion.div>
    </DeckLayout>
  );
}
