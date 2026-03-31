/**
 * Hook React pour le tracking conteneurs via Ship24.
 * Vérifie les droits d'accès (plan Standard ou Business) avant d'appeler l'API.
 * Si non autorisé → retourne { error: 'PLAN_REQUIRED' }.
 * Si SHIP24_API_KEY absent côté serveur → mock réaliste automatique.
 */
"use client";

import { useState, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Ship24Event {
  datetime: string;
  location: string;
  status: string;
  description: string;
}

export interface Ship24Result {
  trackingNumber: string;
  status: "in_transit" | "delivered" | "exception" | "pending";
  carrier: string;
  origin: string;
  destination: string;
  eta: string;
  events: Ship24Event[];
  source: "ship24" | "mock";
}

type TrackingError =
  | { type: "PLAN_REQUIRED";  required_plan: "standard" | "business"; upgrade_url: string }
  | { type: "QUOTA_EXCEEDED"; reset_at: string; upgrade_url: string }
  | { type: "NETWORK_ERROR";  message: string }
  | { type: "INVALID_INPUT";  message: string };

export interface UseShip24TrackingReturn {
  /** Lance une recherche de tracking */
  track: (trackingNumber: string) => Promise<void>;
  /** Résultat du tracking */
  result: Ship24Result | null;
  /** Erreur éventuelle (plan insuffisant, quota dépassé, réseau) */
  error: TrackingError | null;
  /** Chargement en cours */
  loading: boolean;
  /** Remet l'état à zéro */
  reset: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useShip24Tracking(): UseShip24TrackingReturn {
  const [result, setResult]   = useState<Ship24Result | null>(null);
  const [error, setError]     = useState<TrackingError | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  const track = useCallback(async (trackingNumber: string) => {
    const cleaned = trackingNumber.trim();
    if (!cleaned) {
      setError({ type: "INVALID_INPUT", message: "Numéro de tracking requis" });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tracking/ship24", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber: cleaned }),
      });

      // Gestion des erreurs d'accès retournées par withSubscription
      if (res.status === 401) {
        setError({ type: "PLAN_REQUIRED", required_plan: "standard", upgrade_url: "/pricing" });
        return;
      }

      if (res.status === 403) {
        const body = await res.json() as { required_plan?: "standard" | "business"; upgrade_url?: string };
        setError({
          type: "PLAN_REQUIRED",
          required_plan: body.required_plan ?? "standard",
          upgrade_url: body.upgrade_url ?? "/pricing",
        });
        return;
      }

      if (res.status === 429) {
        const body = await res.json() as { reset_at?: string; upgrade_url?: string };
        setError({
          type: "QUOTA_EXCEEDED",
          reset_at: body.reset_at ?? "1er du mois prochain",
          upgrade_url: body.upgrade_url ?? "/pricing",
        });
        return;
      }

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        setError({ type: "NETWORK_ERROR", message: body.error ?? `Erreur serveur ${res.status}` });
        return;
      }

      const data = await res.json() as Ship24Result;
      setResult(data);
    } catch (err) {
      setError({
        type: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Erreur réseau inconnue",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { track, result, error, loading, reset };
}
