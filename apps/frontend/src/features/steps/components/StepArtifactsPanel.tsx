import { useState, type SyntheticEvent } from 'react';
import {
  createStepArtifact,
  deleteStepArtifact,
  listStepArtifacts,
  loadStepArtifact,
} from '../api/artifactsApi';
import type { StepArtifact, StepArtifactKind } from '../types/artifacts';
import './StepArtifactsPanel.css';

type Props = {
  projectId: string;
  stepId: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StepArtifactsPanel({ projectId, stepId }: Props) {
  const [artifacts, setArtifacts] = useState<StepArtifact[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [kind, setKind] = useState<StepArtifactKind>('dom');
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState<{ id: string; content: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifacts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setArtifacts(await listStepArtifacts(projectId, stepId));
      setHasLoaded(true);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not load artifacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    if (event.currentTarget.open && !hasLoaded && !isLoading) void fetchArtifacts();
  };

  const handleAdd = async () => {
    if (!content.trim()) return;
    setIsAdding(true);
    setError(null);
    try {
      const artifact = await createStepArtifact(projectId, stepId, kind, content);
      setArtifacts((current) => [artifact, ...current]);
      setContent('');
      setHasLoaded(true);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not add artifact');
    } finally {
      setIsAdding(false);
    }
  };

  const handlePreview = async (artifact: StepArtifact) => {
    if (preview?.id === artifact.id) {
      setPreview(null);
      return;
    }
    setError(null);
    try {
      const loaded = await loadStepArtifact(projectId, stepId, artifact.id);
      setPreview({ id: artifact.id, content: loaded.content });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not fetch artifact');
    }
  };

  const handleDelete = async (artifact: StepArtifact) => {
    if (!window.confirm(`Delete this ${artifact.kind.toUpperCase()} artifact?`)) return;
    setDeletingId(artifact.id);
    setError(null);
    try {
      await deleteStepArtifact(projectId, stepId, artifact.id);
      setArtifacts((current) => current.filter(({ id }) => id !== artifact.id));
      if (preview?.id === artifact.id) setPreview(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not delete artifact');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <details className="step-artifacts" onToggle={handleToggle}>
      <summary>
        Artifacts
        {hasLoaded && <span>{artifacts.length}</span>}
      </summary>
      <div className="artifact-panel-content">
        {hasLoaded && artifacts.length === 0 && (
          <div className="artifact-form">
            <div className="artifact-form-heading">
              <label>
                <span>Content type</span>
                <select value={kind} onChange={(event) => setKind(event.target.value as StepArtifactKind)}>
                  <option value="dom">DOM</option>
                  <option value="html">HTML</option>
                </select>
              </label>
              <span>{content.length.toLocaleString()} characters</span>
            </div>
            <textarea
              rows={7}
              maxLength={10_000_000}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Paste captured DOM or HTML here…"
            />
            <div className="artifact-form-actions">
              <button type="button" disabled={isAdding || !content.trim()} onClick={handleAdd}>
                {isAdding ? 'Adding…' : 'Add artifact'}
              </button>
            </div>
          </div>
        )}

        {error && <p className="artifact-error" role="alert">{error}</p>}
        {isLoading ? (
          <p className="artifact-empty">Loading artifacts…</p>
        ) : artifacts.length === 0 ? (
          <p className="artifact-empty">No artifacts stored for this step.</p>
        ) : (
          <div className="artifact-list">
            {artifacts.map((artifact) => (
              <article className="artifact-item" key={artifact.id}>
                <div>
                  <strong>{artifact.kind.toUpperCase()}</strong>
                  <span>{formatBytes(artifact.byteSize)} · {new Date(artifact.createdAt).toLocaleString()}</span>
                  <code title={artifact.contentHash}>{artifact.contentHash.slice(0, 12)}…</code>
                </div>
                <div className="artifact-actions">
                  <button type="button" onClick={() => void handlePreview(artifact)}>{preview?.id === artifact.id ? 'Hide' : 'View'}</button>
                  <button type="button" className="artifact-delete" disabled={deletingId === artifact.id} onClick={() => void handleDelete(artifact)}>{deletingId === artifact.id ? 'Deleting…' : 'Delete'}</button>
                </div>
                {preview?.id === artifact.id && <textarea readOnly rows={10} value={preview.content} />}
              </article>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
