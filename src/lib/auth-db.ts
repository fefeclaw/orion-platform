// REQUIRES: npm install better-sqlite3 bcryptjs
// REQUIRES: npm install --save-dev @types/better-sqlite3 @types/bcryptjs
import crypto from "crypto";
import { getDb } from "./db";

export interface DbUser {
  id: string;
  email: string;
  name: string;
  role: string;
  pillars: string[];
}

interface RawUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  pillars: string;
  last_login: number | null;
}

export function findUserByEmail(email: string): (DbUser & { password_hash: string }) | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as RawUser | undefined;
  if (!row) return undefined;
  return {
    id: row.id,
    email: row.email,
    password_hash: row.password_hash,
    name: row.name,
    role: row.role,
    pillars: JSON.parse(row.pillars) as string[],
  };
}

export function findUserById(id: string): DbUser | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as RawUser | undefined;
  if (!row) return undefined;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    pillars: JSON.parse(row.pillars) as string[],
  };
}

export function verifyPassword(plain: string, hash: string): boolean {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
  return bcrypt.compareSync(plain, hash);
}

export function updateLastLogin(userId: string): void {
  const db = getDb();
  db.prepare("UPDATE users SET last_login = unixepoch() WHERE id = ?").run(userId);
}

// ─── Refresh tokens ───────────────────────────────────────────────────────────

const REFRESH_EXPIRY_DAYS = 30;

export function createRefreshToken(userId: string): string {
  const db = getDb();
  const token = crypto.randomUUID();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = Math.floor(Date.now() / 1000) + REFRESH_EXPIRY_DAYS * 86400;

  db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(crypto.randomUUID(), userId, tokenHash, expiresAt);

  return token;
}

export function validateRefreshToken(token: string): DbUser | null {
  const db = getDb();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const now = Math.floor(Date.now() / 1000);

  const row = db.prepare(`
    SELECT rt.user_id FROM refresh_tokens rt
    WHERE rt.token_hash = ? AND rt.expires_at > ? AND rt.revoked = 0
  `).get(tokenHash, now) as { user_id: string } | undefined;

  if (!row) return null;
  return findUserById(row.user_id) ?? null;
}

export function revokeRefreshToken(token: string): void {
  const db = getDb();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  db.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?").run(tokenHash);
}

export function revokeAllUserTokens(userId: string): void {
  const db = getDb();
  db.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?").run(userId);
}

// ─── Audit / Access Logs ──────────────────────────────────────────────────────

export interface AccessLog {
  id: number;
  userId: string;
  userEmail: string;
  action: string;
  resource?: string;
  ipAddress?: string;
  userAgent?: string;
  status: string;
  metadata?: string;
  createdAt: string;
}

export function logAccess(params: {
  userId: string;
  userEmail: string;
  action: 'LOGIN' | 'LOGOUT' | 'VIEW_PILLAR' | 'GENERATE_PDF' | 'API_CALL';
  resource?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  metadata?: Record<string, unknown>;
}): void {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO access_logs (user_id, user_email, action, resource, ip_address, user_agent, status, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      params.userId,
      params.userEmail,
      params.action,
      params.resource ?? null,
      params.ipAddress ?? null,
      params.userAgent ?? null,
      params.status ?? 'SUCCESS',
      params.metadata ? JSON.stringify(params.metadata) : null,
    );
  } catch {
    // Les logs ne doivent jamais faire planter l'app
  }
}

export function getRecentAccessLogs(userId: string, limit = 50): AccessLog[] {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT id, user_id, user_email, action, resource, ip_address, user_agent, status, metadata, created_at
      FROM access_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
    `).all(userId, limit) as Array<{
      id: number; user_id: string; user_email: string; action: string;
      resource: string | null; ip_address: string | null; user_agent: string | null;
      status: string; metadata: string | null; created_at: string;
    }>;
    return rows.map((r) => ({
      id: r.id, userId: r.user_id, userEmail: r.user_email, action: r.action,
      resource: r.resource ?? undefined, ipAddress: r.ip_address ?? undefined,
      userAgent: r.user_agent ?? undefined, status: r.status,
      metadata: r.metadata ?? undefined, createdAt: r.created_at,
    }));
  } catch { return []; }
}

export function getAllAccessLogs(limit = 100, offset = 0): AccessLog[] {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT id, user_id, user_email, action, resource, ip_address, user_agent, status, metadata, created_at
      FROM access_logs ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset) as Array<{
      id: number; user_id: string; user_email: string; action: string;
      resource: string | null; ip_address: string | null; user_agent: string | null;
      status: string; metadata: string | null; created_at: string;
    }>;
    return rows.map((r) => ({
      id: r.id, userId: r.user_id, userEmail: r.user_email, action: r.action,
      resource: r.resource ?? undefined, ipAddress: r.ip_address ?? undefined,
      userAgent: r.user_agent ?? undefined, status: r.status,
      metadata: r.metadata ?? undefined, createdAt: r.created_at,
    }));
  } catch { return []; }
}
