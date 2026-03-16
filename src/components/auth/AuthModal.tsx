"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { AuthMode } from "@/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPillar?: string | null;
}

export default function AuthModal({ isOpen, onClose, selectedPillar }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("professional");
  const [formData, setFormData] = useState({ company: "", matricule: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      mode,
      email: formData.email,
      password: formData.password,
      company: formData.company,
      matricule: formData.matricule,
    });

    if (result?.ok) {
      onClose();
      router.push(`/dashboard/${selectedPillar ?? "maritime"}`);
    } else {
      setError("Identifiants incorrects. Vérifiez vos informations.");
      setIsLoading(false);
    }
  };

  const inputCls = (focus: string) =>
    `w-full bg-[#060d1a] border border-white/8 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[${focus}]/50 transition-colors placeholder:text-white/20`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass rounded-3xl p-8 w-full max-w-md mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white tracking-wide">Connexion</h2>
              <p className="text-xs text-white/30 mt-1 uppercase tracking-widest">
                Accès sécurisé — Orion Logistics
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-xl overflow-hidden mb-6 border border-white/8">
              <button
                type="button"
                onClick={() => setMode("professional")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  mode === "professional"
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#b8912e] text-black"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                Professionnel
              </button>
              <button
                type="button"
                onClick={() => setMode("user")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  mode === "user"
                    ? "bg-gradient-to-r from-[#00c9a7] to-[#00a88a] text-black"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                Utilisateur
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === "professional" ? (
                  <motion.div key="pro" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-white/30 mb-1.5 uppercase tracking-widest">Compagnie</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className={inputCls("#D4AF37")}
                        placeholder="Nom de la compagnie"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/30 mb-1.5 uppercase tracking-widest">Matricule</label>
                      <input
                        type="text"
                        value={formData.matricule}
                        onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                        className={inputCls("#D4AF37")}
                        placeholder="MAT-0001"
                        required
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="user" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                    <label className="block text-[10px] text-white/30 mb-1.5 uppercase tracking-widest">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputCls("#00c9a7")}
                      placeholder="vous@orion.ci"
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-[10px] text-white/30 mb-1.5 uppercase tracking-widest">Mot de passe</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={inputCls("#D4AF37")}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-red-400 bg-red-900/20 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}

              {/* Demo hint */}
              <p className="text-[10px] text-white/20 text-center">
                {mode === "professional"
                  ? "Demo: MAT-0001 · orion2024"
                  : "Demo: admin@orion.ci · orion2024"}
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  mode === "professional"
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#b8912e] text-black hover:shadow-lg hover:shadow-[#D4AF37]/20"
                    : "bg-gradient-to-r from-[#00c9a7] to-[#00a88a] text-black hover:shadow-lg hover:shadow-[#00c9a7]/20"
                } disabled:opacity-50`}
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  "Accéder au tableau de bord"
                )}
              </button>
            </form>

            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-white/20 hover:text-white/60 transition-colors text-lg leading-none"
              aria-label="Fermer"
            >
              ×
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
