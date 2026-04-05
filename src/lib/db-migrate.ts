// REQUIRES: npm install better-sqlite3 bcryptjs
// REQUIRES: npm install --save-dev @types/better-sqlite3 @types/bcryptjs
import type { Database } from "better-sqlite3";

export function migrate(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'user',
      pillars       TEXT NOT NULL DEFAULT '[]',
      created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
      last_login    INTEGER
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash  TEXT NOT NULL UNIQUE,
      expires_at  INTEGER NOT NULL,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
      revoked     INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS documents (
      id           TEXT PRIMARY KEY,
      type         TEXT NOT NULL,
      pillar       TEXT NOT NULL,
      reference    TEXT NOT NULL,
      vessel_ref   TEXT,
      origin       TEXT,
      destination  TEXT,
      cargo        TEXT,
      metadata     TEXT NOT NULL DEFAULT '{}',
      created_by   TEXT,
      created_at   INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_documents_type    ON documents(type);
    CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_documents_vessel  ON documents(vessel_ref);

    CREATE TABLE IF NOT EXISTS access_logs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      TEXT NOT NULL,
      user_email   TEXT NOT NULL,
      action       TEXT NOT NULL,
      resource     TEXT,
      ip_address   TEXT,
      user_agent   TEXT,
      status       TEXT NOT NULL DEFAULT 'SUCCESS',
      metadata     TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_access_logs_user    ON access_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_access_logs_created ON access_logs(created_at);

    -- Table des abonnements utilisateurs (modèle de monétisation ORION)
    CREATE TABLE IF NOT EXISTS subscriptions (
      id                     TEXT PRIMARY KEY,
      user_id                TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan                   TEXT NOT NULL DEFAULT 'gratuit' CHECK(plan IN ('gratuit','standard','business')),
      piliers_actifs         TEXT NOT NULL DEFAULT '[]',
      docs_generes_mois      INTEGER NOT NULL DEFAULT 0,
      conteneurs_trackes_mois INTEGER NOT NULL DEFAULT 0,
      date_debut             TEXT NOT NULL DEFAULT (datetime('now')),
      date_fin               TEXT,
      created_at             TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);

    -- Table de suivi d'utilisation des fonctionnalités (quotas mensuels)
    CREATE TABLE IF NOT EXISTS feature_usage (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      feature    TEXT NOT NULL,
      count      INTEGER NOT NULL DEFAULT 0,
      reset_at   TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_feature_usage_user    ON feature_usage(user_id);
    CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON feature_usage(feature);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_usage_user_feature ON feature_usage(user_id, feature);

    -- Cache SQLite TTL-based (remplace Redis)
    CREATE TABLE IF NOT EXISTS cache (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      expires_at INTEGER NOT NULL DEFAULT 0
    );

    -- Vérification WAL mode pour écritures concurrentes
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA cache_size = -64000; -- ~64MB cache
  `);

  seedUsers(db);
  seedSubscriptions(db);
}

interface SeedUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  pillars: string[];
}

function seedUsers(db: Database): void {
  const count = (db.prepare("SELECT COUNT(*) as n FROM users").get() as { n: number }).n;
  if (count > 0) return;

  // bcryptjs — pure JS, no native bindings
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require("bcryptjs") as typeof import("bcryptjs");

  const SEED_USERS: SeedUser[] = [
    { id: "ADM-0001", email: "admin@orion.ci",          password: "admin2024", name: "Admin Orion",          role: "admin",        pillars: ["maritime","rail","road","air"] },
    { id: "PRO-0001", email: "pro@orion.ci",             password: "orion2024", name: "Orion Group",           role: "professional", pillars: ["maritime"] },
    { id: "PRO-0002", email: "rail@orion.ci",            password: "orion2024", name: "TransAfrica Rail",      role: "professional", pillars: ["rail"] },
    { id: "PRO-0003", email: "road@orion.ci",            password: "orion2024", name: "SahelRoute Logistics",  role: "professional", pillars: ["road"] },
    { id: "PRO-0004", email: "air@orion.ci",             password: "orion2024", name: "AirCargo CI",           role: "professional", pillars: ["air"] },
    { id: "USR-0001", email: "demo@orion.ci",            password: "demo123",   name: "Demo User",             role: "user",         pillars: [] },
    { id: "USR-0002", email: "jean.kouame@gmail.com",    password: "test123",   name: "Jean Kouamé",           role: "user",         pillars: [] },
  ];

  const insert = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, pillars)
    VALUES (@id, @email, @password_hash, @name, @role, @pillars)
  `);

  const insertMany = db.transaction((users: SeedUser[]) => {
    for (const u of users) {
      insert.run({
        id: u.id,
        email: u.email,
        password_hash: bcrypt.hashSync(u.password, 10),
        name: u.name,
        role: u.role,
        pillars: JSON.stringify(u.pillars),
      });
    }
  });

  insertMany(SEED_USERS);
}

/**
 * Seed subscriptions : tous les utilisateurs existants reçoivent le plan 'gratuit' par défaut.
 * Les comptes professionnels et admin reçoivent le plan 'business'.
 */
function seedSubscriptions(db: Database): void {
  const count = (db.prepare("SELECT COUNT(*) as n FROM subscriptions").get() as { n: number }).n;
  if (count > 0) return;

  const users = db.prepare("SELECT id, role, pillars FROM users").all() as {
    id: string;
    role: string;
    pillars: string;
  }[];

  const insert = db.prepare(`
    INSERT INTO subscriptions (id, user_id, plan, piliers_actifs)
    VALUES (@id, @user_id, @plan, @piliers_actifs)
  `);

  const insertMany = db.transaction(() => {
    for (const u of users) {
      // Admin et professionnels → business, utilisateurs → gratuit
      const plan =
        u.role === "admin" ? "business" :
        u.role === "professional" ? "standard" :
        "gratuit";

      // Les professionnels héritent de leurs piliers existants
      const piliers = u.role === "admin"
        ? JSON.stringify(["maritime", "rail", "road", "air"])
        : u.pillars;

      insert.run({
        id: `SUB-${u.id}`,
        user_id: u.id,
        plan,
        piliers_actifs: piliers,
      });
    }
  });

  insertMany();
}
