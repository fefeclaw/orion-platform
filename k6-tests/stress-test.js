/**
 * Test de stress - Spike testing
 * Vérifie la résilience du système sous charge soudaine
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Baseline
    { duration: '10s', target: 200 },   // SPIKE !
    { duration: '2m', target: 200 },    // Rétablissement
    { duration: '30s', target: 0 },     // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // Tolérance plus élevée en stress
    http_req_failed: ['rate<0.2'],       // Max 20% d'erreurs acceptable
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test tracking (endpoint le plus sollicité)
  const ref = `ORN-RD-2026-00${Math.floor(Math.random() * 50) + 1}`;
  
  const res = http.get(`${BASE_URL}/api/tracking/ship24?ref=${ref}`, {
    tags: { endpoint: 'tracking-spike' },
  });
  
  check(res, {
    'response in < 5s': (r) => r.timings.duration < 5000,
    'no server error': (r) => r.status < 500,
  });
  
  sleep(0.5); // Intervalle court = charge élevée
}

export function setup() {
  console.log('⚡ Test de Stress - Spike à 200 users');
  console.log('Objectif: Vérifier que le système ne crash pas');
}
