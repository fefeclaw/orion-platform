"use client";

import { useState, useEffect, useCallback } from "react";
import { WeatherProvider } from "@/lib/weather";
import type { WeatherCondition, WeatherForecastDay } from "@/lib/weather";

interface UseWeatherResult {
  weather: WeatherCondition | null;
  forecast: WeatherForecastDay[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useWeather(lat: number, lon: number): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [forecast, setForecast] = useState<WeatherForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [current, days] = await Promise.all([
        WeatherProvider.getCurrent(lat, lon),
        WeatherProvider.getForecast7Days(lat, lon),
      ]);
      setWeather(current);
      setForecast(days);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetch();
    // Refresh every 10 min
    const id = setInterval(fetch, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetch]);

  return { weather, forecast, loading, error, refresh: fetch };
}
