import type { ProjectRecord } from '../db/schema.js';

export function serializeProject(project: ProjectRecord) {
  return {
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
