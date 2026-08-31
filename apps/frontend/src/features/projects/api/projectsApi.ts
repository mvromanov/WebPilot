import type { CreateProjectInput, Project, UpdateProjectInput } from '../types';

type ApiResponse<T> = { data: T };
type ApiErrorResponse = { error?: string };

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as ApiErrorResponse | null;
  return new ApiError(body?.error ?? fallback, response.status);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) throw await readError(response, 'Something went wrong');
  return response.json() as Promise<T>;
}

export async function listProjects(signal?: AbortSignal): Promise<Project[]> {
  return (await request<ApiResponse<Project[]>>('/api/projects', { signal })).data;
}

export async function loadProject(id: string, signal?: AbortSignal): Promise<Project> {
  return (await request<ApiResponse<Project>>(`/api/projects/${id}`, { signal })).data;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  return (await request<ApiResponse<Project>>('/api/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })).data;
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  return (await request<ApiResponse<Project>>(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })).data;
}

export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  if (!response.ok) throw await readError(response, 'Could not delete project');
}
