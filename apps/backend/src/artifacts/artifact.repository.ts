import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { stepArtifacts, type StepArtifactRecord } from '../db/schema.js';

export type CreateArtifactRecordInput = {
  projectId: string;
  stepId: string;
  kind: string;
  contentPath: string;
  contentHash: string;
  byteSize: number;
};

export function listArtifactRecords(projectId: string, stepId: string): StepArtifactRecord[] {
  return db
    .select()
    .from(stepArtifacts)
    .where(and(eq(stepArtifacts.projectId, projectId), eq(stepArtifacts.stepId, stepId)))
    .orderBy(desc(stepArtifacts.createdAt))
    .all();
}

export function loadArtifactRecord(
  projectId: string,
  stepId: string,
  artifactId: string,
): StepArtifactRecord | undefined {
  return db
    .select()
    .from(stepArtifacts)
    .where(and(
      eq(stepArtifacts.id, artifactId),
      eq(stepArtifacts.projectId, projectId),
      eq(stepArtifacts.stepId, stepId),
    ))
    .get();
}

export function createArtifactRecord(input: CreateArtifactRecordInput): StepArtifactRecord {
  const artifact: StepArtifactRecord = {
    id: randomUUID(),
    ...input,
    createdAt: new Date(),
  };

  db.insert(stepArtifacts).values(artifact).run();
  return artifact;
}

export function deleteArtifactRecord(
  projectId: string,
  stepId: string,
  artifactId: string,
): StepArtifactRecord | undefined {
  const artifact = loadArtifactRecord(projectId, stepId, artifactId);
  if (!artifact) return undefined;

  db.delete(stepArtifacts)
    .where(and(
      eq(stepArtifacts.id, artifactId),
      eq(stepArtifacts.projectId, projectId),
      eq(stepArtifacts.stepId, stepId),
    ))
    .run();
  return artifact;
}
