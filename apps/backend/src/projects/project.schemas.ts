import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: z.string().trim().max(1000).optional().default(''),
  originalPrompt: z.string().trim().min(1, 'Original prompt is required').max(50000),
});

export const projectIdSchema = z.string().uuid('Project id must be a valid UUID');
