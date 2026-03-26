/**
 * flowo — Lightweight workflow orchestration for Node.js
 *
 * Public API surface.
 */

export { Workflow } from "./workflow";
export type { WorkflowOptions } from "./workflow";

export { Runner } from "./runner";
export type { RunnerOptions } from "./runner";

export { Trigger } from "./trigger";

export { WorkflowBag, createStepContext } from "./context";

export {
  FlowoError,
  SchemaNotDefinedError,
  SchemaValidationError,
  TriggerNotFoundError,
  WorkflowNotFoundError,
  RunnerNotStartedError,
  StepExecutionError,
} from "./errors";

export type {
  StepHandler,
  StepDefinition,
  SchemaDefinition,
  PropertyDefinition,
  WorkflowDefinition,
  TriggerDefinition,
  TriggerPayload,
  Bag,
  StepContext,
  RunResult,
} from "./types";
