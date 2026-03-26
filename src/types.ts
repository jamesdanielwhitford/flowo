/**
 * Shared TypeScript types for flowo
 */

export type StepHandler = (
  input: unknown,
  bag: Bag,
  context: StepContext
) => Promise<void> | void;

export interface StepDefinition {
  name: string;
  schema: SchemaDefinition;
  handler: StepHandler;
}

export interface SchemaDefinition {
  required?: string[];
  properties?: Record<string, PropertyDefinition>;
}

export interface PropertyDefinition {
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
}

export interface WorkflowDefinition {
  name: string;
  triggerName: string;
  retries?: number;
  retryDelayMs?: number;
  steps: StepDefinition[];
}

export interface TriggerDefinition {
  name: string;
  description?: string;
  schema?: SchemaDefinition;
}

export interface TriggerPayload {
  triggerName: string;
  data: unknown;
  firedAt: Date;
}

export interface Bag {
  [key: string]: unknown;
}

export interface StepContext {
  workflowName: string;
  stepName: string;
  stepIndex: number;
  totalSteps: number;
  triggeredAt: Date;
  runId: string;
}

export interface RunResult {
  runId: string;
  workflowName: string;
  triggerName: string;
  status: "success" | "failed" | "partial";
  stepsExecuted: number;
  failedStep?: string;
  error?: string;
  bag: Bag;
  startedAt: Date;
  completedAt: Date;
}
