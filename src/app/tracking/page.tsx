"use client";

import { useState } from "react";

interface TrackingStep {
  date: string;
  location: string;
  status: string;
  description: string;
  completed: boolean;
  active: boolean;
}

interface TrackingResult {
  reference: string;
  mode: "maritime" | "rail" | "road" | "air" | "intermodal";
  status: "on_track" | "delayed" | "delivered" | "critical";
  origin: string;
  destination: string;
  eta: string;
  carrier: string;
  cargo: string;
  steps: TrackingStep[];
}

const MOCK_DATA: Record<string, TrackingResult> = {
  "ORN-RD-2026-0042": {
    reference: "ORN-RD-2026-0042",
    mode: "road",
    status: "on_track",
    origin: "Abidjan (Port Bouët)",
    destination: "Ouagadougou",
    eta: "2026-04-01",
    carrier: "SahelRoute Logistics",
    cargo: "Équipements industriels — 12T",
    steps: [
      { date: "2026-03-28 08:00", location: "Port d'Abidjan", status: "Départ confirmé", description: "Chargement validé, documents douaniers OK", completed: true, active: false },
      { date: "2026-03-29 14:30", location: "Frontière Côte d'Ivoire / Burkina Faso", status: "Passage douanier", description: "Contrôle TRIE passé, tampon frontière apposé", completed: true, active: false },
      { date: "2026-03-30 09:15", location: "Bobo-Dioulasso", status: "En transit", description: "Escale technique — chauffeur en repos réglementaire", completed: false, active: true },
      { date: "2026-04-01 16:00", location: "Ouagadougou", status: "Livraison prévue", description: "Dépôt central Zone Industrielle", completed: false, active: false },
    ],
  },
  "ORN-MT-2026-0018": {
    reference: "ORN-MT-2026-0018",
    mode: "maritime",
    status: "delayed",
    origin: "Port de Dakar",
    destination: "Port d'Abidjan",
    eta: "2026-04-03",
    carrier: "Africa Merchant Lines",
    cargo: "Conteneur 40HC — Matières premières",
    steps: [
      { date: "2026-03-25 06:00", location: "Port de Dakar", status: "Départ", description: "Appareillage confirmé", completed: true, active: false },
      { date: "2026-03-28 00:00", location: "Océan Atlantique", status: "En mer — Retard météo", description: "Tempête équatoriale — déviation de route +18h", completed: false, active: true },
      { date: "2026-04-03 10:00", location: "Port d'Abidjan", status: "Arrivée estimée (révisée)", description: "ETA recalculé suite conditions météo", completed: false, active: false },
    ],
  },
  "ORN-AR-2026-0091": {
    reference: "ORN-AR-2026-0091",
    mode: "air",
    status: "delivered",
    origin: "Aéroport Charles de Gaulle (CDG)",
    destination: "Aéroport FHB Abidjan (ABJ)",
    eta: "2026-03-29",
    carrier: "Air France Cargo",
    cargo: "Fret pharmaceutique — 340kg — Température contrôlée",
    steps: [
      { date: "2026-03-29 07:10", location: "Paris CDG", status: "Départ", description: "Chargement validé — chaîne du froid maintenue", completed: true, active: false },
      { date: "2026-03-29 14:45", location: "Aéroport FHB Abidjan", status: "Atterrissage", description: "Vol AF 702 — atterrissage nominal", completed: true, active: false },
      { date: "2026-03-29 17:30", location: "Douanes ABJ", status: "Dédouanement EXA", description: "Déclaration validée, droits acquittés", completed: true, active: false },
      { date: "2026-03-29 19:00", location: "Entrepôt frigorifique ABJ", status: "✓ Livré", description: "Remise effectuée — signature destinataire obtenue", completed: true, active: false },
    ],
  },
};

const MODE_LABELS: Record<string, string> = {
  maritime: "⚓ Maritime",
  rail: "🚂 Ferroviaire",
  road: "🚛 Routier",
  air: "✈️ Aérien",
  intermodal: "🔄 Intermodal",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  on_track:  { label: "En transit",  color: "text-cyan-400",  bg: "bg-cyan-400/10 border-cyan-400/30" },
  delayed:   { label: "Retardé",     color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30" },
  delivered: { label: "Livré",       color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
  critical:  { label: "Critique",    color: "text-red-400",   bg: "bg-red-400/10 border-red-400/30" },
};

export default function TrackingPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setResult(null);
    setTimeout(() => {
      const found = MOCK_DATA[query.trim().toUpperCase()];
      if (found) {
        setResult(found);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }, 600);
  }

  const statusCfg = result ? STATUS_CONFIG[result.status] : null;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0d1220]/80 backdrop-blur-sm px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
<<<<<<< HEAD
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#38bdf8] flex items-center justify-center">
=======
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#22d3ee] flex items-center justify-center">
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
            <span className="text-[#0a0e1a] font-black text-xs">O</span>
          </div>
          <span className="font-bold text-lg tracking-tight">ORION</span>
          <span className="text-white/30 text-sm hidden sm:inline">Unified Logistics</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <a href="/" className="text-white/50 hover:text-white text-sm transition-colors">
            Accueil
          </a>
          <a
            href="/auth/signin"
<<<<<<< HEAD
            className="px-3 py-1.5 rounded-lg border border-[#D4AF37]/40 text-[#D4AF37] text-sm hover:bg-[#D4AF37]/10 transition-colors"
=======
            className="px-3 py-1.5 rounded-lg border border-[#F59E0B]/40 text-[#F59E0B] text-sm hover:bg-[#F59E0B]/10 transition-colors"
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
          >
            Espace Pro
          </a>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-2xl mx-auto px-6 pt-16 pb-8 text-center">
<<<<<<< HEAD
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#38bdf8]/30 text-[#38bdf8] text-xs mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
=======
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#22d3ee]/30 text-[#22d3ee] text-xs mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-pulse" />
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
          Suivi en temps réel
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
          Suivez votre{" "}
<<<<<<< HEAD
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#38bdf8]">
=======
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] to-[#22d3ee]">
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
            expédition
          </span>
        </h1>
        <p className="text-white/50 text-base mb-10">
          Entrez votre numéro de référence ORION pour obtenir le statut en temps réel.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ORN-RD-2026-0042"
<<<<<<< HEAD
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-[#38bdf8]/50 focus:bg-white/8 transition-all text-sm font-mono"
=======
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:border-[#22d3ee]/50 focus:bg-white/8 transition-all text-sm font-mono"
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
<<<<<<< HEAD
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#f0cc5c] text-[#0a0e1a] font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
=======
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#f0cc5c] text-[#0a0e1a] font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
          >
            {loading ? "…" : "Suivre"}
          </button>
        </form>

        {/* Exemples */}
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          {Object.keys(MOCK_DATA).map((ref) => (
            <button
              key={ref}
              onClick={() => setQuery(ref)}
              className="px-2.5 py-1 rounded-md bg-white/5 border border-white/8 text-white/40 text-xs font-mono hover:text-white/70 hover:border-white/20 transition-all"
            >
              {ref}
            </button>
          ))}
        </div>
      </div>

      {/* Résultat */}
      {notFound && (
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-5 text-center">
            <p className="text-red-400 font-semibold mb-1">Référence introuvable</p>
            <p className="text-white/40 text-sm">Vérifiez le format : ORN-[MODE]-[ANNÉE]-[NUMÉRO]</p>
          </div>
        </div>
      )}

      {result && statusCfg && (
        <div className="max-w-2xl mx-auto px-6 pb-16">
          {/* Carte principale */}
          <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/40 text-xs font-mono mb-1">{result.reference}</p>
                <p className="font-bold text-lg">{result.cargo}</p>
              </div>
              <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-white/35 text-xs mb-0.5">Mode</p>
                <p className="font-medium">{MODE_LABELS[result.mode]}</p>
              </div>
              <div>
                <p className="text-white/35 text-xs mb-0.5">Transporteur</p>
                <p className="font-medium">{result.carrier}</p>
              </div>
              <div>
                <p className="text-white/35 text-xs mb-0.5">Origine</p>
                <p className="font-medium">{result.origin}</p>
              </div>
              <div>
                <p className="text-white/35 text-xs mb-0.5">Destination</p>
                <p className="font-medium">{result.destination}</p>
              </div>
            </div>

            <div className={`rounded-xl border px-4 py-2.5 flex items-center justify-between ${statusCfg.bg}`}>
              <span className="text-white/60 text-xs">ETA</span>
              <span className={`font-bold text-sm ${statusCfg.color}`}>{result.eta}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-6">
            <h2 className="font-semibold text-sm text-white/60 uppercase tracking-widest mb-5">
              Historique de suivi
            </h2>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-white/8" />
              <div className="space-y-5">
                {result.steps.map((step, i) => (
                  <div key={i} className="pl-9 relative">
                    <div
                      className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 transition-all ${
                        step.completed
                          ? "bg-emerald-400 border-emerald-400"
                          : step.active
<<<<<<< HEAD
                          ? "bg-[#38bdf8] border-[#38bdf8] animate-pulse shadow-[0_0_8px_#38bdf8]"
=======
                          ? "bg-[#22d3ee] border-[#22d3ee] animate-pulse shadow-[0_0_8px_#22d3ee]"
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
                          : "bg-transparent border-white/20"
                      }`}
                    />
                    <div className={`${step.active ? "opacity-100" : step.completed ? "opacity-80" : "opacity-40"}`}>
                      <p className="font-semibold text-sm mb-0.5">{step.status}</p>
                      <p className="text-white/50 text-xs mb-0.5">{step.location}</p>
                      <p className="text-white/35 text-xs">{step.description}</p>
                      <p className="text-white/25 text-xs mt-1 font-mono">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-white/25 text-xs">
        ORION Unified Logistics · Port d'Abidjan ·{" "}
<<<<<<< HEAD
        <a href="/pricing" className="hover:text-[#D4AF37] transition-colors">
=======
        <a href="/pricing" className="hover:text-[#F59E0B] transition-colors">
>>>>>>> fab4604 (design: refonte palette premium "Deep Ocean × African Amber")
          Accès professionnel
        </a>
      </footer>
    </div>
  );
}
