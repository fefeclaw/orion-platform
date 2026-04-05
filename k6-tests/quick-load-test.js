/**
 * Test de charge RAPIDE - Tracking API (3 minutes)
 * Pour validation rapide avant production
 * Usage: ./k6 run quick-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

// Métriques personnalisées
const errorRate = new Rate('errors');

// Configuration rapide (3 minutes)
export const options = {
  stages: [
    { duration: '30s', target: 25 },   // Montée rapide à 25 users
    { duration: '2m', target: 50 },     // Plateau 50 users
    { duration: '30s', target: 0 },     // Descente
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% des requêtes < 2s
    http_req_failed: ['rate<0.05'],      // < 5% d'erreurs
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Références de test
const TRACKING_REFS = [
  'ORN-RD-2026-0042',
  'ORN-MT-2026-0018', 
  'ORN-AR-2026-0091',
];

export default function () {
  const ref = TRACKING_REFS[Math.floor(Math.random() * TRACKING_REFS.length)];
  
  group('Tracking Public', () => {
    const response = http.get(`${BASE_URL}/api/tracking/ship24?ref=${ref}`, {
      tags: { endpoint: 'tracking-public' },
    });
    
    const success = check(response, {
      'tracking status is valid': (r) => r.status === 200 || r.status === 401,
      'tracking response time < 2000ms': (r) => r.timings.duration < 2000,
      'response has content': (r) => r.body.length > 0,
    });
    
    errorRate.add(!success);
    sleep(0.5); // Intervalle court pour charge élevée
  });
  
  group('Static Assets', () => {
    const res = http.get(`${BASE_URL}/`, {
      tags: { endpoint: 'home-page' },
    });
    
    check(res, {
      'home page loads': (r) => r.status === 200,
    });
    
    sleep(0.5);
  });
}

// Setup
export function setup() {
  console.log('🚀 Test de charge rapide - 3 minutes');
  console.log('Cible: 50 users max');
  console.log('Seuils: p(95) < 2s, erreurs < 5%');
  
  const health = http.get(`${BASE_URL}/api/rates`);
  if (health.status !== 200) {
    console.error('❌ Erreur:', health.status, health.body);
    throw new Error('Serveur non disponible');
  }
  console.log('✅ Serveur OK - Démarrage du test');
  return {};
}

// Teardown
export function teardown() {
  console.log('✅ Test terminé');
}
