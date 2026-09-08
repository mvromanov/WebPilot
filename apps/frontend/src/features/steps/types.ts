type StepIdentity = { id: string };

export type WorkflowStep = StepIdentity & (
  | { type: 'goto'; url: string }
  | { type: 'gotoIfUrlMissing'; urlFragment: string; url: string }
  | { type: 'waitFor'; selector: string; timeoutMs: number; label: string }
  | { type: 'waitUntilHidden'; selector: string; pollMs: number; label: string }
  | { type: 'act'; instruction: string; scopeSelector?: string; label: string }
  | {
      type: 'extractText';
      instruction: string;
      sampleText?: string;
      resultType: 'text' | 'url' | 'json';
      resultShape: 'single' | 'array';
      selector?: string;
      timeoutMs: number;
      label: string;
    }
);

export type Workflow = {
  steps: WorkflowStep[];
};
