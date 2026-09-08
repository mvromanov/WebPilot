import { readApiError } from '../../projects/api/projectsApi';
import type { Workflow } from '../types';

export async function generateSteps(originalPrompt: string): Promise<Workflow> {
  const response = await fetch('/api/steps/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ originalPrompt }),
  });

  if (!response.ok) {
    throw await readApiError(response, 'Could not generate workflow steps');
  }

  return response.json() as Promise<Workflow>;
}

export async function executeSteps(projectId: string, workflow: Workflow): Promise<unknown> {
  const response = await fetch(`/api/steps/execute/${projectId}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(workflow),
  });

  if (!response.ok) {
    throw await readApiError(response, 'Could not execute workflow steps');
  }

  const body = await response.json() as { result: unknown };
  return body.result;
}

export async function stopSteps(projectId: string): Promise<void> {
  const response = await fetch(`/api/steps/stop/${projectId}`, { method: 'POST' });

  if (!response.ok) {
    throw await readApiError(response, 'Could not stop browser session');
  }
}
