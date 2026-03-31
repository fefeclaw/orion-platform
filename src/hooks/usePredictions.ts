"use client";

import { useState, useEffect, useCallback } from "react";

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

interface CongestionPrediction {
  hour: string;
  occupancy: number;
  vesselsArriving: number;
  vesselsAtBerth: number;
  riskLevel: "low" | "medium" | "high" | "critical";
}

interface WeatherImpact {
  condition: string;
  severity: "light" | "moderate" | "severe";
  affectedVessels: number;
  etaMultiplier: number;
  duration: string;
  recommendation: string;
}

interface PredictionsData {
  delays: DelayPrediction[];
  congestion: CongestionPrediction[];
  weather: WeatherImpact[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function usePredictions(refreshInterval = 300000) {
  const [data, setData] = useState<PredictionsData>({
    delays: [],
    congestion: [],
    weather: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchPredictions = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      const [delaysRes, congestionRes, weatherRes] = await Promise.all([
        fetch("/api/predictions/delays"),
        fetch("/api/predictions/congestion"),
        fetch("/api/predictions/weather-impact"),
      ]);

      const [delays, congestion, weather] = await Promise.all([
        delaysRes.ok ? delaysRes.json() : { predictions: [] },
        congestionRes.ok ? congestionRes.json() : { predictions: [] },
        weatherRes.ok ? weatherRes.json() : { impacts: [] },
      ]);

      setData({
        delays: delays.predictions || [],
        congestion: congestion.predictions || [],
        weather: weather.impacts || [],
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Erreur de chargement",
      }));
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPredictions, refreshInterval]);

  // Helper pour obtenir les alertes prioritaires
  const criticalAlerts = data.delays.filter((d) => d.riskLevel === "critical" || d.riskLevel === "high");
  
  // Helper pour prochain pic de congestion
  const nextPeak = data.congestion.find((c) => c.riskLevel === "critical" || c.riskLevel === "high");

  return {
    ...data,
    criticalAlerts,
    nextPeak,
    refresh: fetchPredictions,
  };
}
