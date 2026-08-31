import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteProject, loadProject } from '../api/projectsApi';
import type { Project } from '../types';
import './ProjectDetailPage.css';

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value));
}

export function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadProject(projectId, controller.signal)
      .then(setProject)
      .catch((caughtError: unknown) => {
        if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return;
        setError(caughtError instanceof Error ? caughtError.message : 'Could not load project');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [projectId]);

  const handleDelete = async () => {
    if (!project || !window.confirm(`Delete “${project.name}”? This cannot be undone.`)) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteProject(project.id);
      navigate('/');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not delete project');
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="loading-state" role="status">Loading project…</div>;
  if (error && !project) {
    return (
      <div className="empty-state empty-state--error" role="alert">
        <h1>Project unavailable</h1><p>{error}</p>
        <Link className="secondary-button button-link" to="/">Back to projects</Link>
      </div>
    );
  }
  if (!project) return null;

  return (
    <section className="project-detail">
      <Link className="back-link" to="/">← Projects</Link>
      <div className="detail-heading">
        <div><p className="section-label">Project</p><h1>{project.name}</h1></div>
        <button className="danger-button" type="button" disabled={isDeleting} onClick={handleDelete}>{isDeleting ? 'Deleting…' : 'Delete project'}</button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="detail-panel">
        <div><span>Description</span><p>{project.description || 'No description provided.'}</p></div>
        <dl>
          <div><dt>Created</dt><dd>{formatDate(project.createdAt)}</dd></div>
          <div><dt>Last updated</dt><dd>{formatDate(project.updatedAt)}</dd></div>
          <div><dt>Project ID</dt><dd><code>{project.id}</code></dd></div>
        </dl>
      </div>
    </section>
  );
}
