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
