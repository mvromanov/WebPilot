import { ApiError } from '../../projects/api/projectsApi';
import type { Workflow } from '../types';

export async function generateSteps(originalPrompt: string): Promise<Workflow> {
  const response = await fetch('/api/steps/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ originalPrompt }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new ApiError(body?.error ?? 'Could not generate workflow steps', response.status);
  }

  return response.json() as Promise<Workflow>;
}
