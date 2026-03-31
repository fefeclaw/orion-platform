/**
 * Cache SQLite léger — TTL-based key/value store
 * Remplace Redis pour éviter les dépendances externes.
 * TTL recommandés : taux de change 30s, positions navires 60s, météo 10min
 */
import { getDb, isDbAvailable } from "./db";

export function cacheGet<T>(key: string): T | null {
  if (!isDbAvailable()) return null;
  try {
    const db = getDb();
    const row = db
      .prepare("SELECT value, expires_at FROM cache WHERE key = ?")
      .get(key) as { value: string; expires_at: number } | undefined;
    if (!row) return null;
    if (row.expires_at !== 0 && Date.now() > row.expires_at) {
      db.prepare("DELETE FROM cache WHERE key = ?").run(key);
      return null;
    }
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, value: T, ttlSeconds = 60): void {
  if (!isDbAvailable()) return;
  try {
    const db = getDb();
    const expires_at = ttlSeconds === 0 ? 0 : Date.now() + ttlSeconds * 1000;
    db.prepare(
      "INSERT INTO cache(key, value, expires_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, expires_at=excluded.expires_at"
    ).run(key, JSON.stringify(value), expires_at);
  } catch {
    // cache non-critique — silencieux
  }
}

export function cacheDel(key: string): void {
  if (!isDbAvailable()) return;
  try {
    getDb().prepare("DELETE FROM cache WHERE key = ?").run(key);
  } catch { /* silencieux */ }
}

export function cacheCleanup(): void {
  if (!isDbAvailable()) return;
  try {
    getDb()
      .prepare("DELETE FROM cache WHERE expires_at != 0 AND expires_at < ?")
      .run(Date.now());
  } catch { /* silencieux */ }
}
