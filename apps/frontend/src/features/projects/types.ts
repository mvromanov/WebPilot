import type { Workflow } from '../steps/types';

export type Project = {
  id: string;
  name: string;
  description: string;
  originalPrompt: string;
  steps: Workflow | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectInput = Pick<Project, 'name' | 'description' | 'originalPrompt'>;
export type UpdateProjectInput = Pick<Project, 'originalPrompt' | 'steps'>;
