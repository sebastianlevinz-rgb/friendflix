import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;

  // Only import at runtime, not during build
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const path = require('path') as typeof import('path');
  const fs = require('fs') as typeof import('fs');

  const storageDir = path.join(process.cwd(), 'storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const dbPath = path.join(storageDir, 'friendflix.db');
  const sqlite = new Database(dbPath);

  sqlite.pragma('journal_mode = WAL');

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'draft',
      genre TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'es',
      custom_prompt TEXT,
      script_json TEXT,
      output_video_url TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      original_photos TEXT NOT NULL DEFAULT '[]',
      processed_photos TEXT NOT NULL DEFAULT '[]',
      voice_id TEXT,
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      order_index INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      fal_request_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      video_url TEXT,
      duration INTEGER NOT NULL DEFAULT 8,
      retry_count INTEGER NOT NULL DEFAULT 0
    );
  `);

  _db = drizzle(sqlite, { schema });
  return _db;
}

// Convenience export that initializes on first access
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const realDb = getDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (realDb as any)[prop];
    if (typeof value === 'function') {
      return value.bind(realDb);
    }
    return value;
  },
});
