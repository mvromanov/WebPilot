import type { Workflow, WorkflowStep } from '../types';
import './WorkflowStepsEditor.css';

type Props = {
  workflow: Workflow | null;
  onChange: (workflow: Workflow) => void;
};

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

function StepFields({ step, onChange }: { step: WorkflowStep; onChange: (step: WorkflowStep) => void }) {
  const update = (field: string, value: string | number) => {
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
          <StepField label="Selector" value={step.selector} onChange={(value) => update('selector', value)} />
          <StepField label="Timeout (ms)" type="number" min={250} value={step.timeoutMs} onChange={(value) => update('timeoutMs', value)} />
        </>
      );
  }
}

export function WorkflowStepsEditor({ workflow, onChange }: Props) {
  const updateStep = (index: number, step: WorkflowStep) => {
    if (!workflow) return;
    const steps = workflow.steps.map((current, currentIndex) => currentIndex === index ? step : current);
    onChange({ steps });
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
              <section className="step-card" key={`${index}-${step.type}`}>
                <header>
                  <span className="step-number">{index + 1}</span>
                  <strong>{step.type}</strong>
                </header>
                <div className="step-fields">
                  <StepFields step={step} onChange={(updatedStep) => updateStep(index, updatedStep)} />
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
