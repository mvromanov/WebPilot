import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { plannedWorkflowSchema, type Workflow } from './workflow.schema.js';

type LmStudioCompletion = {
  choices?: Array<{
    message?: {
      content?: string | null;
      reasoning?: string | null;
      reasoning_content?: string | null;
    };
  }>;
};

const SYSTEM_PROMPT = `
Convert the user's browser task into a workflow using only these ordered step types:
- goto: url
- waitFor: selector, timeoutMs, label
- waitUntilHidden: selector, pollMs, label
- gotoIfUrlMissing: urlFragment, url
- act: instruction, optional scopeSelector, label
- extractText: instruction, optional sampleText, resultType (text, url, or json), resultShape
  (single or array), optional selector, timeoutMs, label

Use CSS selectors unless the requested text requires XPath. Preserve every wait,
verification, action, and extraction requested by the user. Return only a workflow
that conforms to the supplied JSON schema. All timeoutMs and pollMs values are
integer milliseconds and must be at least 250. Never invent a data-testid or a
selector that the user did not provide. A manual login instruction must always
produce a waitFor step followed immediately by a waitUntilHidden step using the
same login selector. Use resultType "text" for plain text, "url" for links or image
URLs, and "json" for a flat key/value object. Use resultShape "array" only when
multiple results are requested. When the user provides an example of the text to
extract, preserve it in sampleText so it can be used to identify the matching element.
`.trim();

function parseCompletion(completion: LmStudioCompletion): unknown {
  const message = completion.choices?.[0]?.message;
  const text = message?.content || message?.reasoning_content || message?.reasoning || '';
  const json = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  if (!json) throw new Error('LM Studio returned empty structured output');

  try {
    return JSON.parse(json) as unknown;
  } catch (error) {
    throw new Error('LM Studio returned invalid JSON', { cause: error });
  }
}

export async function planWorkflow(originalPrompt: string): Promise<Workflow> {
  const response = await fetch(env.lmStudioUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer lm-studio',
    },
    body: JSON.stringify({
      model: env.lmStudioModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: [{ type: 'text', text: originalPrompt.trim() }] },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'browser_workflow',
          schema: z.toJSONSchema(plannedWorkflowSchema),
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`LM Studio request failed (${response.status}): ${await response.text()}`);
  }

  const completion = await response.json() as LmStudioCompletion;
  const plannedWorkflow = plannedWorkflowSchema.parse(parseCompletion(completion));
  return {
    steps: plannedWorkflow.steps.map((step) => ({ id: randomUUID(), ...step })),
  } as Workflow;
}
