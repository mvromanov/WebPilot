import { useCallback, useEffect, useMemo, useState } from 'react';
import { createProject, deleteProject, listProjects } from '../api/projectsApi';
import { CreateProjectDialog } from '../components/CreateProjectDialog';
import { ProjectCard } from '../components/ProjectCard';
import { ApiErrorMessage } from '../components/ApiErrorMessage';
import type { CreateProjectInput, Project } from '../types';
import './ProjectsPage.css';

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | string | null>(null);
  const [query, setQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<Error | string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setProjects(await listProjects(signal));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setLoadError(error instanceof Error ? error : 'Could not load projects');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchProjects(controller.signal);
    return () => controller.abort();
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return projects;

    return projects.filter((project) =>
      `${project.name} ${project.description}`.toLowerCase().includes(normalizedQuery),
    );
  }, [projects, query]);

  const handleCreate = async (input: CreateProjectInput) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const project = await createProject(input);
      setProjects((current) => [project, ...current]);
      setIsCreateOpen(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error : 'Could not create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm(`Delete “${project.name}”? This cannot be undone.`)) return;
    setDeletingId(project.id);
    try {
      await deleteProject(project.id);
      setProjects((current) => current.filter(({ id }) => id !== project.id));
    } catch (error) {
      setLoadError(error instanceof Error ? error : 'Could not delete project');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="projects-page">
      <div className="projects-heading">
        <div>
          <p className="section-label">Overview</p>
          <h1>Projects</h1>
          <p>Organize browser flows and keep every automation easy to find.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}>
          <span aria-hidden="true">+</span>
          New project
        </button>
      </div>

      <div className="projects-toolbar">
        <label className="search-field">
          <span className="search-icon" aria-hidden="true" />
          <span className="sr-only">Search projects</span>
          <input
            type="search"
            placeholder="Search projects"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <span className="project-count">
          {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
        </span>
      </div>

      {loadError ? (
        <div className="empty-state empty-state--error" role="alert">
          <h2>Could not load projects</h2>
          <ApiErrorMessage error={loadError} />
          <button className="secondary-button" type="button" onClick={() => void fetchProjects()}>Try again</button>
        </div>
      ) : isLoading ? (
        <div className="loading-state" role="status">Loading projects…</div>
      ) : filteredProjects.length > 0 ? (
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} isDeleting={deletingId === project.id} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{query ? 'No projects found' : 'No projects yet'}</h2>
          <p>{query ? 'Try another search term.' : 'Create your first project to get started.'}</p>
        </div>
      )}
      <CreateProjectDialog
        key={isCreateOpen ? 'open' : 'closed'}
        isOpen={isCreateOpen}
        isSubmitting={isCreating}
        error={createError}
        onClose={() => {
          if (isCreating) return;
          setIsCreateOpen(false);
          setCreateError(null);
        }}
        onSubmit={handleCreate}
      />
    </section>
  );
}
