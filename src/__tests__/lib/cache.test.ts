/**
 * Tests d'intégration — Système de cache SQLite
 * Agent 10 — Testing & QA
 */
import { describe, it, expect } from '@jest/globals';
import { cacheGet, cacheSet, cacheDel } from '../../lib/cache';

describe('Système de Cache', () => {
  describe('Opérations basiques', () => {
    it('devrait stocker et récupérer une valeur', () => {
      const key = 'test-key-001';
      const value = { foo: 'bar', timestamp: Date.now() };
      
      cacheSet(key, value, 60);
      const retrieved = cacheGet(key);
      
      expect(retrieved).toEqual(value);
    });

    it('devrait retourner null pour une clé inexistante', () => {
      const result = cacheGet('non-existent-key-xyz');
      expect(result).toBeNull();
    });

    it('devrait gérer les différents types de données', () => {
      const testCases = [
        { key: 'string-key', value: 'Hello World' },
        { key: 'number-key', value: 42 },
        { key: 'boolean-key', value: true },
        { key: 'array-key', value: [1, 2, 3, 'four'] },
        { key: 'object-key', value: { nested: { deep: 'value' } } },
        { key: 'null-key', value: null },
      ];

      testCases.forEach(({ key, value }) => {
        cacheSet(key, value, 60);
        const retrieved = cacheGet(key);
        expect(retrieved).toEqual(value);
      });
    });
  });

  describe('TTL (Time To Live)', () => {
    it('devrait expirer une entrée après le TTL', async () => {
      const key = 'ttl-test-001';
      cacheSet(key, 'value', 0.01); // 10ms TTL
      
      // Valeur présente immédiatement
      expect(cacheGet(key)).toBe('value');
      
      // Attendre expiration
      await new Promise(r => setTimeout(r, 50));
      
      // Valeur expirée
      expect(cacheGet(key)).toBeNull();
    });

    it('devrait persister une entrée sans TTL (TTL=0)', () => {
      const key = 'persistent-key';
      cacheSet(key, 'persistent-value', 0); // TTL=0 = persistant
      
      // Pas d'expiration définie, la valeur doit persister
      const retrieved = cacheGet(key);
      expect(retrieved).toBe('persistent-value');
    });
  });

  describe('Suppression', () => {
    it('devrait supprimer une entrée existante', () => {
      const key = 'delete-test';
      cacheSet(key, 'to-delete', 60);
      expect(cacheGet(key)).toBe('to-delete');
      
      cacheDel(key);
      expect(cacheGet(key)).toBeNull();
    });

    it('devrait gérer la suppression d\'une clé inexistante', () => {
      // Ne devrait pas throw
      expect(() => cacheDel('never-existed')).not.toThrow();
    });
  });

  describe('Performances', () => {
    it('devrait gérer un volume élevé d\'entrées', () => {
      const entries = Array.from({ length: 100 }, (_, i) => ({
        key: `perf-key-${i}`,
        value: { id: i, data: 'x'.repeat(100) }
      }));

      const startTime = Date.now();
      
      entries.forEach(({ key, value }) => cacheSet(key, value, 300));
      const setTime = Date.now() - startTime;
      
      const readStart = Date.now();
      entries.forEach(({ key, value }) => {
        const retrieved = cacheGet(key);
        expect(retrieved).toEqual(value);
      });
      const readTime = Date.now() - readStart;
      
      // Performances raisonnables (< 100ms pour 100 entrées)
      expect(setTime).toBeLessThan(1000);
      expect(readTime).toBeLessThan(1000);
    });
  });
});

describe('Cas d\'erreur', () => {
  it('devrait gérer les clés avec caractères spéciaux', () => {
    const specialKeys = [
      'key:with:colons',
      'key-with-dashes',
      'key.with.dots',
      'key"with"quotes',
      "key'with'apostrophes",
      'key with spaces',
      'key\nwith\nnewlines',
    ];

    specialKeys.forEach(key => {
      cacheSet(key, 'value', 60);
      expect(cacheGet(key)).toBe('value');
    });
  });

  it('devrait gérer les données volumineuses', () => {
    const largeValue = { data: 'x'.repeat(10000) }; // ~10KB
    cacheSet('large-key', largeValue, 60);
    expect(cacheGet('large-key')).toEqual(largeValue);
  });
});
