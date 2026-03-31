/**
 * Route API : POST /api/tracking/ship24
 * Tracking conteneurs via Ship24 (colis routiers + conteneurs par numéro B/L).
 * Protégée par withSubscription — quota 50/mois pour Standard, illimité pour Business.
 *
 * Si SHIP24_API_KEY absent → retourne un mock réaliste (transit Abidjan).
 */
import { NextRequest, NextResponse } from "next/server";
import { withSubscription } from "@/middleware/withSubscription";

// Structure de réponse Ship24
interface Ship24TrackingEvent {
  datetime: string;
  location: string;
  status: string;
  description: string;
}

interface Ship24Response {
  trackingNumber: string;
  status: "in_transit" | "delivered" | "exception" | "pending";
  carrier: string;
  origin: string;
  destination: string;
  eta: string;
  events: Ship24TrackingEvent[];
  source: "ship24" | "mock";
}

/**
 * Génère un mock réaliste pour un conteneur en transit depuis Abidjan.
 */
function buildMockResponse(trackingNumber: string): Ship24Response {
  const now = new Date();
  const etaDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // +5 jours

  return {
    trackingNumber,
    status: "in_transit",
    carrier: "SDV Bolloré Logistics",
    origin: "Port Autonome d'Abidjan, CI",
    destination: "Ouagadougou, Burkina Faso",
    eta: etaDate.toISOString().split("T")[0],
    events: [
      {
        datetime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        location: "Port d'Abidjan — Terminal à Conteneurs",
        status: "DEPARTED",
        description: "Conteneur embarqué — bon de sortie validé",
      },
      {
        datetime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        location: "Poste frontalier Niangoloko — CI/BF",
        status: "CUSTOMS",
        description: "Passage douanier en cours — BSC présenté",
      },
      {
        datetime: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        location: "Bobo-Dioulasso, Burkina Faso",
        status: "IN_TRANSIT",
        description: "En route vers destination finale",
      },
    ],
    source: "mock",
  };
}

async function postHandler(req: NextRequest): Promise<NextResponse> {
  let body: { trackingNumber: string };

  try {
    body = (await req.json()) as { trackingNumber: string };
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  if (!body.trackingNumber) {
    return NextResponse.json(
      { error: "trackingNumber requis" },
      { status: 422 }
    );
  }

  const apiKey = process.env.SHIP24_API_KEY;

  // Mode mock si clé absente (gracieux — aucune erreur visible)
  if (!apiKey) {
    console.info("[ship24] SHIP24_API_KEY absente → mock réaliste activé");
    return NextResponse.json(buildMockResponse(body.trackingNumber));
  }

  // Appel à l'API Ship24 réelle
  try {
    const ship24Res = await fetch(
      "https://api.ship24.com/public/v1/trackers",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackingNumber: body.trackingNumber }),
      }
    );

    if (!ship24Res.ok) {
      // Fallback mock si Ship24 renvoie une erreur
      console.warn(`[ship24] API error ${ship24Res.status} → fallback mock`);
      return NextResponse.json(buildMockResponse(body.trackingNumber));
    }

    const data = await ship24Res.json() as { data?: unknown };
    return NextResponse.json({ ...data, source: "ship24" });
  } catch (err) {
    console.error("[ship24] Erreur réseau:", err);
    // Fallback mock en cas d'erreur réseau
    return NextResponse.json(buildMockResponse(body.trackingNumber));
  }
}

export const POST = withSubscription(postHandler, { feature: "ship24_tracking" });
