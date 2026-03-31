/**
 * Route API : GET /api/maritime/ais
 * Données AIS temps réel des navires via MarineTraffic.
 * Protégée : plan Business uniquement (feature: ais_realtime).
 *
 * Si MARINETRAFFIC_API_KEY absent → mock réaliste avec navires Port d'Abidjan.
 */
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { withSubscription } from "@/middleware/withSubscription";
import { cacheGet, cacheSet } from "@/lib/cache";

interface AISVessel {
  mmsi: string;
  name: string;
  type: "container" | "tanker" | "bulk" | "roro" | "general";
  lat: number;
  lng: number;
  speed: number;
  course: number;
  status: "underway" | "at_anchor" | "moored" | "restricted";
  destination: string;
  eta: string;
  flag: string;
}

/** Mock réaliste — navires autour du Port d'Abidjan (lat ~5.29, lng ~-4.01) */
function buildMockAIS(): AISVessel[] {
  return [
    { mmsi: "636015000", name: "ABIDJAN EXPRESS",  type: "container", lat: 5.295, lng: -4.022, speed: 0.2,  course: 90,  status: "moored",     destination: "ABIDJAN",   eta: "2026-03-30", flag: "LR" },
    { mmsi: "636019872", name: "COTE D'IVOIRE",    type: "container", lat: 5.289, lng: -4.018, speed: 0.0,  course: 180, status: "at_anchor",  destination: "ABIDJAN",   eta: "2026-03-29", flag: "CI" },
    { mmsi: "574012345", name: "GULF STAR",        type: "tanker",    lat: 5.310, lng: -4.005, speed: 4.5,  course: 270, status: "underway",   destination: "TEMA",      eta: "2026-04-01", flag: "TG" },
    { mmsi: "636020011", name: "SAHEL CARGO",      type: "bulk",      lat: 5.301, lng: -4.031, speed: 0.0,  course: 0,   status: "moored",     destination: "ABIDJAN",   eta: "2026-03-31", flag: "CI" },
    { mmsi: "636017543", name: "AFRICA MERCHANT",  type: "roro",      lat: 5.278, lng: -4.009, speed: 7.2,  course: 315, status: "underway",   destination: "DAKAR",     eta: "2026-04-02", flag: "LR" },
    { mmsi: "657080123", name: "BOUAKE STAR",      type: "general",   lat: 5.266, lng: -3.995, speed: 11.4, course: 225, status: "underway",   destination: "ABIDJAN",   eta: "2026-03-30", flag: "CI" },
  ];
}

const CACHE_KEY = "ais:vessels";
const CACHE_TTL = 60; // secondes

async function getHandler(_req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.MARINETRAFFIC_API_KEY;
  const ts = new Date().toISOString();

  // Mode mock si clé absente
  if (!apiKey) {
    console.info("[ais] MARINETRAFFIC_API_KEY absente → mock réaliste activé");
    const mock = buildMockAIS();
    cacheSet(CACHE_KEY, mock, CACHE_TTL);
    return NextResponse.json({ vessels: mock, source: "mock", timestamp: ts });
  }

  // Tentative MarineTraffic → fallback VesselFinder → fallback cache → fallback mock
  try {
    const url = `https://services.marinetraffic.com/api/getvessel/v:3/${apiKey}/protocol:json`;
    const res = await fetch(url, { cache: "no-store" });

    if (res.ok) {
      const data = await res.json() as { DATA?: AISVessel[] };
      const vessels = data.DATA ?? [];
      cacheSet(CACHE_KEY, vessels, CACHE_TTL);
      return NextResponse.json({ vessels, source: "marinetraffic", timestamp: ts });
    }

    console.warn(`[ais] MarineTraffic ${res.status} → essai cache/mock`);
  } catch (err) {
    console.warn("[ais] MarineTraffic indisponible:", err);
  }

  // Dernières positions connues depuis le cache SQLite
  const cached = cacheGet<AISVessel[]>(CACHE_KEY);
  if (cached) {
    return NextResponse.json({ vessels: cached, source: "cache", timestamp: ts });
  }

  // Dernier recours : mock réaliste
  return NextResponse.json({ vessels: buildMockAIS(), source: "mock", timestamp: ts });
}

export const GET = withSubscription(getHandler, { feature: "ais_realtime" });
