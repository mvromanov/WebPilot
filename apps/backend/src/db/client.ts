import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
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

type StoredWorkflow = {
  steps?: Array<Record<string, unknown>>;
};

const savedWorkflows = sqlite
  .prepare('SELECT id, steps_json AS stepsJson FROM projects WHERE steps_json IS NOT NULL')
  .all() as Array<{ id: string; stepsJson: string }>;
const saveBackfilledWorkflow = sqlite.prepare('UPDATE projects SET steps_json = ? WHERE id = ?');

for (const project of savedWorkflows) {
  try {
    const workflow = JSON.parse(project.stepsJson) as StoredWorkflow;
    if (!Array.isArray(workflow.steps)) continue;

    let changed = false;
    for (const step of workflow.steps) {
      if (typeof step.id !== 'string') {
        step.id = randomUUID();
        changed = true;
      }
      if (step.type === 'extractText') {
        if (typeof step.instruction !== 'string') {
          step.instruction = typeof step.label === 'string'
            ? `Extract ${step.label}`
            : 'Extract the requested content';
          changed = true;
        }
        if (step.resultType !== 'text' && step.resultType !== 'url' && step.resultType !== 'json') {
          step.resultType = 'text';
          changed = true;
        }
        if (step.resultShape !== 'single' && step.resultShape !== 'array') {
          step.resultShape = 'single';
          changed = true;
        }
      }
    }

    if (changed) saveBackfilledWorkflow.run(JSON.stringify(workflow), project.id);
  } catch (error) {
    console.error(`Could not backfill step IDs for project ${project.id}`, error);
  }
}
