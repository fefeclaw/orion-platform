"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import WelcomeText from "@/components/animations/WelcomeText";
import PillarSelector from "@/components/home/PillarSelector";
import AuthModal from "@/components/auth/AuthModal";
import WorldMap from "@/components/map/WorldMap";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageSelector from "@/components/ui/LanguageSelector";
import type { Pillar } from "@/types";

export default function HomePage() {
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  // Clic sur un pilier → disparition des autres + modal connexion
  const handlePillarSelect = (pillar: Pillar) => {
    if (selectedPillar === pillar) {
      setSelectedPillar(null);
    } else {
      setSelectedPillar(pillar);
      setShowAuth(true);
    }
  };

  return (
    <SessionProvider>
    <main className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#05080f]">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#d4a843]/5 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-[#00c9a7]/4 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 md:px-16 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="flex items-center gap-3"
        >
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border border-[#d4a843]/40" />
            <div className="absolute inset-[3px] rounded-full border border-[#d4a843]/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#d4a843]" />
            </div>
          </div>
          <span className="text-sm font-light tracking-[0.2em] text-white/50 uppercase">
            Orion Logistics
          </span>
        </motion.div>

        {/* Header controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex items-center gap-3"
        >
          <LanguageSelector />
          <ThemeToggle />
        </motion.div>
      </header>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center w-full max-w-2xl"
        >
          <WelcomeText />
        </motion.div>

        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="w-px h-8 bg-gradient-to-b from-transparent via-[#d4a843]/30 to-transparent my-6"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <PillarSelector onSelect={handlePillarSelect} selectedPillar={selectedPillar} />
        </motion.div>

        {selectedPillar && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedPillar(null)}
            className="mt-6 text-xs text-white/20 hover:text-white/50 transition-colors tracking-widest uppercase"
          >
            ← Retour
          </motion.button>
        )}

        <motion.div
          className="w-full mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.2 }}
        >
          <WorldMap selectedPillar={selectedPillar} />
        </motion.div>
      </div>

      <footer className="relative z-10 text-center py-5 text-[10px] tracking-widest uppercase text-white/10">
        Orion Logistics &mdash; Afrique de l&apos;Ouest
      </footer>

      <AuthModal
        isOpen={showAuth}
        onClose={() => { setShowAuth(false); setSelectedPillar(null); }}
        selectedPillar={selectedPillar}
      />
    </main>
    </SessionProvider>
  );
}
