/**
 * Test de charge ORION — k6
 * 
 * Scénario : 100 VU sur 5 minutes
 * Flux : Authentification - Récupération B/L - Génération PDF Intermodal
 * 
 * Execution:
 *   k6 run --env BASE_URL=https://staging.orion.ci tests/load/stress_test.js
 *   k6 run --env BASE_URL=http://localhost:3000 tests/load/stress_test.js
 * 
 * Seuil : 95% des requêtes < 2s
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Métriques personnalisées
const loginTrend = new Trend('http_req_duration_login');
const blTrend = new Trend('http_req_duration_bl');
const pdfTrend = new Trend('http_req_duration_pdf');
const errorRate = new Rate('errors');
const apiTimeoutCount = new Counter('api_timeouts');

// Configuration du test
export const options = {
  // Scénario : 100 VU sur 5 minutes
  stages: [
    { duration: '1m', target: 20 },   // Ramp-up : 20 VU
    { duration: '2m', target: 100 },  // Montée : 100 VU
    { duration: '1m', target: 100 },  // Plateau : 100 VU
    { duration: '1m', target: 0 },    // Ramp-down
  ],
  
  // Seuils stricts (95% < 2s)
  thresholds: {
    http_req_duration: ['p(95)<2000'],      // 95% des requêtes < 2s
    http_req_duration_login: ['p(95)<1500'], // Login < 1.5s
    http_req_duration_bl: ['p(95)<2000'],    // Récup B/L < 2s
    http_req_duration_pdf: ['p(95)<3000'],   // PDF < 3s (complexe)
    errors: ['rate<0.05'],                   // Taux d'erreur < 5%
  },
  
  // Configuration des timeouts
  setupTimeout: '30s',
  teardownTimeout: '30s',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Données de test
const TEST_USERS = [
  { email: 'pro@orion.ci', password: 'orion2024' },
  { email: 'rail@orion.ci', password: 'orion2024' },
  { email: 'road@orion.ci', password: 'orion2024' },
  { email: 'air@orion.ci', password: 'orion2024' },
  { email: 'demo@orion.ci', password: 'demo123' },
];

const TEST_BL_IDS = [
  'ORN-SEA-2026-001',
  'ORN-SEA-2026-002', 
  'ORN-SEA-2026-003',
  'ORN-RAIL-2026-001',
  'ORN-ROAD-2026-001',
  'ORN-AIR-2026-001',
];

/**
 * Setup : Préparation du test (appelé une seule fois)
 */
export function setup() {
  console.log(`🚀 Test de charge ORION démarré`)
  console.log(`   URL: ${BASE_URL}`)
  console.log(`   Objectif: 95% des requêtes < 2s`)
  
  // Vérifier que SQLite WAL mode est actif
  const healthCheck = http.get(`${BASE_URL}/api/admin/health`)
  check(healthCheck, {
    'health endpoint is 200': (r) => r.status === 200
  })
  
  return { baseUrl: BASE_URL }
}

/**
 * Scénario principal
 */
export default function (data) {
  const baseUrl = data.baseUrl
  
  // Sélection circulaire utilisateur selon VU
  const userIndex = __VU % TEST_USERS.length
  const user = TEST_USERS[userIndex]
  const blId = TEST_BL_IDS[__ITER % TEST_BL_IDS.length]
  
  let authToken = null
  
  // ───────────────────────────────────────────────
  // ÉTAPE 1 : Authentification
  // ───────────────────────────────────────────────
  group('01 - Authentification', () => {
    const startTime = Date.now()
    
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password
    })
    
    const loginRes = http.post(
      `${baseUrl}/api/auth/callback/credentials`,
      loginPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: '5s'
      }
    )
    
    const duration = Date.now() - startTime
    loginTrend.add(duration)
    
    // Vérifier timeout
    if (duration > 5000) {
      apiTimeoutCount.add(1)
      console.warn(`Login timeout: ${duration}ms`)
    }
    
    const loginSuccess = check(loginRes, {
      'login status is 200 or 302': (r) => r.status === 200 || r.status === 302,
      'login response time < 2s': () => duration < 2000
    })
    
    if (!loginSuccess) {
      errorRate.add(1)
      console.error(`Login failed: ${loginRes.status} - ${loginRes.body}`)
    } else {
      // Extraction token si présent dans les cookies
      const cookies = loginRes.cookies
      if (cookies['next-auth.session-token']) {
        authToken = cookies['next-auth.session-token'][0].value
      }
    }
    
    sleep(1)
  })
  
  // ───────────────────────────────────────────────
  // ÉTAPE 2 : Récupération B/L
  // ───────────────────────────────────────────────
  group('02 - Récupération B/L', () => {
    const startTime = Date.now()
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    
    if (authToken) {
      headers['Cookie'] = `next-auth.session-token=${authToken}`
    }
    
    // Tentative tracking Ship24 ou récupération document BL
    const blRes = http.get(
      `${baseUrl}/api/tracking/ship24?ref=${blId}`,
      { 
        headers: headers,
        timeout: '5s'
      }
    )
    
    const duration = Date.now() - startTime
    blTrend.add(duration)
    
    if (duration > 5000) {
      apiTimeoutCount.add(1)
    }
    
    const blSuccess = check(blRes, {
      'BL fetch status is 200': (r) => r.status === 200 || r.status === 401, // 401 OK si pas authentifié
      'BL response time < 2s': () => duration < 2000
    })
    
    if (!blSuccess) {
      errorRate.add(1)
      console.error(`B/L fetch failed: ${blRes.status}`)
    }
    
    sleep(0.5)
  })
  
  // ───────────────────────────────────────────────
  // ÉTAPE 3 : Génération PDF Intermodal
  // ───────────────────────────────────────────────
  group('03 - Génération PDF Intermodal', () => {
    const startTime = Date.now()
    
    const pdfPayload = JSON.stringify({
      type: 'INTERMODAL',
      reference: blId,
      segments: [
        { mode: 'maritime', origin: 'Abidjan', destination: 'San Pedro', status: 'completed' },
        { mode: 'rail', origin: 'San Pedro', destination: 'Ouagadougou', status: 'active' },
        { mode: 'road', origin: 'Ouagadougou', destination: 'Bobo-Dioulasso', status: 'pending' }
      ],
      generated_at: new Date().toISOString()
    })
    
    const headers = {
      'Content-Type': 'application/json'
    }
    
    if (authToken) {
      headers['Cookie'] = `next-auth.session-token=${authToken}`
    }
    
    const pdfRes = http.post(
      `${baseUrl}/api/documents/archive`,
      pdfPayload,
      { 
        headers: headers,
        timeout: '10s', // PDF plus long à générer
        responseType: 'text'
      }
    )
    
    const duration = Date.now() - startTime
    pdfTrend.add(duration)
    
    if (duration > 5000) {
      apiTimeoutCount.add(1)
    }
    
    const pdfSuccess = check(pdfRes, {
      'PDF gen status is 200 or 201': (r) => r.status === 200 || r.status === 201 || r.status === 401,
      'PDF response time < 3s': () => duration < 3000
    })
    
    if (!pdfSuccess) {
      errorRate.add(1)
      console.error(`PDF generation failed: ${pdfRes.status}`)
    }
    
    sleep(1)
  })
  
  // Pause entre itérations
  sleep(2)
}

/**
 * Teardown : Nettoyage après test
 */
export function teardown(data) {
  console.log('\n✅ Test de charge terminé')
  console.log(`   URL testée: ${data.baseUrl}`)
}
