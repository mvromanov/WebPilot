import { Router } from 'express';
import {
  createProject,
  deleteProject,
  listProjects,
  loadProject,
  updateProject,
} from '../projects/project.repository.js';
import { createProjectSchema, projectIdSchema, updateProjectSchema } from '../projects/project.schemas.js';
import { serializeProject } from '../projects/project.serializer.js';
import { formatFieldErrors } from './validation-errors.js';

export const projectsRouter = Router();

projectsRouter.get('/', (_request, response) => {
  response.json({ data: listProjects().map(serializeProject) });
});

projectsRouter.post('/', (request, response) => {
  const parsedBody = createProjectSchema.safeParse(request.body);

  if (!parsedBody.success) {
    response.status(400).json({
      error: 'Invalid project',
      details: { fieldErrors: formatFieldErrors(parsedBody.error) },
    });
    return;
  }

  const project = createProject(parsedBody.data);
  response
    .status(201)
    .location(`/api/projects/${project.id}`)
    .json({ data: serializeProject(project) });
});

projectsRouter.get('/:id', (request, response) => {
  const parsedId = projectIdSchema.safeParse(request.params.id);

  if (!parsedId.success) {
    response.status(400).json({ error: parsedId.error.issues[0]?.message });
    return;
  }

  const project = loadProject(parsedId.data);

  if (!project) {
    response.status(404).json({ error: 'Project not found' });
    return;
  }

  response.json({ data: serializeProject(project) });
});

projectsRouter.patch('/:id', (request, response) => {
  const parsedId = projectIdSchema.safeParse(request.params.id);
  const parsedBody = updateProjectSchema.safeParse(request.body);

  if (!parsedId.success) {
    response.status(400).json({ error: parsedId.error.issues[0]?.message });
    return;
  }

  if (!parsedBody.success) {
    response.status(400).json({
      error: 'Invalid project update',
      details: { fieldErrors: formatFieldErrors(parsedBody.error) },
    });
    return;
  }

  const project = updateProject(parsedId.data, parsedBody.data);

  if (!project) {
    response.status(404).json({ error: 'Project not found' });
    return;
  }

  response.json({ data: serializeProject(project) });
});

projectsRouter.delete('/:id', (request, response) => {
  const parsedId = projectIdSchema.safeParse(request.params.id);

  if (!parsedId.success) {
    response.status(400).json({ error: parsedId.error.issues[0]?.message });
    return;
  }

  if (!deleteProject(parsedId.data)) {
    response.status(404).json({ error: 'Project not found' });
    return;
  }

  response.status(204).send();
});
