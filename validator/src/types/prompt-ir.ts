export interface PromptIrProject {
  name: string;
  nmlVersion: string;
  style?: string;
  pov?: string;
  detailLevel?: number;
}

export interface PromptIrChapter {
  index: number;
  title: string;
  targetWords?: number;
  goal?: string;
  hook?: string;
  styleTemplateRef?: string;
}

export interface PromptIrRatio {
  description?: number;
  dialogue?: number;
  action?: number;
  psychology?: number;
}

export interface PromptIrSceneEnding {
  type?: string;
  beat?: string;
}

export interface PromptIrInfoPoint {
  type?: string;
  weight?: number;
  text: string;
}

export interface PromptIrState {
  role: string;
  phase: string;
  stamina?: string;
  mood?: string;
}

export interface PromptIrRelationState {
  role: string;
  target: string;
  phase: string;
  strength: number;
  type?: string;
}

export interface PromptIrSegment {
  index?: number;
  targetWords?: number;
  func?: string;
  focus?: string;
  pace?: string;
  povRole?: string;
  dialogueRatio?: number;
  actionRatio?: number;
  infoPoints: PromptIrInfoPoint[];
  states: PromptIrState[];
  relationStates: PromptIrRelationState[];
}

export interface PromptIrScene {
  id: string;
  locationRef: string;
  locationName?: string;
  povRole?: string;
  pace?: string;
  atmosphere: string[];
  targetWords?: number;
  task: string;
  mustMention: string[];
  mustNotMention: string[];
  ratio?: PromptIrRatio;
  segments: PromptIrSegment[];
  ending?: PromptIrSceneEnding;
}

export interface PromptIR {
  irVersion: string;
  project: PromptIrProject;
  chapter: PromptIrChapter;
  scenes: PromptIrScene[];
  normalized: PromptIrNormalized;
  resolvedConstraints: PromptIrResolvedConstraints;
  generationPlan: PromptIrGenerationStep[];
  acceptancePlan: PromptIrAcceptanceCheck[];
}

export interface PromptIrNormalizedScene {
  sceneId: string;
  pace?: string;
  paceStages: string[];
  atmosphere: string[];
  mustMention: string[];
  mustNotMention: string[];
  overlapMentions: string[];
  segmentFunctions: string[];
}

export interface PromptIrUnknownToken {
  scope: string;
  field: string;
  raw: string;
}

export interface PromptIrNormalized {
  scenes: PromptIrNormalizedScene[];
  unknownTokens: PromptIrUnknownToken[];
}

export interface PromptIrConstraintItem {
  scope: string;
  code: string;
  detail: string;
}

export interface PromptIrResolvedConstraints {
  priorityOrder: string[];
  hardConstraints: PromptIrConstraintItem[];
  softConstraints: PromptIrConstraintItem[];
  conflictResolutions: PromptIrConstraintItem[];
}

export interface PromptIrGenerationStep {
  sceneId: string;
  stepNo: number;
  label: string;
  targetWords?: number;
  guidance: string;
}

export interface PromptIrAcceptanceCheck {
  scope: string;
  check: string;
  required: boolean;
}
