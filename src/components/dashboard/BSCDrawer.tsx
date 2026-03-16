"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { X, Sparkles, FileText, Send, CheckCircle } from "lucide-react";
import ShipTimeline from "./ShipTimeline";

interface BSCDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BSCForm {
  // Auto-filled
  importateur: string;
  matricule: string;
  portDecharge: string;
  // User fills
  nomNavire: string;
  portChargement: string;
  numeroConnaissement: string;
  description: string;
  poids: string;
  valeur: string;
  regime: string;
}

const REGIMES = [
  "Mise à la consommation",
  "Transit",
  "Entrepôt sous douane",
  "Admission temporaire",
  "Réexportation",
];

const PORTS = [
  "Rotterdam (NL)", "Le Havre (FR)", "Marseille (FR)",
  "Casablanca (MA)", "Dakar (SN)", "Lagos (NG)",
  "Shanghai (CN)", "Singapour (SG)", "Dubai (AE)",
];

const inputCls = "w-full bg-[#060d1a]/80 border border-white/8 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50 transition-colors placeholder:text-white/20";
const labelCls = "block text-[10px] text-white/30 mb-1.5 uppercase tracking-widest";

export default function BSCDrawer({ isOpen, onClose }: BSCDrawerProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState<"form" | "timeline" | "success">("form");
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [dossierNum] = useState(`BSC-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`);

  const [form, setForm] = useState<BSCForm>({
    importateur: "",
    matricule: "",
    portDecharge: "Port Autonome d'Abidjan — CÔTE D'IVOIRE",
    nomNavire: "",
    portChargement: "",
    numeroConnaissement: "",
    description: "",
    poids: "",
    valeur: "",
    regime: "Mise à la consommation",
  });

  // Magic Fill — pré-remplissage avec les données session
  const handleMagicFill = async () => {
    setIsMagicFilling(true);
    await new Promise((r) => setTimeout(r, 800));

    const userName = session?.user?.name ?? "Orion Group";
    const userEmail = session?.user?.email ?? "";
    const matricule = userEmail.split("@")[0]?.toUpperCase() ?? "MAT-0001";

    setForm((prev) => ({
      ...prev,
      importateur: userName,
      matricule: matricule.includes("MAT") ? matricule : "MAT-0001",
      nomNavire: "MSC Abidjan",
      portChargement: "Rotterdam (NL)",
      numeroConnaissement: `BL-${Date.now().toString().slice(-8)}`,
      description: "Équipements industriels — marchandises générales",
      poids: "24.5",
      valeur: "48 500 000",
      regime: "Mise à la consommation",
    }));
    setIsMagicFilling(false);
  };

  const set = (k: keyof BSCForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("timeline");
    await new Promise((r) => setTimeout(r, 3500));
    setStep("success");
  };

  const handleClose = () => {
    setStep("form");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full z-50 w-full max-w-lg flex flex-col"
            style={{
              background: "linear-gradient(135deg, rgba(8,16,32,0.92), rgba(4,10,20,0.96)) padding-box, linear-gradient(135deg, rgba(56,189,248,0.15), rgba(56,189,248,0.04)) border-box",
              border: "1px solid transparent",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#38bdf8]/10">
                  <FileText size={15} className="text-[#38bdf8]" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Déclaration BSC</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
                    Bordereau de Suivi des Cargaisons — DGD
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="text-white/20 hover:text-white/60 transition-colors">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Dossier number */}
            <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-white/25 uppercase tracking-widest">N° dossier</span>
              <span className="text-xs font-mono text-[#38bdf8]/70">{dossierNum}</span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait">
                {step === "form" && (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {/* Magic Fill button */}
                    <motion.button
                      type="button"
                      onClick={handleMagicFill}
                      disabled={isMagicFilling}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mb-6 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#38bdf8]/25 text-[#38bdf8] text-sm font-medium transition-all hover:bg-[#38bdf8]/8 disabled:opacity-50"
                    >
                      {isMagicFilling ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#38bdf8]/30 border-t-[#38bdf8] rounded-full animate-spin" />
                          <span>Récupération des données…</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} aria-hidden="true" />
                          <span>Magic Fill — Pré-remplir depuis votre profil</span>
                        </>
                      )}
                    </motion.button>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Section 1: Identité */}
                      <p className="text-[10px] uppercase tracking-widest text-[#38bdf8]/60 pb-1 border-b border-white/5">
                        Informations importateur
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Raison sociale</label>
                          <input value={form.importateur} onChange={set("importateur")} className={inputCls} placeholder="Nom compagnie" required />
                        </div>
                        <div>
                          <label className={labelCls}>Matricule douane</label>
                          <input value={form.matricule} onChange={set("matricule")} className={inputCls} placeholder="MAT-XXXX" required />
                        </div>
                      </div>

                      {/* Section 2: Transport */}
                      <p className="text-[10px] uppercase tracking-widest text-[#38bdf8]/60 pb-1 border-b border-white/5 pt-2">
                        Transport maritime
                      </p>
                      <div>
                        <label className={labelCls}>Nom du navire</label>
                        <input value={form.nomNavire} onChange={set("nomNavire")} className={inputCls} placeholder="MSC / CMA CGM / …" required />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Port de chargement</label>
                          <select value={form.portChargement} onChange={set("portChargement")} className={inputCls} required>
                            <option value="">Sélectionner</option>
                            {PORTS.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Port de décharge</label>
                          <input value={form.portDecharge} className={`${inputCls} opacity-50 cursor-not-allowed`} readOnly />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>N° Connaissement (Bill of Lading)</label>
                        <input value={form.numeroConnaissement} onChange={set("numeroConnaissement")} className={inputCls} placeholder="BL-XXXXXXXX" required />
                      </div>

                      {/* Section 3: Marchandise */}
                      <p className="text-[10px] uppercase tracking-widest text-[#38bdf8]/60 pb-1 border-b border-white/5 pt-2">
                        Désignation de la marchandise
                      </p>
                      <div>
                        <label className={labelCls}>Description</label>
                        <textarea value={form.description} onChange={set("description")} className={`${inputCls} resize-none`} rows={2} placeholder="Nature des marchandises…" required />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Poids brut (tonnes)</label>
                          <input type="number" value={form.poids} onChange={set("poids")} className={inputCls} placeholder="0.00" required />
                        </div>
                        <div>
                          <label className={labelCls}>Valeur (FCFA)</label>
                          <input value={form.valeur} onChange={set("valeur")} className={inputCls} placeholder="0" required />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Régime douanier</label>
                        <select value={form.regime} onChange={set("regime")} className={inputCls} required>
                          {REGIMES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>

                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-black font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#38bdf8]/20 transition-all"
                      >
                        <Send size={15} aria-hidden="true" />
                        Soumettre la déclaration BSC
                      </motion.button>
                    </form>
                  </motion.div>
                )}

                {step === "timeline" && (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-8 py-8"
                  >
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-widest text-white/30 mb-1">Traitement en cours</p>
                      <p className="text-lg font-semibold text-white">{form.nomNavire || "Navire"}</p>
                      <p className="text-xs text-white/40 mt-0.5">{form.portChargement} → Port d'Abidjan</p>
                    </div>

                    <div className="w-full">
                      <ShipTimeline
                        departurePort={form.portChargement || "Port départ"}
                        status="approaching"
                        progress={72}
                      />
                    </div>

                    <div className="w-full space-y-3">
                      {[
                        { label: "Réception déclaration", done: true, delay: 0.2 },
                        { label: "Vérification données importateur", done: true, delay: 0.6 },
                        { label: "Transmission DGD — Direction Générale des Douanes", done: true, delay: 1.0 },
                        { label: "Attribution numéro BSC", done: false, delay: 1.4 },
                        { label: "Confirmation finale", done: false, delay: 1.8 },
                      ].map((item) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: item.delay }}
                          className="flex items-center gap-3"
                        >
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            item.done ? "bg-[#34d399]/20 border border-[#34d399]/50" : "border border-white/15"
                          }`}>
                            {item.done && <div className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />}
                          </div>
                          <span className={`text-xs ${item.done ? "text-white/60" : "text-white/20"}`}>
                            {item.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-6 py-12 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="w-16 h-16 rounded-full bg-[#34d399]/10 border border-[#34d399]/30 flex items-center justify-center"
                    >
                      <CheckCircle size={32} className="text-[#34d399]" aria-hidden="true" />
                    </motion.div>
                    <div>
                      <p className="text-lg font-semibold text-white mb-1">Déclaration soumise</p>
                      <p className="text-xs text-white/40">Votre BSC a été transmis à la DGD</p>
                    </div>
                    <div className="glass rounded-xl px-6 py-4 w-full">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Numéro BSC attribué</p>
                      <p className="text-base font-mono font-semibold text-[#38bdf8]">{dossierNum}</p>
                    </div>
                    <ShipTimeline
                      departurePort={form.portChargement || "Port départ"}
                      status="approaching"
                      progress={72}
                    />
                    <p className="text-xs text-white/25">
                      Conservez ce numéro pour le suivi de votre dossier douanier
                    </p>
                    <button
                      onClick={handleClose}
                      className="px-6 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
                    >
                      Fermer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
