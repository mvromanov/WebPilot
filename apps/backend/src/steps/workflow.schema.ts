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
    instruction: z.string().min(1),
    sampleText: z.string().min(1).optional(),
    resultType: z.enum(['text', 'url', 'json']),
    resultShape: z.enum(['single', 'array']),
    selector: z.string().min(1).optional(),
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
    instruction: z.string().min(1),
    sampleText: z.string().min(1).optional(),
    resultType: z.enum(['text', 'url', 'json']),
    resultShape: z.enum(['single', 'array']),
    selector: z.string().min(1).optional(),
    timeoutMs: z.number().int().min(250).max(300_000),
    label: z.string().min(1),
  }),
]);

export const editableWorkflowStepSchema = z.discriminatedUnion('type', [
  z.object({ id: stepIdSchema, type: z.literal('goto'), url: z.string().max(10_000) }),
  z.object({
    id: stepIdSchema,
    type: z.literal('gotoIfUrlMissing'),
    urlFragment: z.string().max(10_000),
    url: z.string().max(10_000),
  }),
  z.object({
    id: stepIdSchema,
    type: z.literal('waitFor'),
    selector: z.string().max(20_000),
    timeoutMs: z.number().int().min(250).max(300_000),
    label: z.string().max(1_000),
  }),
  z.object({
    id: stepIdSchema,
    type: z.literal('waitUntilHidden'),
    selector: z.string().max(20_000),
    pollMs: z.number().int().min(250).max(60_000),
    label: z.string().max(1_000),
  }),
  z.object({
    id: stepIdSchema,
    type: z.literal('act'),
    instruction: z.string().max(10_000),
    scopeSelector: z.string().max(20_000).optional(),
    label: z.string().max(1_000),
  }),
  z.object({
    id: stepIdSchema,
    type: z.literal('extractText'),
    instruction: z.string().max(10_000),
    sampleText: z.string().max(10_000).optional(),
    resultType: z.enum(['text', 'url', 'json']),
    resultShape: z.enum(['single', 'array']),
    selector: z.string().max(20_000).optional(),
    timeoutMs: z.number().int().min(250).max(300_000),
    label: z.string().max(1_000),
  }),
]);

export const plannedWorkflowSchema = z.object({
  steps: z.array(plannedWorkflowStepSchema).min(1),
});

export const workflowSchema = z.object({
  steps: z.array(workflowStepSchema).min(1),
});

export const editableWorkflowSchema = z.object({
  steps: z.array(editableWorkflowStepSchema).min(1),
});

export type Workflow = z.infer<typeof workflowSchema>;
