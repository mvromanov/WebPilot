import { useState, type FormEvent } from 'react';
import type { CreateProjectInput } from '../types';

type Props = {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: CreateProjectInput) => Promise<void>;
};

export function CreateProjectDialog({ isOpen, isSubmitting, error, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ name, description, originalPrompt });
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="create-project-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-heading">
          <div><p className="section-label">New project</p><h2 id="create-project-title">Create a project</h2></div>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Name</span>
            <input autoFocus required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Customer onboarding" />
          </label>
          <label className="form-field">
            <span>Description <small>Optional</small></span>
            <textarea maxLength={1000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What will this project automate?" />
          </label>
          <label className="form-field">
            <span>Original prompt</span>
            <textarea required maxLength={50000} rows={6} value={originalPrompt} onChange={(event) => setOriginalPrompt(event.target.value)} placeholder="Paste the prompt that defines this project…" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={isSubmitting || !name.trim() || !originalPrompt.trim()}>{isSubmitting ? 'Creating…' : 'Create project'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
