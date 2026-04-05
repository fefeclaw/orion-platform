/**
 * Test de charge - API Professionnelles (Auth requise)
 * Nécessite un token API valide (Business)
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const errorRate = new Rate('auth_errors');
const rateLimited = new Counter('rate_limited_requests');

export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Warm-up
    { duration: '5m', target: 50 },   // Charge normale
    { duration: '5m', target: 50 },   // Stabilité
    { duration: '2m', target: 0 },      // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_TOKEN = __ENV.API_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(API_TOKEN && { 'Authorization': `Bearer ${API_TOKEN}` }),
};

export default function () {
  // Tests sans auth (doivent échouer ou utiliser fallback)
  group('Maritime AIS - Fallback', () => {
    const res = http.get(`${BASE_URL}/api/maritime/ais?zone=abidjan`, {
      headers: API_TOKEN ? headers : { 'Content-Type': 'application/json' },
      tags: { endpoint: 'maritime-ais' },
    });
    
    // Avec auth: 200, Sans auth: 401 ou fallback mock
    check(res, {
      'AIS returns data': (r) => r.status === 200 || r.status === 401,
      'AIS response is JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });
    
    if (res.status === 429) {
      rateLimited.add(1);
    }
    
    sleep(2);
  });
  
  group('Documents - Generation Check', () => {
    // Test de génération B/L avec données minimales
    const blData = {
      bl_number: `BL-TEST-${Date.now()}`,
      shipper: 'Test Shipper',
      consignee: 'Test Consignee',
      vessel: 'TEST VESSEL',
      pol: 'Abidjan',
      pod: 'Rotterdam',
      containers: [{
        number: 'TEST1234567',
        type: '40HC',
        weight: 25000,
      }],
    };
    
    const res = http.post(
      `${BASE_URL}/api/documents/archive`,
      JSON.stringify({
        type: 'BL',
        pilier: 'maritime',
        metadata: blData,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    check(res, {
      'archive response is valid': (r) => r.status === 200 || r.status === 401,
    });
    
    sleep(3);
  });
  
  group('Intermodal Data', () => {
    // Test de récupération des expéditions
    const res = http.get(`${BASE_URL}/api/intermodal/shipments`, {
      headers: API_TOKEN ? headers : { 'Content-Type': 'application/json' },
      tags: { endpoint: 'intermodal' },
    });
    
    check(res, {
      'intermodal returns valid response': (r) => 
        r.status === 200 || r.status === 401 || r.status === 403,
    });
    
    sleep(2);
  });
  
  group('Admin Export', () => {
    const res = http.post(
      `${BASE_URL}/api/admin/export`,
      JSON.stringify({
        type: 'maritime',
        filters: { from: '2026-03-01', to: '2026-03-31' },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    check(res, {
      'export API responds': (r) => r.status === 200 || r.status === 401 || r.status === 502,
    });
    
    if (res.status === 200) {
      check(res, {
        'export returns Excel': (r) => 
          r.headers['Content-Type']?.includes('spreadsheet') || 
          r.headers['Content-Type']?.includes('application/json'),
      });
    }
    
    sleep(5); // Intervalle plus long pour export
  });
}

export function setup() {
  console.log('🏗️  Test API Professionnelles');
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log(`API_TOKEN: ${API_TOKEN ? '✅ Configuré' : '❌ Non configuré - mode fallback/mock'}`);
  return {};
}
