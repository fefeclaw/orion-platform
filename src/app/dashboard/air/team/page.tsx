"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { DeckLayout } from "@/components/deck/DeckLayout";

export default function AirTeamPage() {
  return (
    <DeckLayout header={<div><h1 className="text-xl font-semibold text-white/90">Équipe</h1><p className="text-sm text-white/40">Gestion utilisateurs aérien</p></div>}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a1120] rounded-2xl border border-white/5 p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center"><Users className="w-12 h-12 text-violet-400/30 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white/60">Gestion d'équipe</h2><p className="text-sm text-white/40">Personnel cargo, handling</p></div>
      </motion.div>
    </DeckLayout>
  );
}
