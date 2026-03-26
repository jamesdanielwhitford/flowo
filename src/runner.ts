/**
 * Runner class for flowo.
 *
 * The Runner maintains two separate registries:
 * - Trigger registry: named TriggerDefinitions
 * - Workflow registry: Workflow instances keyed by workflow name
 *
 * They are linked by the triggerName field on each workflow definition.
 * Triggers and workflows must be registered independently:
 *
 *   runner.registerTrigger("user.signup", triggerDef);
 *   runner.registerWorkflow("onboarding", workflow);
 *
 * The runner must be started before firing triggers:
 *
 *   await runner.start();
 *   const result = await runner.fire("user.signup", { userId: "123" });
 */

import { TriggerDefinition, RunResult } from "./types";
import { Workflow } from "./workflow";
import { Trigger } from "./trigger";
import { executeWorkflow } from "./executor";
import {
  RunnerNotStartedError,
  TriggerNotFoundError,
  WorkflowNotFoundError,
} from "./errors";

export interface RunnerOptions {
  /**
   * Optional label for this runner instance, used in log output.
   */
  name?: string;
  /**
   * If true, log run results and step progress to stdout. Default: true.
   */
  verbose?: boolean;
}

export class Runner {
  private readonly label: string;
  private readonly verbose: boolean;

  private triggerRegistry: Map<string, Trigger> = new Map();
  private workflowRegistry: Map<string, Workflow> = new Map();

  /** Maps triggerName -> workflowName for quick lookup */
  private triggerToWorkflow: Map<string, string> = new Map();

  private started = false;

  constructor(options: RunnerOptions = {}) {
    this.label = options.name ?? "flowo-runner";
    this.verbose = options.verbose ?? true;
  }

  /**
   * Register a trigger definition.
   * Triggers must be registered before any workflow that references them is fired.
   */
  registerTrigger(name: string, definition: TriggerDefinition): this {
    const trigger = new Trigger({ ...definition, name });
    this.triggerRegistry.set(name, trigger);

    if (this.verbose) {
      console.log(`[${this.label}] Trigger registered: "${name}"`);
    }

    return this;
  }

  /**
   * Register a Workflow instance.
   * The workflow's triggerName must match a registered trigger.
   */
  registerWorkflow(name: string, workflow: Workflow): this {
    this.workflowRegistry.set(name, workflow);
    this.triggerToWorkflow.set(workflow.triggerName, name);

    if (this.verbose) {
      console.log(
        `[${this.label}] Workflow registered: "${name}" (trigger: "${workflow.triggerName}", steps: ${workflow.stepCount})`
      );
    }

    return this;
  }

  /**
   * Start the runner. Must be called before fire().
   * In a real system this would initialise queues, DB connections, etc.
   */
  async start(): Promise<void> {
    if (this.started) return;

    this.started = true;

    if (this.verbose) {
      console.log(`[${this.label}] Runner started.`);
      console.log(
        `[${this.label}] ${this.triggerRegistry.size} trigger(s), ${this.workflowRegistry.size} workflow(s) registered.`
      );
    }
  }

  /**
   * Fire a trigger by name with the given payload.
   * The runner executes the associated workflow synchronously and returns the result.
   *
   * Throws RunnerNotStartedError if start() has not been called.
   * Throws TriggerNotFoundError if the trigger name is not registered.
   * Throws WorkflowNotFoundError if no workflow is linked to this trigger.
   */
  async fire(triggerName: string, data: unknown): Promise<RunResult> {
    if (!this.started) {
      throw new RunnerNotStartedError();
    }

    const trigger = this.triggerRegistry.get(triggerName);
    if (!trigger) {
      throw new TriggerNotFoundError(triggerName);
    }

    const workflowName = this.triggerToWorkflow.get(triggerName);
    if (!workflowName) {
      throw new WorkflowNotFoundError(triggerName);
    }

    const workflow = this.workflowRegistry.get(workflowName)!;
    const payload = trigger.buildPayload(data);

    if (this.verbose) {
      console.log(
        `[${this.label}] Firing trigger "${triggerName}" -> workflow "${workflowName}"`
      );
    }

    const result = await executeWorkflow(workflow.toDefinition(), payload);

    if (this.verbose) {
      if (result.status === "success") {
        console.log(
          `[${this.label}] Run ${result.runId} completed successfully. ` +
            `Steps executed: ${result.stepsExecuted}`
        );
      } else {
        console.warn(
          `[${this.label}] Run ${result.runId} ${result.status}. ` +
            `Failed at step "${result.failedStep}": ${result.error}`
        );
      }
    }

    return result;
  }

  /**
   * Stop the runner (graceful shutdown hook for future use).
   */
  async stop(): Promise<void> {
    this.started = false;

    if (this.verbose) {
      console.log(`[${this.label}] Runner stopped.`);
    }
  }

  get isStarted(): boolean {
    return this.started;
  }
}
