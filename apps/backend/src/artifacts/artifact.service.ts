import {
  createArtifactRecord,
  deleteArtifactRecord,
  listArtifactRecords,
  loadArtifactRecord,
} from './artifact.repository.js';
import {
  deleteArtifactContent,
  readArtifactContent,
  storeArtifactContent,
} from './artifact.storage.js';

export { listArtifactRecords };

export async function createStepArtifact(
  projectId: string,
  stepId: string,
  kind: string,
  content: string,
) {
  const stored = await storeArtifactContent(projectId, stepId, content);

  try {
    return createArtifactRecord({ projectId, stepId, kind, ...stored });
  } catch (error) {
    await deleteArtifactContent(stored.contentPath);
    throw error;
  }
}

export async function loadStepArtifact(projectId: string, stepId: string, artifactId: string) {
  const artifact = loadArtifactRecord(projectId, stepId, artifactId);
  if (!artifact) return undefined;
  return { ...artifact, content: await readArtifactContent(artifact.contentPath) };
}

export async function deleteStepArtifact(projectId: string, stepId: string, artifactId: string) {
  const artifact = deleteArtifactRecord(projectId, stepId, artifactId);
  if (!artifact) return false;

  try {
    await deleteArtifactContent(artifact.contentPath);
  } catch (error) {
    console.error(`Could not delete artifact file ${artifact.contentPath}`, error);
  }
  return true;
}
