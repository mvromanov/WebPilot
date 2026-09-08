import { readApiError } from '../../projects/api/projectsApi';
import type { ExtractionInstructionSuggestion, LocatorOption, StepArtifact, StepArtifactKind, StepArtifactWithContent } from '../types/artifacts';
import type { WorkflowStep } from '../types';

type ApiResponse<T> = { data: T };

async function readError(response: Response, fallback: string) {
  return readApiError(response, fallback);
}

function artifactsUrl(projectId: string, stepId: string) {
  return `/api/projects/${projectId}/steps/${stepId}/artifacts`;
}

export async function listStepArtifacts(projectId: string, stepId: string): Promise<StepArtifact[]> {
  const response = await fetch(artifactsUrl(projectId, stepId));
  if (!response.ok) throw await readError(response, 'Could not load step artifacts');
  return ((await response.json()) as ApiResponse<StepArtifact[]>).data;
}

export async function createStepArtifact(
  projectId: string,
  stepId: string,
  kind: StepArtifactKind,
  content: string,
): Promise<StepArtifact> {
  const response = await fetch(artifactsUrl(projectId, stepId), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ kind, content }),
  });
  if (!response.ok) throw await readError(response, 'Could not add step artifact');
  return ((await response.json()) as ApiResponse<StepArtifact>).data;
}

export async function loadStepArtifact(
  projectId: string,
  stepId: string,
  artifactId: string,
): Promise<StepArtifactWithContent> {
  const response = await fetch(`${artifactsUrl(projectId, stepId)}/${artifactId}`);
  if (!response.ok) throw await readError(response, 'Could not fetch step artifact');
  return ((await response.json()) as ApiResponse<StepArtifactWithContent>).data;
}

export async function deleteStepArtifact(
  projectId: string,
  stepId: string,
  artifactId: string,
): Promise<void> {
  const response = await fetch(`${artifactsUrl(projectId, stepId)}/${artifactId}`, { method: 'DELETE' });
  if (!response.ok) throw await readError(response, 'Could not delete step artifact');
}

export async function findLocatorOptions(
  projectId: string,
  stepId: string,
  artifactId: string,
  operation: WorkflowStep,
): Promise<LocatorOption[]> {
  const response = await fetch(`/api/projects/${projectId}/steps/${stepId}/locator-options`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ artifactId, operation }),
  });
  if (!response.ok) throw await readError(response, 'Could not find locator options');
  return ((await response.json()) as { options: LocatorOption[] }).options;
}

export async function findExtractionInstruction(
  projectId: string,
  stepId: string,
  artifactId: string,
  operation: WorkflowStep,
): Promise<ExtractionInstructionSuggestion[]> {
  const response = await fetch(`/api/projects/${projectId}/steps/${stepId}/extraction-instruction`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ artifactId, operation }),
  });
  if (!response.ok) throw await readError(response, 'Could not find an extraction instruction');
  return ((await response.json()) as { suggestions: ExtractionInstructionSuggestion[] }).suggestions;
}
