// REQUIRES: npm install better-sqlite3
// REQUIRES: npm install --save-dev @types/better-sqlite3
import path from "path";
import { migrate } from "./db-migrate";

// Lazy import — fails gracefully if better-sqlite3 not installed
let _db: import("better-sqlite3").Database | null = null;
let _available: boolean | null = null;

export function isDbAvailable(): boolean {
  if (_available !== null) return _available;
  try {
    require("better-sqlite3");
    _available = true;
  } catch {
    _available = false;
  }
  return _available;
}

export function getDb(): import("better-sqlite3").Database {
  if (_db) return _db;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "data", "orion.db");

  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);

  return _db;
}
