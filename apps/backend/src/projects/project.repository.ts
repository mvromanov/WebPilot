import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { projects, type ProjectRecord } from '../db/schema.js';
import type { Workflow } from '../steps/workflow.schema.js';

export type CreateProjectInput = {
  name: string;
  description: string;
  originalPrompt: string;
};

export type UpdateProjectInput = {
  originalPrompt: string;
  steps: Workflow | null;
};

export function listProjects(): ProjectRecord[] {
  return db.select().from(projects).orderBy(desc(projects.updatedAt)).all();
}

export function loadProject(id: string): ProjectRecord | undefined {
  return db.select().from(projects).where(eq(projects.id, id)).get();
}

export function createProject(input: CreateProjectInput): ProjectRecord {
  const now = new Date();
  const project: ProjectRecord = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    originalPrompt: input.originalPrompt,
    steps: null,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(projects).values(project).run();
  return project;
}

export function updateProject(id: string, input: UpdateProjectInput): ProjectRecord | undefined {
  db.update(projects)
    .set({
      originalPrompt: input.originalPrompt,
      steps: input.steps,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .run();

  return loadProject(id);
}

export function deleteProject(id: string): boolean {
  const result = db.delete(projects).where(eq(projects.id, id)).run();
  return result.changes > 0;
}
