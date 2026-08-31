import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteProject, loadProject, updateProject } from '../api/projectsApi';
import { executeSteps, generateSteps, stopSteps } from '../../steps/api/stepsApi';
import type { Workflow } from '../../steps/types';
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
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedJson, setGeneratedJson] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const stopRequestedRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    loadProject(projectId, controller.signal)
      .then((loadedProject) => {
        setProject(loadedProject);
        setOriginalPrompt(loadedProject.originalPrompt);
        setGeneratedJson(loadedProject.steps ? JSON.stringify(loadedProject.steps, null, 2) : '');
      })
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

  const handleGenerate = async () => {
    if (!originalPrompt.trim()) return;
    setIsGenerating(true);
    setGenerationError(null);
    setSaveMessage(null);
    try {
      const workflow = await generateSteps(originalPrompt);
      setGeneratedJson(JSON.stringify(workflow, null, 2));
    } catch (caughtError) {
      setGenerationError(caughtError instanceof Error ? caughtError.message : 'Could not generate workflow steps');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!project || !originalPrompt.trim()) return;
    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const steps = generatedJson ? JSON.parse(generatedJson) as Workflow : null;
      const updatedProject = await updateProject(project.id, { originalPrompt, steps });
      setProject(updatedProject);
      setOriginalPrompt(updatedProject.originalPrompt);
      setGeneratedJson(updatedProject.steps ? JSON.stringify(updatedProject.steps, null, 2) : '');
      setSaveMessage('Saved');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not save project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecute = async () => {
    if (!project || !generatedJson) return;
    setIsExecuting(true);
    stopRequestedRef.current = false;
    setExecutionError(null);
    setExecutionResult(null);

    try {
      const workflow = JSON.parse(generatedJson) as Workflow;
      setExecutionResult(await executeSteps(project.id, workflow));
    } catch (caughtError) {
      if (stopRequestedRef.current) return;
      setExecutionError(caughtError instanceof Error ? caughtError.message : 'Could not execute workflow steps');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStop = async () => {
    if (!project) return;
    setIsStopping(true);
    setExecutionError(null);
    stopRequestedRef.current = true;

    try {
      await stopSteps(project.id);
      setExecutionResult('Browser session stopped');
    } catch (caughtError) {
      stopRequestedRef.current = false;
      setExecutionError(caughtError instanceof Error ? caughtError.message : 'Could not stop browser session');
    } finally {
      setIsStopping(false);
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
        <div className="detail-actions">
          <button className="secondary-button" type="button" disabled={isSaving || !originalPrompt.trim()} onClick={handleSave}>{isSaving ? 'Saving…' : 'Save'}</button>
          <button className="danger-button" type="button" disabled={isDeleting} onClick={handleDelete}>{isDeleting ? 'Deleting…' : 'Delete project'}</button>
        </div>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {saveMessage && <p className="save-message" role="status">{saveMessage}</p>}
      <div className="detail-panel">
        <div><span>Description</span><p>{project.description || 'No description provided.'}</p></div>
        <div className="original-prompt">
          <span>Original prompt</span>
          <textarea
            rows={10}
            maxLength={50000}
            value={originalPrompt}
            onChange={(event) => {
              setOriginalPrompt(event.target.value);
              setSaveMessage(null);
            }}
            placeholder="Enter the prompt that defines this project."
          />
          <div className="prompt-actions">
            <button className="primary-button" type="button" disabled={isGenerating || !originalPrompt.trim()} onClick={handleGenerate}>{isGenerating ? 'Generating…' : 'Generate'}</button>
          </div>
        </div>
        {generationError && <p className="form-error" role="alert">{generationError}</p>}
        <label className="generated-json-field">
          <span>Generated steps JSON <small>Saved with the project when you click Save</small></span>
          <textarea
            readOnly
            rows={16}
            value={generatedJson}
            placeholder="Click Generate to preview the workflow JSON. It is not saved yet."
          />
        </label>
        <div className="workflow-actions">
          <button className="primary-button" type="button" disabled={isExecuting || !generatedJson} onClick={handleExecute}>
            {isExecuting ? 'Executing…' : 'Execute'}
          </button>
          {isExecuting && (
            <button className="danger-button" type="button" disabled={isStopping} onClick={handleStop}>
              {isStopping ? 'Stopping…' : 'Stop'}
            </button>
          )}
        </div>
        {executionError && <p className="form-error" role="alert">{executionError}</p>}
        {executionResult && (
          <div className="execution-result" role="status">
            <span>Execution result</span>
            <pre>{executionResult}</pre>
          </div>
        )}
        <dl>
          <div><dt>Created</dt><dd>{formatDate(project.createdAt)}</dd></div>
          <div><dt>Last updated</dt><dd>{formatDate(project.updatedAt)}</dd></div>
          <div><dt>Project ID</dt><dd><code>{project.id}</code></dd></div>
        </dl>
      </div>
    </section>
  );
}
