export type StepArtifactKind = 'dom' | 'html';

export type StepArtifact = {
  id: string;
  projectId: string;
  stepId: string;
  kind: StepArtifactKind;
  contentHash: string;
  byteSize: number;
  createdAt: string;
};

export type StepArtifactWithContent = StepArtifact & {
  content: string;
};
