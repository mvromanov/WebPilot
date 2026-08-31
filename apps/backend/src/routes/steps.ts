import { Router } from 'express';
import { z } from 'zod';
import { planWorkflow } from '../steps/workflow-planner.js';
import {
  executeWorkflow,
  SessionAlreadyActiveError,
  stopWorkflow,
  WorkflowStoppedError,
} from '../steps/workflow-executor.js';
import { workflowSchema } from '../steps/workflow.schema.js';
import { projectIdSchema } from '../projects/project.schemas.js';
import { loadProject } from '../projects/project.repository.js';

const generateStepsSchema = z.object({
  originalPrompt: z.string().trim().min(1, 'Original prompt is required').max(50_000),
});

export const stepsRouter = Router();

stepsRouter.post('/generate', async (request, response) => {
  const parsedBody = generateStepsSchema.safeParse(request.body);

  if (!parsedBody.success) {
    response.status(400).json({
      error: 'Invalid generation request',
      details: parsedBody.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    response.json(await planWorkflow(parsedBody.data.originalPrompt));
  } catch (error) {
    console.error('Workflow generation failed', error);
    response.status(502).json({
      error: error instanceof Error ? error.message : 'Workflow generation failed',
    });
  }
});

stepsRouter.post('/execute/:projectId', async (request, response) => {
  const parsedProjectId = projectIdSchema.safeParse(request.params.projectId);
  const parsedWorkflow = workflowSchema.safeParse(request.body);

  if (!parsedProjectId.success) {
    response.status(400).json({ error: parsedProjectId.error.issues[0]?.message });
    return;
  }

  if (!parsedWorkflow.success) {
    response.status(400).json({
      error: 'Invalid workflow',
      details: parsedWorkflow.error.flatten(),
    });
    return;
  }

  if (!loadProject(parsedProjectId.data)) {
    response.status(404).json({ error: 'Project not found' });
    return;
  }

  try {
    response.json({ result: await executeWorkflow(parsedProjectId.data, parsedWorkflow.data) });
  } catch (error) {
    console.error('Workflow execution failed', error);
    const status = error instanceof SessionAlreadyActiveError
      ? 409
      : error instanceof WorkflowStoppedError
        ? 409
        : 500;
    response.status(status).json({
      error: error instanceof Error ? error.message : 'Workflow execution failed',
    });
  }
});

stepsRouter.post('/stop/:projectId', async (request, response) => {
  const parsedProjectId = projectIdSchema.safeParse(request.params.projectId);

  if (!parsedProjectId.success) {
    response.status(400).json({ error: parsedProjectId.error.issues[0]?.message });
    return;
  }

  if (!await stopWorkflow(parsedProjectId.data)) {
    response.status(404).json({ error: 'No active browser session for this project' });
    return;
  }

  response.json({ stopped: true });
});
