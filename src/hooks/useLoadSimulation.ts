"use client";

import { useState, useCallback } from "react";

interface Cargo {
  id: string;
  name: string;
  weight: number;
  volume: number;
  type: "container" | "bulk" | "liquid" | "refrigerated";
  priority: "high" | "medium" | "low";
  destination: string;
}

interface LoadPlan {
  vesselId: string;
  vesselName: string;
  capacity: { weight: number; teu: number };
  cargos: Cargo[];
  optimizedSequence: string[];
  totalWeight: number;
  totalVolume: number;
  utilization: number;
  estimatedCost: number;
  co2Saving: number;
  timeSaved: number;
}

interface SimulationResult {
  plan: LoadPlan | null;
  rejected: Cargo[];
  loading: boolean;
  error: string | null;
}

export function useLoadSimulation() {
  const [result, setResult] = useState<SimulationResult>({
    plan: null,
    rejected: [],
    loading: false,
    error: null,
  });

  const simulate = useCallback(async (vesselId: string, cargos: Cargo[]) => {
    setResult({ plan: null, rejected: [], loading: true, error: null });

    try {
      const response = await fetch("/api/simulation/load-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vesselId, cargos }),
      });

      if (!response.ok) {
        throw new Error("Simulation failed");
      }

      const data = await response.json();
      setResult({
        plan: data.plan,
        rejected: data.rejected || [],
        loading: false,
        error: null,
      });
      return data;
    } catch (err) {
      setResult({
        plan: null,
        rejected: [],
        loading: false,
        error: err instanceof Error ? err.message : "Erreur de simulation",
      });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setResult({ plan: null, rejected: [], loading: false, error: null });
  }, []);

  return { ...result, simulate, reset };
}
