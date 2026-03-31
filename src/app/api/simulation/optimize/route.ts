import { NextResponse } from "next/server";
import { auth } from "@/auth";

interface OptimizationResult {
  scenario: "current" | "optimized" | "aggressive";
  totalCost: number;
  transitTime: number;
  co2Emissions: number;
  reliability: number;
  savings: {
    cost: number;
    time: number;
    co2: number;
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const scenarios: OptimizationResult[] = [
      {
        scenario: "current",
        totalCost: 84750,
        transitTime: 14.5 * 24 * 60, // minutes
        co2Emissions: 125.4,
        reliability: 0.78,
        savings: { cost: 0, time: 0, co2: 0 },
      },
      {
        scenario: "optimized",
        totalCost: 74200,
        transitTime: 12.8 * 24 * 60,
        co2Emissions: 108.2,
        reliability: 0.89,
        savings: { cost: 10550, time: 40.8, co2: 17.2 },
      },
      {
        scenario: "aggressive",
        totalCost: 69100,
        transitTime: 11.2 * 24 * 60,
        co2Emissions: 94.8,
        reliability: 0.82,
        savings: { cost: 15650, time: 79.2, co2: 30.6 },
      },
    ];

    return NextResponse.json({ 
      scenarios,
      recommendation: "optimized",
      reasoning: "Meilleur équilibre coût/fiabilité avec économies significatives",
    });
  } catch (error) {
    console.error("Optimization error:", error);
    return NextResponse.json({ error: "Optimization failed" }, { status: 500 });
  }
}
