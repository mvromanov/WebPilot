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
import { findLocatorOptions, supportsLocatorSelection } from '../artifacts/locator-finder.js';
import { editableWorkflowStepSchema } from '../steps/workflow.schema.js';
import { findExtractionInstruction } from '../artifacts/extraction-instruction-finder.js';

const artifactParamsSchema = z.object({
  projectId: z.uuid(),
  stepId: z.uuid(),
});
const artifactIdSchema = z.uuid();
const createArtifactSchema = z.object({
  kind: z.enum(['dom', 'html']),
  content: z.string().min(1).max(10_000_000),
});
const locatorOptionsSchema = z.object({
  artifactId: z.uuid(),
  operation: editableWorkflowStepSchema,
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

stepArtifactsRouter.post('/:projectId/steps/:stepId/locator-options', async (request, response) => {
  const scope = validateScope(request);
  const body = locatorOptionsSchema.safeParse(request.body);
  if (!scope.success || !body.success) {
    response.status(400).json({ error: 'Invalid locator-options request' });
    return;
  }

  const project = loadProject(scope.data.projectId);
  if (!project) {
    response.status(404).json({ error: 'Project not found' });
    return;
  }

  const savedStep = project.steps?.steps.find(({ id }) => id === scope.data.stepId);
  if (!savedStep) {
    response.status(404).json({ error: 'Step not found' });
    return;
  }

  const step = body.data.operation;
  if (step.id !== scope.data.stepId) {
    response.status(400).json({ error: 'Operation id does not match the selected step' });
    return;
  }

  if (!supportsLocatorSelection(step)) {
    response.status(400).json({ error: `${step.type} steps do not target a DOM element` });
    return;
  }

  try {
    const artifact = await loadStepArtifact(
      scope.data.projectId,
      scope.data.stepId,
      body.data.artifactId,
    );
    if (!artifact) {
      response.status(404).json({ error: 'Artifact not found' });
      return;
    }

    response.json(await findLocatorOptions(step, artifact.kind, artifact.content));
  } catch (error) {
    console.error('Could not find locator options', error);
    response.status(502).json({
      error: error instanceof Error ? error.message : 'Could not find locator options',
    });
  }
});

stepArtifactsRouter.post('/:projectId/steps/:stepId/extraction-instruction', async (request, response) => {
  const scope = validateScope(request);
  const body = locatorOptionsSchema.safeParse(request.body);
  if (!scope.success || !body.success) {
    response.status(400).json({ error: 'Invalid extraction-instruction request' });
    return;
  }

  const project = loadProject(scope.data.projectId);
  if (!project?.steps?.steps.some(({ id }) => id === scope.data.stepId)) {
    response.status(404).json({ error: project ? 'Step not found' : 'Project not found' });
    return;
  }

  const step = body.data.operation;
  if (step.id !== scope.data.stepId) {
    response.status(400).json({ error: 'Operation id does not match the selected step' });
    return;
  }
  if (step.type !== 'extractText') {
    response.status(400).json({ error: 'Extraction instructions are only available for extractText steps' });
    return;
  }

  try {
    const artifact = await loadStepArtifact(
      scope.data.projectId,
      scope.data.stepId,
      body.data.artifactId,
    );
    if (!artifact) {
      response.status(404).json({ error: 'Artifact not found' });
      return;
    }
    response.json(await findExtractionInstruction(step, artifact.kind, artifact.content));
  } catch (error) {
    console.error('Could not find extraction instruction', error);
    response.status(502).json({
      error: error instanceof Error ? error.message : 'Could not find extraction instruction',
    });
  }
});
