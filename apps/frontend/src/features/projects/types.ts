export type Project = {
  id: string;
  name: string;
  description: string;
  originalPrompt: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectInput = Pick<Project, 'name' | 'description' | 'originalPrompt'>;
