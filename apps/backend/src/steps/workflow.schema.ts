import { z } from 'zod';

const plannedWorkflowStepSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('goto'), url: z.url() }),
  z.object({
    type: z.literal('gotoIfUrlMissing'),
    urlFragment: z.string().min(1),
    url: z.url(),
  }),
  z.object({
    type: z.literal('waitFor'),
    selector: z.string().min(1),
    timeoutMs: z.number().int().min(250).max(300_000),
    label: z.string().min(1),
  }),
  z.object({
    type: z.literal('waitUntilHidden'),
    selector: z.string().min(1),
    pollMs: z.number().int().min(250).max(60_000),
    label: z.string().min(1),
  }),
  z.object({
    type: z.literal('act'),
    instruction: z.string().min(1),
    scopeSelector: z.string().min(1).optional(),
    label: z.string().min(1),
  }),
  z.object({
    type: z.literal('extractText'),
    selector: z.string().min(1),
    timeoutMs: z.number().int().min(250).max(300_000),
    label: z.string().min(1),
  }),
]);

const stepIdSchema = z.uuid();

export const workflowStepSchema = z.discriminatedUnion('type', [
  z.object({ id: stepIdSchema, type: z.literal('goto'), url: z.url() }),
  z.object({
    id: stepIdSchema,
    type: z.literal('gotoIfUrlMissing'),
    urlFragment: z.string().min(1),
    url: z.url(),
  }),
  z.object({
    id: stepIdSchema,
    type: z.literal('waitFor'),
    selector: z.string().min(1),
    timeoutMs: z.number().int().min(250).max(300_000),
    label: z.string().min(1),
  }),
  z.object({
    id: stepIdSchema,
    type: z.literal('waitUntilHidden'),
    selector: z.string().min(1),
    pollMs: z.number().int().min(250).max(60_000),
    label: z.string().min(1),
  }),
  z.object({
    id: stepIdSchema,
    type: z.literal('act'),
    instruction: z.string().min(1),
    scopeSelector: z.string().min(1).optional(),
    label: z.string().min(1),
  }),
  z.object({
    id: stepIdSchema,
    type: z.literal('extractText'),
    selector: z.string().min(1),
    timeoutMs: z.number().int().min(250).max(300_000),
    label: z.string().min(1),
  }),
]);

export const plannedWorkflowSchema = z.object({
  steps: z.array(plannedWorkflowStepSchema).min(1),
});

export const workflowSchema = z.object({
  steps: z.array(workflowStepSchema).min(1),
});

export type Workflow = z.infer<typeof workflowSchema>;
