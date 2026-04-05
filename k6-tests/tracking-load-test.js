/**
 * Test de charge - Tracking API (Public + Pro)
 * k6 load testing for ORION platform
 * Usage: k6 run tracking-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

// Métriques personnalisées
const errorRate = new Rate('errors');
const slowRequestRate = new Rate('slow_requests');

// Configuration des scénarios de test
export const options = {
  // Scénarios progressifs
  stages: [
    { duration: '2m', target: 50 },   // Montée progressive à 50 users
    { duration: '5m', target: 50 },   // Plateau 50 users (5 min)
    { duration: '2m', target: 100 },  // Montée à 100 users
    { duration: '5m', target: 100 },  // Plateau 100 users (5 min)
    { duration: '2m', target: 150 },  // Montée à 150 users (stress test)
    { duration: '3m', target: 150 },  // Plateau 150 users (3 min)
    { duration: '2m', target: 0 },    // Descente
  ],
  
  // Seuils de performance
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% des requêtes < 2s
    http_req_failed: ['rate<0.05'],      // < 5% d'erreurs
    errors: ['rate<0.05'],
  },
  
  // Tags globaux
  tags: {
    test: 'tracking-api',
    environment: 'staging',
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Références de test
const TRACKING_REFS = [
  'ORN-RD-2026-0042',
  'ORN-MT-2026-0018', 
  'ORN-AR-2026-0091',
  'ORN-RL-2026-0001',
  'ORN-IM-2026-0001',
];

// Fonction principale
export default function () {
  const ref = TRACKING_REFS[Math.floor(Math.random() * TRACKING_REFS.length)];
  
  group('Tracking Public', () => {
    const startTime = new Date().getTime();
    
    const response = http.get(`${BASE_URL}/api/tracking/ship24?ref=${ref}`, {
      tags: { endpoint: 'tracking-public' },
    });
    
    const duration = new Date().getTime() - startTime;
    
    // Vérifications
    const success = check(response, {
      'tracking status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'tracking response time < 2000ms': (r) => r.timings.duration < 2000,
    });
    
    // Métriques
    errorRate.add(!success);
    slowRequestRate.add(duration > 2000);
    
    // Pause aléatoire entre requêtes (simuler comportement réel)
    sleep(Math.random() * 3 + 1); // 1-4 secondes
  });
  
  group('Pricing Page', () => {
    const response = http.get(`${BASE_URL}/pricing`, {
      tags: { endpoint: 'pricing-page' },
    });
    
    check(response, {
      'pricing page loads': (r) => r.status === 200,
      'pricing has content': (r) => r.body.includes('ORION'),
    });
    
    sleep(2);
  });
  
  group('Rates API', () => {
    const response = http.get(`${BASE_URL}/api/rates`, {
      tags: { endpoint: 'rates-api' },
    });
    
    check(response, {
      'rates status is 200': (r) => r.status === 200,
      'rates has FCFA base': (r) => r.json('base') === 'XOF',
    });
    
    sleep(1);
  });
}

// Setup initial (exécuté une fois)
export function setup() {
  console.log(`🚀 Démarrage des tests de charge sur ${BASE_URL}`);
  console.log('Configuration: 150 users max, 19 minutes de test');
  
  // Vérifier que le serveur répond
  const healthCheck = http.get(`${BASE_URL}/api/admin/health`);
  if (healthCheck.status !== 200) {
    console.error('❌ Serveur non disponible !');
    return { skip: true };
  }
  
  console.log('✅ Serveur disponible, démarrage des tests...');
  return { skip: false };
}

// Teardown (exécuté à la fin)
export function teardown(data) {
  if (data.skip) {
    console.log('⏭️ Tests annulés - serveur indisponible');
    return;
  }
  
  console.log('✅ Tests de charge terminés');
  console.log('📊 Consultez les résultats dans le dashboard k6');
}
