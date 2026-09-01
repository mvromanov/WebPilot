import { Router } from 'express';
import { z } from 'zod';
import { loadProject } from '../projects/project.repository.js';
import {
  createStepArtifact,
  deleteStepArtifact,
  listArtifactRecords,
  loadStepArtifact,
} from '../artifacts/artifact.service.js';
import { serializeArtifact } from '../artifacts/artifact.serializer.js';

const artifactParamsSchema = z.object({
  projectId: z.uuid(),
  stepId: z.uuid(),
});
const artifactIdSchema = z.uuid();
const createArtifactSchema = z.object({
  kind: z.enum(['dom', 'html']),
  content: z.string().min(1).max(10_000_000),
});

export const stepArtifactsRouter = Router();

function projectContainsStep(projectId: string, stepId: string): 'project' | 'step' | null {
  const project = loadProject(projectId);
  if (!project) return 'project';
  if (!project.steps?.steps.some((step) => step.id === stepId)) return 'step';
  return null;
}

function validateScope(request: { params: Record<string, string | undefined> }) {
  return artifactParamsSchema.safeParse(request.params);
}

stepArtifactsRouter.get('/:projectId/steps/:stepId/artifacts', (request, response) => {
  const scope = validateScope(request);
  if (!scope.success) {
    response.status(400).json({ error: 'Project id and step id must be valid UUIDs' });
    return;
  }

  const missing = projectContainsStep(scope.data.projectId, scope.data.stepId);
  if (missing) {
    response.status(404).json({ error: missing === 'project' ? 'Project not found' : 'Step not found' });
    return;
  }

  response.json({
    data: listArtifactRecords(scope.data.projectId, scope.data.stepId).map(serializeArtifact),
  });
});

stepArtifactsRouter.post('/:projectId/steps/:stepId/artifacts', async (request, response) => {
  const scope = validateScope(request);
  const body = createArtifactSchema.safeParse(request.body);
  if (!scope.success || !body.success) {
    response.status(400).json({ error: 'Invalid artifact request' });
    return;
  }

  const missing = projectContainsStep(scope.data.projectId, scope.data.stepId);
  if (missing) {
    response.status(404).json({ error: missing === 'project' ? 'Project not found' : 'Step not found' });
    return;
  }

  try {
    const artifact = await createStepArtifact(
      scope.data.projectId,
      scope.data.stepId,
      body.data.kind,
      body.data.content,
    );
    response
      .status(201)
      .location(`/api/projects/${scope.data.projectId}/steps/${scope.data.stepId}/artifacts/${artifact.id}`)
      .json({ data: serializeArtifact(artifact) });
  } catch (error) {
    console.error('Could not create step artifact', error);
    response.status(500).json({ error: 'Could not create step artifact' });
  }
});

stepArtifactsRouter.get('/:projectId/steps/:stepId/artifacts/:artifactId', async (request, response) => {
  const scope = validateScope(request);
  const artifactId = artifactIdSchema.safeParse(request.params.artifactId);
  if (!scope.success || !artifactId.success) {
    response.status(400).json({ error: 'Invalid artifact path' });
    return;
  }

  try {
    const artifact = await loadStepArtifact(scope.data.projectId, scope.data.stepId, artifactId.data);
    if (!artifact) {
      response.status(404).json({ error: 'Artifact not found' });
      return;
    }
    response.json({ data: { ...serializeArtifact(artifact), content: artifact.content } });
  } catch (error) {
    console.error('Could not read step artifact', error);
    response.status(500).json({ error: 'Could not read step artifact' });
  }
});

stepArtifactsRouter.delete('/:projectId/steps/:stepId/artifacts/:artifactId', async (request, response) => {
  const scope = validateScope(request);
  const artifactId = artifactIdSchema.safeParse(request.params.artifactId);
  if (!scope.success || !artifactId.success) {
    response.status(400).json({ error: 'Invalid artifact path' });
    return;
  }

  if (!await deleteStepArtifact(scope.data.projectId, scope.data.stepId, artifactId.data)) {
    response.status(404).json({ error: 'Artifact not found' });
    return;
  }
  response.status(204).send();
});
