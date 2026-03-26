/**
 * Custom error classes for flowo
 */

export class FlowoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlowoError";
    Object.setPrototypeOf(this, FlowoError.prototype);
  }
}

export class SchemaNotDefinedError extends FlowoError {
  constructor(stepName: string, workflowName: string) {
    super(
      `Schema for step "${stepName}" must be defined before calling addStep(). ` +
        `Call workflow.defineSchema("${stepName}", schema) first in workflow "${workflowName}".`
    );
    this.name = "SchemaNotDefinedError";
    Object.setPrototypeOf(this, SchemaNotDefinedError.prototype);
  }
}

export class SchemaValidationError extends FlowoError {
  public readonly missingFields: string[];

  constructor(stepName: string, missingFields: string[]) {
    super(
      `Schema validation failed for step "${stepName}". ` +
        `Missing required fields: ${missingFields.join(", ")}`
    );
    this.name = "SchemaValidationError";
    this.missingFields = missingFields;
    Object.setPrototypeOf(this, SchemaValidationError.prototype);
  }
}

export class TriggerNotFoundError extends FlowoError {
  constructor(triggerName: string) {
    super(
      `Trigger "${triggerName}" is not registered. ` +
        `Call runner.registerTrigger("${triggerName}", triggerDef) before firing.`
    );
    this.name = "TriggerNotFoundError";
    Object.setPrototypeOf(this, TriggerNotFoundError.prototype);
  }
}

export class WorkflowNotFoundError extends FlowoError {
  constructor(triggerName: string) {
    super(
      `No workflow registered for trigger "${triggerName}". ` +
        `Call runner.registerWorkflow(name, workflowDef) and ensure workflowDef.triggerName matches.`
    );
    this.name = "WorkflowNotFoundError";
    Object.setPrototypeOf(this, WorkflowNotFoundError.prototype);
  }
}

export class RunnerNotStartedError extends FlowoError {
  constructor() {
    super(
      `Runner has not been started. Call await runner.start() before firing triggers.`
    );
    this.name = "RunnerNotStartedError";
    Object.setPrototypeOf(this, RunnerNotStartedError.prototype);
  }
}

export class StepExecutionError extends FlowoError {
  public readonly stepName: string;
  public readonly attempt: number;
  public readonly cause: Error;

  constructor(stepName: string, attempt: number, cause: Error) {
    super(
      `Step "${stepName}" failed on attempt ${attempt}: ${cause.message}`
    );
    this.name = "StepExecutionError";
    this.stepName = stepName;
    this.attempt = attempt;
    this.cause = cause;
    Object.setPrototypeOf(this, StepExecutionError.prototype);
  }
}
