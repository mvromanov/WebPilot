import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: z.string().trim().max(1000).optional().default(''),
});

export const projectIdSchema = z.string().uuid('Project id must be a valid UUID');
