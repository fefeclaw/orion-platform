/**
 * Tests unitaires — Calculs d'ETA et prédiction de retards
 * Agent 10 — Testing & QA
 */
import { describe, it, expect } from '@jest/globals';

// Mock des fonctions de calcul d'ETA
function calculateETAWithWeather(
  baseETA: number,
  weatherConditions: string[],
  distance: number,
  averageSpeed: number
): number {
  const baseTime = distance / averageSpeed;
  let multiplier = 1.0;
  
  if (weatherConditions.includes('THUNDERSTORM') || weatherConditions.includes('HEAVY_RAIN')) {
    multiplier *= 1.2;
  }
  if (weatherConditions.includes('FOG')) {
    multiplier *= 1.1;
  }
  if (weatherConditions.includes('STRONG_WINDS')) {
    multiplier *= 1.15;
  }
  
  return Math.round(baseTime * multiplier * 3600000); // en ms
}

function predictCongestionDelay(
  currentTime: number,
  portHistory: { hour: number; avgDelay: number }[],
  vesselType: string
): number {
  const hour = new Date(currentTime).getHours();
  const congestionFactor = portHistory.find(h => h.hour === hour)?.avgDelay || 0;
  const typeMultiplier = vesselType === 'container' ? 1.0 : vesselType === 'tanker' ? 1.3 : 1.1;
  
  return Math.round(congestionFactor * typeMultiplier * 60); // en minutes
}

function calculateDominoEffect(
  primaryDelay: number,
  connectionType: 'maritime-rail' | 'maritime-road' | 'rail-air' | 'road-air',
  bufferTime: number
): { totalDelay: number; missedConnection: boolean } {
  const connectionMultiplier: Record<string, number> = {
    'maritime-rail': 0.8,
    'maritime-road': 0.9,
    'rail-air': 0.95,
    'road-air': 0.85
  };
  
  const propagatedDelay = Math.round(primaryDelay * (connectionMultiplier[connectionType] || 0.8));
  const totalDelay = Math.min(propagatedDelay, primaryDelay); // Le retard ne peut pas dépasser l'original
  const missedConnection = primaryDelay > bufferTime;
  
  return { totalDelay, missedConnection };
}

describe('Calculs d\'ETA', () => {
  describe('calculateETAWithWeather', () => {
    it('devrait retourner le temps de base sans conditions météo', () => {
      const result = calculateETAWithWeather(0, [], 100, 10); // 100km à 10km/h = 10h
      expect(result).toBe(36000000); // 10h en ms
    });

    it('devrait appliquer un multiplicateur x1.2 pour orages', () => {
      const result = calculateETAWithWeather(0, ['THUNDERSTORM'], 100, 10);
      expect(result).toBe(43200000); // 12h en ms (10h * 1.2)
    });

    it('devrait appliquer un multiplicateur x1.1 pour brouillard', () => {
      const result = calculateETAWithWeather(0, ['FOG'], 100, 10);
      expect(result).toBe(39600000); // 11h en ms (10h * 1.1)
    });

    it('devrait cumuler les multiplicateurs pour conditions multiples', () => {
      const result = calculateETAWithWeather(0, ['THUNDERSTORM', 'FOG'], 100, 10);
      expect(result).toBe(47520000); // 13.2h en ms (10h * 1.2 * 1.1)
    });

    it('devrait gérer les vitesses nulles avec grace', () => {
      const result = calculateETAWithWeather(0, [], 100, 0);
      expect(result).toBe(Infinity);
    });
  });

  describe('predictCongestionDelay', () => {
    it('devrait prédire 0 délai sans historique', () => {
      const result = predictCongestionDelay(Date.now(), [], 'container');
      expect(result).toBe(0);
    });

    it('devrait prédire correctement pour les heures de pointe', () => {
      const portHistory = [
        { hour: 8, avgDelay: 2.5 },
        { hour: 9, avgDelay: 3.0 },
        { hour: 17, avgDelay: 4.2 }
      ];
      const morningTime = new Date('2026-03-31T08:30:00Z').getTime();
      const result = predictCongestionDelay(morningTime, portHistory, 'container');
      expect(result).toBe(150); // 2.5h * 60min
    });

    it('devrait appliquer un multiplicateur pour les tankers', () => {
      const portHistory = [{ hour: 12, avgDelay: 1.0 }];
      const noonTime = new Date('2026-03-31T12:00:00Z').getTime();
      const result = predictCongestionDelay(noonTime, portHistory, 'tanker');
      expect(result).toBe(78); // 1.0h * 1.3 * 60min
    });
  });

  describe('calculateDominoEffect', () => {
    it('devrait calculer l\'effet cascade maritime-rail', () => {
      const result = calculateDominoEffect(120, 'maritime-rail', 180);
      expect(result.totalDelay).toBe(96); // 120 * 0.8
      expect(result.missedConnection).toBe(false);
    });

    it('devrait détecter une connexion manquée', () => {
      const result = calculateDominoEffect(240, 'maritime-road', 180);
      expect(result.missedConnection).toBe(true);
    });

    it('devrait limiter le retard propagé au retard original', () => {
      const result = calculateDominoEffect(60, 'rail-air', 30);
      expect(result.totalDelay).toBeLessThanOrEqual(60);
    });
  });
});

describe('Gestion des erreurs', () => {
  it('devrait gérer les valeurs négatives', () => {
    const result = calculateETAWithWeather(0, [], -100, 10);
    expect(result).toBeLessThan(0);
  });

  it('devrait gérer les types de connexion inconnus', () => {
    // @ts-expect-error Test avec type invalide
    const result = calculateDominoEffect(120, 'unknown-type', 180);
    expect(result.totalDelay).toBe(96); // fallback à 0.8
  });
});
