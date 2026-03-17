/**
 * WeatherProvider — Orion Logistics
 * Uses OpenWeather API when NEXT_PUBLIC_OPENWEATHER_API_KEY is set.
 * Falls back to realistic West Africa mock data for demo mode.
 */

import { WeatherImpactConfig, WeatherThresholds, buildWeatherAlert } from "../../config/weather";
import type { WeatherType, RiskLevel } from "../../config/weather";

export interface WeatherCondition {
  type: WeatherType;
  description: string;
  temp: number;        // Celsius
  humidity: number;   // %
  windSpeed: number;  // m/s
  visibility: number; // meters
  waveHeight?: number; // meters (maritime only, from separate API or estimated)
  lat: number;
  lon: number;
  icon: string;       // emoji icon
  timestamp: Date;
  source: "live" | "mock";
}

export interface WeatherForecastDay {
  date: Date;
  type: WeatherType;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
}

export interface WeatherImpact {
  delayFactor: number;
  riskLevel: RiskLevel;
  alert: string | null;
  adjustedETA?: string;
}

// ─── Mock profiles per region ──────────────────────────────────────
const WEST_AFRICA_PROFILES: Record<string, WeatherType[]> = {
  abidjan:      ["CLEAR", "CLOUDS", "RAIN", "HEAVY_RAIN"],
  ouagadougou:  ["CLEAR", "CLOUDS", "SAND", "THUNDERSTORM"],
  dakar:        ["CLEAR", "CLOUDS", "RAIN", "SAND"],
  lagos:        ["CLEAR", "CLOUDS", "HEAVY_RAIN", "THUNDERSTORM"],
  casablanca:   ["CLEAR", "CLOUDS", "RAIN", "FOG"],
  atlantic:     ["CLEAR", "CLOUDS", "RAIN", "THUNDERSTORM"],
  bamako:       ["CLEAR", "SAND", "THUNDERSTORM", "CLOUDS"],
};

function regionFromCoords(lat: number, lon: number): string {
  if (lat < 6 && lon < -3)  return "abidjan";
  if (lat > 12 && lon < -1) return "ouagadougou";
  if (lat > 14 && lon < -15) return "dakar";
  if (lat > 6 && lon > 2)   return "lagos";
  if (lat > 33)              return "casablanca";
  if (lat > 12 && lon < -5) return "bamako";
  return "atlantic";
}

const ICONS: Record<WeatherType, string> = {
  CLEAR: "☀️",
  CLOUDS: "⛅",
  RAIN: "🌧️",
  HEAVY_RAIN: "⛈️",
  THUNDERSTORM: "🌩️",
  FOG: "🌫️",
  SAND: "🌪️",
};

const DESCRIPTIONS: Record<WeatherType, string> = {
  CLEAR: "Ciel dégagé",
  CLOUDS: "Nuageux",
  RAIN: "Pluie modérée",
  HEAVY_RAIN: "Fortes pluies",
  THUNDERSTORM: "Orage violent",
  FOG: "Brouillard dense",
  SAND: "Tempête de sable (Harmattan)",
};

function mockWeather(lat: number, lon: number): WeatherCondition {
  const region = regionFromCoords(lat, lon);
  const profiles = WEST_AFRICA_PROFILES[region] ?? WEST_AFRICA_PROFILES.atlantic;
  // Deterministic-ish: use lat+lon to pick a weather type (consistent per session)
  const seed = Math.abs(Math.round((lat * 100 + lon * 10) % profiles.length));
  const type = profiles[Math.floor(seed) % profiles.length];

  // Random but realistic values for West Africa
  const temp = type === "SAND" ? 38 + Math.random() * 6 : 24 + Math.random() * 12;
  const visibility = type === "FOG" ? 200 + Math.random() * 300
    : type === "SAND" ? 400 + Math.random() * 400
    : type === "THUNDERSTORM" ? 1000 + Math.random() * 2000
    : 8000 + Math.random() * 4000;
  const windSpeed = type === "THUNDERSTORM" ? 18 + Math.random() * 12
    : type === "SAND" ? 12 + Math.random() * 10
    : 3 + Math.random() * 8;
  const waveHeight = (lat > 0 && lat < 10 && lon < -2)
    ? type === "THUNDERSTORM" ? 3.5 + Math.random() * 2
    : type === "HEAVY_RAIN" ? 2 + Math.random() * 1.5
    : 0.5 + Math.random() * 1.5
    : undefined;

  return {
    type,
    description: DESCRIPTIONS[type],
    temp: Math.round(temp),
    humidity: type === "CLEAR" ? 40 + Math.random() * 20 : 60 + Math.random() * 30,
    windSpeed: Math.round(windSpeed * 10) / 10,
    visibility: Math.round(visibility),
    waveHeight: waveHeight ? Math.round(waveHeight * 10) / 10 : undefined,
    lat,
    lon,
    icon: ICONS[type],
    timestamp: new Date(),
    source: "mock",
  };
}

function mockForecast(lat: number, lon: number): WeatherForecastDay[] {
  const region = regionFromCoords(lat, lon);
  const profiles = WEST_AFRICA_PROFILES[region] ?? WEST_AFRICA_PROFILES.atlantic;
  return Array.from({ length: 7 }, (_, i) => {
    const type = profiles[i % profiles.length];
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      date,
      type,
      tempMin: 22 + Math.random() * 4,
      tempMax: 28 + Math.random() * 10,
      description: DESCRIPTIONS[type],
      icon: ICONS[type],
    };
  });
}

// ─── OpenWeather API integration ──────────────────────────────────
const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

function owConditionToType(id: number): WeatherType {
  if (id >= 200 && id < 300) return "THUNDERSTORM";
  if (id >= 300 && id < 400) return "RAIN";
  if (id >= 500 && id < 502) return "RAIN";
  if (id >= 502 && id < 600) return "HEAVY_RAIN";
  if (id >= 700 && id < 750) return "FOG";
  if (id === 761 || id === 762) return "SAND";
  if (id >= 800 && id < 803) return "CLEAR";
  if (id >= 803) return "CLOUDS";
  return "CLEAR";
}

async function fetchLiveWeather(lat: number, lon: number): Promise<WeatherCondition> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`OW ${res.status}`);
  const data = await res.json();
  const type = owConditionToType(data.weather[0].id);
  return {
    type,
    description: data.weather[0].description,
    temp: Math.round(data.main.temp),
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    visibility: data.visibility ?? 10000,
    lat,
    lon,
    icon: ICONS[type],
    timestamp: new Date(),
    source: "live",
  };
}

async function fetchLiveForecast(lat: number, lon: number): Promise<WeatherForecastDay[]> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&cnt=56`;
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`OW ${res.status}`);
  const data = await res.json();
  // Group by day — take midday forecast
  const byDay: Record<string, WeatherForecastDay> = {};
  for (const item of data.list) {
    const d = new Date(item.dt * 1000);
    const key = d.toISOString().slice(0, 10);
    if (d.getHours() >= 11 && d.getHours() <= 14 && !byDay[key]) {
      const type = owConditionToType(item.weather[0].id);
      byDay[key] = {
        date: d,
        type,
        tempMin: Math.round(item.main.temp_min),
        tempMax: Math.round(item.main.temp_max),
        description: item.weather[0].description,
        icon: ICONS[type],
      };
    }
  }
  return Object.values(byDay).slice(0, 7);
}

// ─── Public API ────────────────────────────────────────────────────
export const WeatherProvider = {
  async getCurrent(lat: number, lon: number): Promise<WeatherCondition> {
    if (API_KEY) {
      try { return await fetchLiveWeather(lat, lon); } catch { /* fallback */ }
    }
    return mockWeather(lat, lon);
  },

  async getForecast7Days(lat: number, lon: number): Promise<WeatherForecastDay[]> {
    if (API_KEY) {
      try { return await fetchLiveForecast(lat, lon); } catch { /* fallback */ }
    }
    return mockForecast(lat, lon);
  },
};

// ─── Impact calculators ────────────────────────────────────────────
export function calcMaritimeImpact(weather: WeatherCondition, baseETAHours: number): WeatherImpact {
  const cfg = WeatherImpactConfig[weather.type];
  const waveH = weather.waveHeight ?? 0;

  if (waveH > WeatherThresholds.MARITIME.WAVE_HEIGHT_SLOW) {
    const speedFactor = 0.85; // -15% speed
    const adjustedHours = baseETAHours / speedFactor;
    const deltaH = adjustedHours - baseETAHours;
    return {
      delayFactor: cfg.delayFactor,
      riskLevel: waveH > 5 ? "CRITICAL" : "HIGH",
      alert: buildWeatherAlert(
        weather.type,
        "Maritime",
        `Houle ${waveH}m détectée — vitesse réduite 15%, ETA recalculé +${deltaH.toFixed(1)}h.`
      ),
      adjustedETA: `+${deltaH.toFixed(1)}h`,
    };
  }

  return { delayFactor: cfg.delayFactor, riskLevel: cfg.riskLevel as RiskLevel, alert: null };
}

export function calcRoadImpact(weather: WeatherCondition, baseETAHours: number): WeatherImpact {
  const cfg = WeatherImpactConfig[weather.type];
  const isHeavyRain = weather.type === "HEAVY_RAIN" || weather.type === "THUNDERSTORM";
  const delayFactor = isHeavyRain ? 1 + WeatherThresholds.ROAD.HEAVY_RAIN_DELAY : cfg.delayFactor;
  const adjustedHours = baseETAHours * delayFactor;
  const deltaH = adjustedHours - baseETAHours;

  return {
    delayFactor,
    riskLevel: cfg.riskLevel as RiskLevel,
    alert: isHeavyRain
      ? buildWeatherAlert(
          weather.type,
          "Routier",
          `Fortes pluies sur corridor. Délai +${(deltaH).toFixed(1)}h (risque embourbement). Victor — alternative rail évaluée.`
        )
      : null,
    adjustedETA: deltaH > 0 ? `+${deltaH.toFixed(1)}h` : undefined,
  };
}

export function calcAirImpact(weather: WeatherCondition): WeatherImpact {
  const cfg = WeatherImpactConfig[weather.type];
  const isDiverted = weather.visibility < WeatherThresholds.AIR.VISIBILITY_DIVERT;
  const isHold = weather.windSpeed > WeatherThresholds.AIR.WIND_SPEED_HOLD;

  return {
    delayFactor: cfg.delayFactor,
    riskLevel: isDiverted || isHold ? "CRITICAL" : cfg.riskLevel as RiskLevel,
    alert: isDiverted
      ? buildWeatherAlert(
          weather.type,
          "Aérien",
          `Visibilité ${weather.visibility}m — risque de déroutement. Protocole Diverted Flight activé.`
        )
      : isHold
      ? buildWeatherAlert(weather.type, "Aérien", `Vents ${weather.windSpeed}m/s — Ground Hold possible.`)
      : null,
  };
}

// ─── Radar overlay color helper ────────────────────────────────────
export function radarColor(type: WeatherType): { fill: string; pulse: string } | null {
  switch (type) {
    case "RAIN":
    case "HEAVY_RAIN":
      return { fill: "rgba(56,189,248,0.18)", pulse: "#38bdf8" };
    case "THUNDERSTORM":
      return { fill: "rgba(245,158,11,0.18)", pulse: "#f59e0b" };
    case "SAND":
      return { fill: "rgba(212,168,67,0.18)", pulse: "#D4AF37" };
    case "FOG":
      return { fill: "rgba(255,255,255,0.08)", pulse: "rgba(255,255,255,0.4)" };
    default:
      return null;
  }
}
