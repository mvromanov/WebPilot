export type WorkflowStep =
  | { type: 'goto'; url: string }
  | { type: 'gotoIfUrlMissing'; urlFragment: string; url: string }
  | { type: 'waitFor'; selector: string; timeoutMs: number; label: string }
  | { type: 'waitUntilHidden'; selector: string; pollMs: number; label: string }
  | { type: 'act'; instruction: string; scopeSelector?: string; label: string }
  | { type: 'extractText'; selector: string; timeoutMs: number; label: string };

export type Workflow = {
  steps: WorkflowStep[];
};
