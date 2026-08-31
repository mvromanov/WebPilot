import { Router } from 'express';
import { z } from 'zod';
import { planWorkflow } from '../steps/workflow-planner.js';

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
