export const WeatherImpactConfig = {
  THUNDERSTORM: { delayFactor: 1.4, riskLevel: "CRITICAL" },
  HEAVY_RAIN:   { delayFactor: 1.2, riskLevel: "HIGH"     },
  FOG:          { delayFactor: 1.1, riskLevel: "MEDIUM"   },
  RAIN:         { delayFactor: 1.05, riskLevel: "LOW"     },
  SAND:         { delayFactor: 1.15, riskLevel: "HIGH"    },
  CLOUDS:       { delayFactor: 1.0,  riskLevel: "LOW"     },
  CLEAR:        { delayFactor: 1.0,  riskLevel: "LOW"     },
} as const;

export type WeatherType = keyof typeof WeatherImpactConfig;
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// Pillar-specific thresholds
export const WeatherThresholds = {
  MARITIME: {
    WAVE_HEIGHT_SLOW: 3,     // meters — reduce speed 15% + recalculate ETA
    WAVE_HEIGHT_HALT: 7,     // meters — halt recommendation
  },
  ROAD: {
    HEAVY_RAIN_DELAY: 0.20,  // +20% delay factor
    BORDER_WAIT_EXTRA: 1.5,  // hours added at border posts in bad weather
  },
  AIR: {
    VISIBILITY_DIVERT: 500,  // meters — diversion risk alert
    WIND_SPEED_HOLD: 25,     // m/s — ground hold alert
  },
} as const;

// Brand voice alert template
export function buildWeatherAlert(type: WeatherType, pillar: string, detail: string): string {
  return [
    `⚡ Orion Logistics — Ajustement prédictif du flux dû aux conditions climatiques.`,
    `Pilier ${pillar} · Événement : ${type} détecté.`,
    `${detail}`,
    `Intégrité de la cargaison priorisée. Orion Protocol actif.`,
  ].join("\n");
}
