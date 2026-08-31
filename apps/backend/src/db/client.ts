import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { env } from '../config/env.js';
import * as schema from './schema.js';

fs.mkdirSync(path.dirname(env.databasePath), { recursive: true });

const sqlite = new Database(env.databasePath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));
migrate(db, { migrationsFolder });
