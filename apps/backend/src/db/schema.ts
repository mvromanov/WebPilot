import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type { Workflow } from '../steps/workflow.schema.js';

export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    originalPrompt: text('original_prompt').notNull().default(''),
    steps: text('steps_json', { mode: 'json' }).$type<Workflow>(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index('projects_updated_at_idx').on(table.updatedAt)],
);

export type ProjectRecord = typeof projects.$inferSelect;

export const stepArtifacts = sqliteTable(
  'step_artifacts',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    stepId: text('step_id').notNull(),
    kind: text('kind').notNull(),
    contentPath: text('content_path').notNull(),
    contentHash: text('content_hash').notNull(),
    byteSize: integer('byte_size').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index('step_artifacts_project_step_idx').on(table.projectId, table.stepId),
    index('step_artifacts_content_hash_idx').on(table.contentHash),
  ],
);

export type StepArtifactRecord = typeof stepArtifacts.$inferSelect;
