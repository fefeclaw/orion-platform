import { NextResponse } from "next/server";
import { auth } from "@/auth";

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

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { vesselId, cargos }: { vesselId: string; cargos: Cargo[] } = await request.json();

    // Simulation d'optimisation de chargement (algorithme simple)
    // En production: solver GLPK ou OR-Tools
    
    const sortedByPriority = [...cargos].sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });

    const capacities: Record<string, { weight: number; teu: number; name: string }> = {
      "v1": { weight: 52000, teu: 4000, name: "MSC Abidjan" },
      "v2": { weight: 66000, teu: 5500, name: "CMA CGM Ivory Coast" },
      "v3": { weight: 38000, teu: 2800, name: "Pacific Carrier" },
      "v6": { weight: 71000, teu: 6000, name: "Hapag-Lloyd Abidjan" },
    };

    const vessel = capacities[vesselId] || { weight: 50000, teu: 3500, name: "Navire standard" };

    let currentWeight = 0;
    let selectedCargos: Cargo[] = [];

    for (const cargo of sortedByPriority) {
      if (currentWeight + cargo.weight <= vessel.weight) {
        selectedCargos.push(cargo);
        currentWeight += cargo.weight;
      }
    }

    const totalVolume = selectedCargos.reduce((acc, c) => acc + c.volume, 0);
    const utilization = (currentWeight / vessel.weight) * 100;
    
    // Calculs économiques
    const costPerTon = 15; // $/ton
    const estimatedCost = currentWeight * costPerTon;
    const co2Saving = selectedCargos.length > 5 ? 12.5 : 0; // tonnes CO2 évité
    const timeSaved = Math.round(selectedCargos.length * 0.5); // heures

    const loadPlan: LoadPlan = {
      vesselId,
      vesselName: vessel.name,
      capacity: { weight: vessel.weight, teu: vessel.teu },
      cargos: selectedCargos,
      optimizedSequence: selectedCargos.map((c) => c.id),
      totalWeight: currentWeight,
      totalVolume,
      utilization,
      estimatedCost,
      co2Saving,
      timeSaved,
    };

    return NextResponse.json({ 
      success: true, 
      plan: loadPlan,
      rejected: cargos.filter((c) => !selectedCargos.find((s) => s.id === c.id)),
    });
  } catch (error) {
    console.error("Load simulation error:", error);
    return NextResponse.json({ error: "Simulation failed" }, { status: 500 });
  }
}
