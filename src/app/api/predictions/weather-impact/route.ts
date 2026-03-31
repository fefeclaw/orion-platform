import { NextResponse } from "next/server";
import { auth } from "@/auth";

interface WeatherImpact {
  condition: string;
  severity: "light" | "moderate" | "severe";
  affectedVessels: number;
  etaMultiplier: number;
  duration: string;
  recommendation: string;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const impacts: WeatherImpact[] = [
      {
        condition: "Orage tropical",
        severity: "severe",
        affectedVessels: 3,
        etaMultiplier: 1.4,
        duration: "18h",
        recommendation: "Déviation recommandée vers Port Tema",
      },
      {
        condition: "Brume matinale",
        severity: "light",
        affectedVessels: 2,
        etaMultiplier: 1.1,
        duration: "4h",
        recommendation: "Réduction vitesse 10%, radar actif",
      },
      {
        condition: "Courant fort Golfe",
        severity: "moderate",
        affectedVessels: 7,
        etaMultiplier: 1.15,
        duration: "48h",
        recommendation: "Planification retardée de 6h conseillée",
      },
    ];

    return NextResponse.json({ 
      impacts,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Weather impact error:", error);
    return NextResponse.json({ error: "Prediction failed" }, { status: 500 });
  }
}
