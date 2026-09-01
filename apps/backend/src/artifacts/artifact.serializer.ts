import type { StepArtifactRecord } from '../db/schema.js';

export function serializeArtifact(artifact: StepArtifactRecord) {
  return {
    id: artifact.id,
    projectId: artifact.projectId,
    stepId: artifact.stepId,
    kind: artifact.kind,
    contentHash: artifact.contentHash,
    byteSize: artifact.byteSize,
    createdAt: artifact.createdAt.toISOString(),
  };
}
