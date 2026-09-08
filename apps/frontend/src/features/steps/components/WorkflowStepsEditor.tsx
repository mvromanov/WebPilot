import type { Workflow, WorkflowStep } from '../types';
import { StepArtifactsPanel } from './StepArtifactsPanel';
import './WorkflowStepsEditor.css';

type Props = {
  projectId: string;
  workflow: Workflow | null;
  onChange: (workflow: Workflow) => void;
  onEnsureSaved: () => Promise<boolean>;
};

const stepTypes: WorkflowStep['type'][] = [
  'goto',
  'gotoIfUrlMissing',
  'waitFor',
  'waitUntilHidden',
  'act',
  'extractText',
];

function createStep(type: WorkflowStep['type'] = 'goto'): WorkflowStep {
  const id = crypto.randomUUID();
  switch (type) {
    case 'goto':
      return { id, type, url: '' };
    case 'gotoIfUrlMissing':
      return { id, type, urlFragment: '', url: '' };
    case 'waitFor':
      return { id, type, selector: '', timeoutMs: 15_000, label: 'Wait for element' };
    case 'waitUntilHidden':
      return { id, type, selector: '', pollMs: 1_000, label: 'Wait until hidden' };
    case 'act':
      return { id, type, instruction: '', label: 'Perform action' };
    case 'extractText':
      return {
        id,
        type,
        instruction: '',
        resultType: 'text',
        resultShape: 'single',
        selector: '',
        timeoutMs: 15_000,
        label: 'Extract result',
      };
  }
}

function changeStepType(step: WorkflowStep, type: WorkflowStep['type']): WorkflowStep {
  const url = 'url' in step ? step.url : '';
  const selector = 'selector' in step ? step.selector ?? '' : '';
  const label = 'label' in step ? step.label : '';
  const timeoutMs = 'timeoutMs' in step ? step.timeoutMs : 15_000;

  switch (type) {
    case 'goto':
      return { id: step.id, type, url };
    case 'gotoIfUrlMissing':
      return {
        type,
        id: step.id,
        urlFragment: step.type === 'gotoIfUrlMissing' ? step.urlFragment : '',
        url,
      };
    case 'waitFor':
      return { id: step.id, type, selector, timeoutMs, label: label || 'Wait for element' };
    case 'waitUntilHidden':
      return {
        type,
        id: step.id,
        selector,
        pollMs: step.type === 'waitUntilHidden' ? step.pollMs : 1_000,
        label: label || 'Wait until hidden',
      };
    case 'act':
      return {
        type,
        id: step.id,
        instruction: step.type === 'act' ? step.instruction : '',
        label: label || 'Perform action',
      };
    case 'extractText':
      return {
        id: step.id,
        type,
        instruction: step.type === 'extractText' ? step.instruction : '',
        ...(step.type === 'extractText' && step.sampleText ? { sampleText: step.sampleText } : {}),
        resultType: step.type === 'extractText' ? step.resultType : 'text',
        resultShape: step.type === 'extractText' ? step.resultShape : 'single',
        selector,
        timeoutMs,
        label: label || 'Extract result',
      };
  }
}

type FieldProps = {
  label: string;
  value: string | number;
  type?: 'text' | 'number';
  min?: number;
  onChange: (value: string | number) => void;
};

function StepField({ label, value, type = 'text', min, onChange }: FieldProps) {
  return (
    <label className="step-field">
      <span>{label}</span>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(type === 'number' ? Number(event.target.value) : event.target.value)}
      />
    </label>
  );
}

function StepSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="step-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function StepFields({ step, onChange }: { step: WorkflowStep; onChange: (step: WorkflowStep) => void }) {
  const update = (field: string, value: string | number) => {
    if (field === 'sampleText' && value === '') {
      const updatedStep = { ...step } as WorkflowStep & { sampleText?: string };
      delete updatedStep.sampleText;
      onChange(updatedStep);
      return;
    }
    onChange({ ...step, [field]: value } as WorkflowStep);
  };

  switch (step.type) {
    case 'goto':
      return <StepField label="URL" value={step.url} onChange={(value) => update('url', value)} />;
    case 'gotoIfUrlMissing':
      return (
        <>
          <StepField label="URL fragment" value={step.urlFragment} onChange={(value) => update('urlFragment', value)} />
          <StepField label="Fallback URL" value={step.url} onChange={(value) => update('url', value)} />
        </>
      );
    case 'waitFor':
      return (
        <>
          <StepField label="Label" value={step.label} onChange={(value) => update('label', value)} />
          <StepField label="Selector" value={step.selector} onChange={(value) => update('selector', value)} />
          <StepField label="Timeout (ms)" type="number" min={250} value={step.timeoutMs} onChange={(value) => update('timeoutMs', value)} />
        </>
      );
    case 'waitUntilHidden':
      return (
        <>
          <StepField label="Label" value={step.label} onChange={(value) => update('label', value)} />
          <StepField label="Selector" value={step.selector} onChange={(value) => update('selector', value)} />
          <StepField label="Polling interval (ms)" type="number" min={250} value={step.pollMs} onChange={(value) => update('pollMs', value)} />
        </>
      );
    case 'act':
      return (
        <>
          <StepField label="Label" value={step.label} onChange={(value) => update('label', value)} />
          <StepField label="Instruction" value={step.instruction} onChange={(value) => update('instruction', value)} />
          <StepField label="Scope selector (optional)" value={step.scopeSelector ?? ''} onChange={(value) => update('scopeSelector', value)} />
        </>
      );
    case 'extractText':
      return (
        <>
          <StepField label="Label" value={step.label} onChange={(value) => update('label', value)} />
          <StepField label="Instruction" value={step.instruction} onChange={(value) => update('instruction', value)} />
          <StepField label="Sample text (optional)" value={step.sampleText ?? ''} onChange={(value) => update('sampleText', value)} />
          <StepSelect
            label="Result type"
            value={step.resultType}
            options={[
              { value: 'text', label: 'Plain text' },
              { value: 'url', label: 'URL' },
              { value: 'json', label: 'JSON object' },
            ]}
            onChange={(value) => update('resultType', value)}
          />
          <StepSelect
            label="Result shape"
            value={step.resultShape}
            options={[{ value: 'single', label: 'Single / flat' }, { value: 'array', label: 'Array' }]}
            onChange={(value) => update('resultShape', value)}
          />
          <StepField label="Scope selector (optional)" value={step.selector ?? ''} onChange={(value) => update('selector', value)} />
          <StepField label="Timeout (ms)" type="number" min={250} value={step.timeoutMs} onChange={(value) => update('timeoutMs', value)} />
        </>
      );
  }
}

export function WorkflowStepsEditor({ projectId, workflow, onChange, onEnsureSaved }: Props) {
  const updateStep = (index: number, step: WorkflowStep) => {
    if (!workflow) return;
    const steps = workflow.steps.map((current, currentIndex) => currentIndex === index ? step : current);
    onChange({ steps });
  };

  const insertStep = (index: number) => {
    if (!workflow) return;
    const steps = [...workflow.steps];
    steps.splice(index + 1, 0, createStep());
    onChange({ steps });
  };

  const deleteStep = (index: number) => {
    if (!workflow || workflow.steps.length === 1) return;
    onChange({ steps: workflow.steps.filter((_, currentIndex) => currentIndex !== index) });
  };

  return (
    <details className="steps-editor">
      <summary>
        <span>Visual step editor</span>
        <span className="steps-count">{workflow?.steps.length ?? 0} steps</span>
      </summary>
      <div className="steps-editor-content">
        {!workflow ? (
          <p className="steps-empty">Generate workflow JSON to edit its steps visually.</p>
        ) : (
          <div className="step-list">
            {workflow.steps.map((step, index) => (
              <section className="step-card" key={step.id}>
                <header>
                  <div className="step-identity">
                    <span className="step-number">{index + 1}</span>
                    <label className="step-type-field">
                      <span className="sr-only">Action for step {index + 1}</span>
                      <select
                        value={step.type}
                        onChange={(event) => updateStep(index, changeStepType(step, event.target.value as WorkflowStep['type']))}
                      >
                        {stepTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="step-card-actions">
                    <button type="button" onClick={() => insertStep(index)}>+ Insert after</button>
                    <button type="button" className="step-delete" disabled={workflow.steps.length === 1} onClick={() => deleteStep(index)}>Delete</button>
                  </div>
                </header>
                <div className="step-fields">
                  <StepFields step={step} onChange={(updatedStep) => updateStep(index, updatedStep)} />
                </div>
                <StepArtifactsPanel
                  projectId={projectId}
                  step={step}
                  onEnsureSaved={onEnsureSaved}
                  onStepChange={(updatedStep) => updateStep(index, updatedStep)}
                />
              </section>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
