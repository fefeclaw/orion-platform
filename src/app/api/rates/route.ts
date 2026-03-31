/**
 * GET /api/rates — Taux de change XOF (FCFA) en temps réel
 * Cache SQLite 30s pour éviter les appels répétés.
 * Fallback vers derniers taux connus si API indisponible.
 */
import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";

interface RatesPayload {
  EUR: number;
  USD: number;
  GBP: number;
  base: "XOF";
  source: "api" | "cache" | "fallback";
  timestamp: string;
}

/** Taux de référence BCEAO (fallback si API indisponible) */
const FALLBACK_RATES = { EUR: 655.957, USD: 609.0, GBP: 770.0 };
const CACHE_KEY = "rates:xof";
const CACHE_TTL = 30;

export async function GET(): Promise<NextResponse> {
  const ts = new Date().toISOString();

  // 1. Retourner depuis cache si dispo
  const cached = cacheGet<RatesPayload>(CACHE_KEY);
  if (cached) {
    return NextResponse.json({ ...cached, source: "cache", timestamp: ts });
  }

  // 2. Appel API open.er-api.com (gratuit, no-auth)
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/XOF", {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json() as { rates?: Record<string, number> };
      const rates = data.rates ?? {};
      const payload: RatesPayload = {
        EUR: rates["EUR"] ? parseFloat((1 / rates["EUR"]).toFixed(3)) : FALLBACK_RATES.EUR,
        USD: rates["USD"] ? parseFloat((1 / rates["USD"]).toFixed(3)) : FALLBACK_RATES.USD,
        GBP: rates["GBP"] ? parseFloat((1 / rates["GBP"]).toFixed(3)) : FALLBACK_RATES.GBP,
        base: "XOF",
        source: "api",
        timestamp: ts,
      };
      cacheSet(CACHE_KEY, payload, CACHE_TTL);
      return NextResponse.json(payload);
    }
  } catch {
    // API indisponible — utiliser fallback
  }

  // 3. Fallback taux BCEAO fixes
  return NextResponse.json({
    ...FALLBACK_RATES,
    base: "XOF",
    source: "fallback",
    timestamp: ts,
  } satisfies RatesPayload);
}
