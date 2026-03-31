"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Container, Weight, Clock, DollarSign, Leaf, TrendingUp,
  AlertTriangle, CheckCircle, RotateCcw, Play, Download
} from "lucide-react";
import { useLoadSimulation } from "@/hooks/useLoadSimulation";

interface Cargo {
  id: string;
  name: string;
  weight: number;
  volume: number;
  type: "container" | "bulk" | "liquid" | "refrigerated";
  priority: "high" | "medium" | "low";
  destination: string;
}

const MOCK_CARGOS: Cargo[] = [
  { id: "c1", name: "Conteneur Électronique", weight: 8500, volume: 25, type: "container", priority: "high", destination: "Abidjan" },
  { id: "c2", name: "Cacao Premium", weight: 12000, volume: 40, type: "bulk", priority: "high", destination: "Rotterdam" },
  { id: "c3", name: "Carburant", weight: 15000, volume: 35, type: "liquid", priority: "medium", destination: "Lagos" },
  { id: "c4", name: "Produits frais", weight: 5000, volume: 20, type: "refrigerated", priority: "high", destination: "Paris" },
  { id: "c5", name: "Textiles", weight: 6500, volume: 30, type: "container", priority: "low", destination: "Dakar" },
  { id: "c6", name: "Machinerie", weight: 22000, volume: 45, type: "bulk", priority: "medium", destination: "Casablanca" },
  { id: "c7", name: "Pharmaceutique", weight: 3500, volume: 12, type: "refrigerated", priority: "high", destination: "Genève" },
  { id: "c8", name: "Plastiques", weight: 9000, volume: 38, type: "container", priority: "low", destination: "Marseille" },
];

const VESSELS = [
  { id: "v1", name: "MSC Abidjan", capacity: "52,000T / 4,000 TEU" },
  { id: "v2", name: "CMA CGM Ivory Coast", capacity: "66,000T / 5,500 TEU" },
  { id: "v6", name: "Hapag-Lloyd Abidjan", capacity: "71,000T / 6,000 TEU" },
];

export function LoadSimulator() {
  const [selectedVessel, setSelectedVessel] = useState(VESSELS[0].id);
  const [selectedCargos, setSelectedCargos] = useState<Set<string>>(new Set(MOCK_CARGOS.map(c => c.id)));
  const { plan, rejected, loading, error, simulate, reset } = useLoadSimulation();

  const handleSimulate = () => {
    const cargosToSimulate = MOCK_CARGOS.filter(c => selectedCargos.has(c.id));
    simulate(selectedVessel, cargosToSimulate);
  };

  const toggleCargo = (id: string) => {
    const newSet = new Set(selectedCargos);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedCargos(newSet);
  };

  return (
    <div className="p-6 rounded-xl border border-white/10 bg-white/5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Container className="w-6 h-6 text-[#D4AF37]" />
            Simulateur de Chargement
          </h2>
          <p className="text-sm text-white/50 mt-1">
            Optimisez vos plans de chargement en quelques clics
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="p-2 rounded-lg border border-white/20 hover:bg-white/5 text-white/60"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={handleSimulate}
            disabled={loading || selectedCargos.size === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#f0cc5c] 
                       text-[#0a0e1a] font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>Chargement...</>
            ) : (
              <>
                <Play className="w-4 h-4" /
                Simuler
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Selection */}
        <div>
          <div className="mb-4">
            <label className="text-sm text-white/50 mb-2 block">Navire sélectionné</label>
            <select
              value={selectedVessel}
              onChange={(e) => setSelectedVessel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#D4AF37]"
            >
              {VESSELS.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#0a0e1a]">
                  {v.name} — {v.capacity}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/50">Cargos à charger ({selectedCargos.size})</span>
              <button
                onClick={() => setSelectedCargos(new Set(MOCK_CARGOS.map(c => c.id)))}
                className="text-xs text-sky-400 hover:underline"
              >
                Tout sélectionner
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {MOCK_CARGOS.map((cargo) => (
                <div
                  key={cargo.id}
                  onClick={() => toggleCargo(cargo.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCargos.has(cargo.id)
                      ? "border-[#D4AF37]/50 bg-[#D4AF37]/10"
                      : "border-white/10 bg-white/[0.03] opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCargos.has(cargo.id)}
                        onChange={() => {}}
                        className="w-4 h-4 accent-[#D4AF37]"
                      />
                      <span className="font-medium">{cargo.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      cargo.priority === "high" ? "bg-red-500/20 text-red-400" :
                      cargo.priority === "medium" ? "bg-amber-500/20 text-amber-400" :
                      "bg-slate-500/20 text-slate-400"
                    }`}>
                      {cargo.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
                    <span>🎯 {cargo.destination}</span>
                    <span>⚖️ {cargo.weight.toLocaleString()} kg</span>
                    <span>📦 {cargo.volume} m³</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div>
          <AnimatePresence mode="wait">
            {!plan && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/20 rounded-xl"
              >
                <Container className="w-16 h-16 text-white/20 mb-4" />
                <p className="text-white/40">
                  Cliquez sur "Simuler" pour analyser votre plan de chargement optimal
                </p>
              </motion.div>
            )}

            {plan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/50">Plan optimisé</p>
                      <p className="text-2xl font-bold">{plan.utilization.toFixed(1)}% capacité</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/50">{plan.cargos.length} cargos chargés</p>
                      <p className="text-lg font-semibold">{plan.totalWeight.toLocaleString()} kg</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-white/10 bg-white/[0.05]">
                    <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Coût estimé
                    </div>
                    <p className="text-lg font-bold">${plan.estimatedCost.toLocaleString()}</p>
                  </div>

                  <div className="p-3 rounded-lg border border-white/10 bg-white/[0.05]">
                    <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                      <Leaf className="w-4 h-4 text-green-400" />
                      CO₂ évité
                    </div>
                    <p className="text-lg font-bold">{plan.co2Saving} tonnes</p>
                  </div>

                  <div className="p-3 rounded-lg border border-white/10 bg-white/[0.05]">
                    <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                      <Clock className="w-4 h-4 text-sky-400" />
                      Temps gagné
                    </div>
                    <p className="text-lg font-bold">{plan.timeSaved}h</p>
                  </div>

                  <div className="p-3 rounded-lg border border-white/10 bg-white/[0.05]">
                    <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
                      <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                      Efficacité
                    </div>
                    <p className="text-lg font-bold">{plan.utilization > 85 ? "Excellent" : plan.utilization > 70 ? "Bon" : "Moyen"}</p>
                  </div>
                </div>

                {rejected.length > 0 && (
                  <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-amber-400">
                        {rejected.length} cargo{rejected.length > 1 ? "s" : ""} non chargé{rejected.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-white/50">
                      Capacité dépassée. Envisagez un navire plus grand ou un deuxième voyage.
                    </p>
                  </div>
                )}

                <button className="w-full py-2 rounded-lg border border-white/20 hover:bg-white/5 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Exporter le rapport PDF
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
