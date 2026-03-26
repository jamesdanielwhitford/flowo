/**
 * Workflow class for flowo.
 *
 * Steps must be schema-declared before they are registered:
 *
 *   workflow.defineSchema("myStep", { required: ["userId"] });
 *   workflow.addStep("myStep", async (input, bag, ctx) => { ... });
 *
 * Calling addStep without a prior defineSchema call throws SchemaNotDefinedError.
 * Return values from step handlers are ignored — use the bag for inter-step state.
 *
 * Retry configuration is set on the workflow, not on individual steps:
 *
 *   const workflow = new Workflow({ name: "...", triggerName: "...", retries: 3 });
 */

import { SchemaDefinition, StepDefinition, StepHandler, WorkflowDefinition } from "./types";
import { SchemaNotDefinedError } from "./errors";

export interface WorkflowOptions {
  name: string;
  triggerName: string;
  /**
   * Number of times to retry a failing step before marking the run as failed.
   * Applies to every step in this workflow. Default: 0 (no retries).
   */
  retries?: number;
  /**
   * Delay in milliseconds between retry attempts. Default: 1000.
   */
  retryDelayMs?: number;
}

export class Workflow {
  public readonly name: string;
  public readonly triggerName: string;
  public readonly retries: number;
  public readonly retryDelayMs: number;

  private schemaRegistry: Map<string, SchemaDefinition> = new Map();
  private stepList: StepDefinition[] = [];

  constructor(options: WorkflowOptions) {
    this.name = options.name;
    this.triggerName = options.triggerName;
    this.retries = options.retries ?? 0;
    this.retryDelayMs = options.retryDelayMs ?? 1000;
  }

  /**
   * Declare the input schema for a named step.
   * This must be called before addStep() for the same step name.
   */
  defineSchema(stepName: string, schema: SchemaDefinition): this {
    this.schemaRegistry.set(stepName, schema);
    return this;
  }

  /**
   * Register a step handler for an already-declared step name.
   * Throws SchemaNotDefinedError if defineSchema was not called first.
   */
  addStep(stepName: string, handler: StepHandler): this {
    if (!this.schemaRegistry.has(stepName)) {
      throw new SchemaNotDefinedError(stepName, this.name);
    }

    const schema = this.schemaRegistry.get(stepName)!;

    this.stepList.push({
      name: stepName,
      schema,
      handler,
    });

    return this;
  }

  /**
   * Build a WorkflowDefinition for the executor.
   * Called internally by the Runner.
   */
  toDefinition(): WorkflowDefinition {
    return {
      name: this.name,
      triggerName: this.triggerName,
      retries: this.retries,
      retryDelayMs: this.retryDelayMs,
      steps: [...this.stepList],
    };
  }

  get stepCount(): number {
    return this.stepList.length;
  }
}
