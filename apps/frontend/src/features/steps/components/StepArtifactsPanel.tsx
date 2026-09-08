import { useState, type SyntheticEvent } from 'react';
import {
  createStepArtifact,
  deleteStepArtifact,
  findExtractionInstruction,
  findLocatorOptions,
  listStepArtifacts,
  loadStepArtifact,
} from '../api/artifactsApi';
import type { ExtractionInstructionSuggestion, LocatorOption, StepArtifact, StepArtifactKind } from '../types/artifacts';
import type { WorkflowStep } from '../types';
import './StepArtifactsPanel.css';

type Props = {
  projectId: string;
  step: WorkflowStep;
  onEnsureSaved: () => Promise<boolean>;
  onStepChange: (step: WorkflowStep) => void;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StepArtifactsPanel({ projectId, step, onEnsureSaved, onStepChange }: Props) {
  const stepId = step.id;
  const [artifacts, setArtifacts] = useState<StepArtifact[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [locatingId, setLocatingId] = useState<string | null>(null);
  const [findingInstructionId, setFindingInstructionId] = useState<string | null>(null);
  const [kind, setKind] = useState<StepArtifactKind>('dom');
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState<{ id: string; content: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locatorResults, setLocatorResults] = useState<Record<string, LocatorOption[]>>({});
  const [instructionSuggestions, setInstructionSuggestions] = useState<Record<string, ExtractionInstructionSuggestion[]>>({});
  const supportsLocators = step.type !== 'goto' && step.type !== 'gotoIfUrlMissing';

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
      if (!await onEnsureSaved()) {
        setError('Save the project before adding this artifact.');
        return;
      }
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
      setLocatorResults((current) => {
        const next = { ...current };
        delete next[artifact.id];
        return next;
      });
      setInstructionSuggestions((current) => {
        const next = { ...current };
        delete next[artifact.id];
        return next;
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not delete artifact');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFindLocators = async (artifact: StepArtifact) => {
    setLocatingId(artifact.id);
    setError(null);
    try {
      const options = await findLocatorOptions(projectId, stepId, artifact.id, step);
      setLocatorResults((current) => ({ ...current, [artifact.id]: options }));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not find locator options');
    } finally {
      setLocatingId(null);
    }
  };

  const handleFindInstruction = async (artifact: StepArtifact) => {
    setFindingInstructionId(artifact.id);
    setError(null);
    try {
      const suggestions = await findExtractionInstruction(projectId, stepId, artifact.id, step);
      setInstructionSuggestions((current) => ({ ...current, [artifact.id]: suggestions }));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not find an extraction instruction');
    } finally {
      setFindingInstructionId(null);
    }
  };

  const applyLocator = (locator: string) => {
    switch (step.type) {
      case 'act':
        onStepChange({ ...step, scopeSelector: locator });
        break;
      case 'waitFor':
      case 'waitUntilHidden':
      case 'extractText':
        onStepChange({ ...step, selector: locator });
        break;
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
                  {step.type === 'extractText' && (
                    <button
                      type="button"
                      className="artifact-link-action"
                      disabled={findingInstructionId === artifact.id}
                      onClick={() => void handleFindInstruction(artifact)}
                    >
                      {findingInstructionId === artifact.id ? 'Finding…' : 'Find instruction'}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!supportsLocators || locatingId === artifact.id}
                    title={supportsLocators ? 'Find stable locator options' : `${step.type} does not target a DOM element`}
                    onClick={() => void handleFindLocators(artifact)}
                  >
                    {locatingId === artifact.id ? 'Finding…' : 'Find Locator'}
                  </button>
                  <button type="button" onClick={() => void handlePreview(artifact)}>{preview?.id === artifact.id ? 'Hide' : 'View'}</button>
                  <button type="button" className="artifact-delete" disabled={deletingId === artifact.id} onClick={() => void handleDelete(artifact)}>{deletingId === artifact.id ? 'Deleting…' : 'Delete'}</button>
                </div>
                {preview?.id === artifact.id && <textarea readOnly rows={10} value={preview.content} />}
                {locatorResults[artifact.id] && (
                  <div className="locator-results">
                    <div className="locator-results-heading">
                      <strong>Ranked locator options</strong>
                      <span>Most stable first</span>
                    </div>
                    {locatorResults[artifact.id].map((option) => (
                      <section className="locator-option" key={`${option.rank}-${option.locator}`}>
                        <div className="locator-rank">#{option.rank}</div>
                        <div className="locator-option-content">
                          <code>{option.locator}</code>
                          <p><strong>Targets:</strong> {option.targets}</p>
                          <p>{option.whyUseIt}</p>
                        </div>
                        <div className="locator-option-actions">
                          <div className="stability-score" title="Stability score">
                            <strong>{option.stabilityScore}</strong><span>/100</span>
                          </div>
                          <button type="button" onClick={() => applyLocator(option.locator)}>Apply</button>
                        </div>
                      </section>
                    ))}
                  </div>
                )}
                {instructionSuggestions[artifact.id] && step.type === 'extractText' && (
                  <div className="instruction-suggestions">
                    <div className="instruction-suggestions-heading">
                      <strong>Ranked instruction suggestions</strong>
                      <span>Best match first</span>
                    </div>
                    {instructionSuggestions[artifact.id].map((suggestion) => (
                      <section className="instruction-suggestion" key={`${suggestion.rank}-${suggestion.instruction}`}>
                        <div className="instruction-rank">#{suggestion.rank}</div>
                        <div>
                          <p>{suggestion.instruction}</p>
                          <small>{suggestion.why}</small>
                        </div>
                        <button
                          type="button"
                          onClick={() => onStepChange({ ...step, instruction: suggestion.instruction })}
                        >
                          Apply
                        </button>
                      </section>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
