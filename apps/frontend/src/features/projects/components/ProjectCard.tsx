import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import type { Project } from '../types';

type ProjectCardProps = {
  project: Project;
  isDeleting: boolean;
  onDelete: (project: Project) => void;
};

const accents = ['#5d50e6', '#e0598b', '#df8c38', '#2c8d75', '#3d75cf'];

function getAccent(id: string) {
  const value = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return accents[value % accents.length];
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function ProjectCard({ project, isDeleting, onDelete }: ProjectCardProps) {
  const accent = getAccent(project.id);

  return (
    <article className="project-card">
      <div className="project-card-header">
        <div className="project-icon" style={{ '--project-accent': accent } as CSSProperties}>
          {project.name.charAt(0)}
        </div>
        <button className="project-delete" type="button" disabled={isDeleting} onClick={() => onDelete(project)} aria-label={`Delete ${project.name}`}>
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
      <h2><Link to={`/projects/${project.id}`}>{project.name}</Link></h2>
      <p>{project.description || 'No description provided.'}</p>
      <footer>Updated {formatUpdatedAt(project.updatedAt)}</footer>
    </article>
  );
}
