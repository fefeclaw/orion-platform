import { NextResponse } from "next/server";
import { auth } from "@/auth";

interface DelayPrediction {
  vesselId: string;
  vesselName: string;
  currentEta: string;
  predictedEta: string;
  delayHours: number;
  confidence: number;
  factors: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Mock predictions basées sur modèle ML simple
    // En production: appel à modèle TensorFlow.js ou API Python
    const predictions: DelayPrediction[] = [
      {
        vesselId: "v2",
        vesselName: "CMA CGM Ivory Coast",
        currentEta: "2026-03-31T08:00:00Z",
        predictedEta: "2026-03-31T14:30:00Z",
        delayHours: 6.5,
        confidence: 0.87,
        factors: ["Vent fort (>25kt)", "Congestion Port Abidjan 62%", "Retard précédent port"],
        riskLevel: "high",
      },
      {
        vesselId: "v6",
        vesselName: "Hapag-Lloyd Abidjan",
        currentEta: "2026-04-01T02:00:00Z",
        predictedEta: "2026-04-01T05:15:00Z",
        delayHours: 3.25,
        confidence: 0.72,
        factors: ["Courants défavorables", "Trafic dense zone"],
        riskLevel: "medium",
      },
      {
        vesselId: "v5",
        vesselName: "Côte d'Ivoire Express",
        currentEta: "2026-03-31T05:00:00Z",
        predictedEta: "2026-03-31T05:45:00Z",
        delayHours: 0.75,
        confidence: 0.91,
        factors: ["Légère houle", "Conditions normales"],
        riskLevel: "low",
      },
    ];

    return NextResponse.json({ predictions, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json({ error: "Prediction failed" }, { status: 500 });
  }
}
