/**
 * Step execution engine for flowo.
 *
 * Handles:
 * - Schema validation before each step runs
 * - Bag passing between steps (mutable, shared reference)
 * - Retry logic with configurable delay (retries configured on workflow, not steps)
 * - Run result reporting
 */

import { WorkflowDefinition, TriggerPayload, RunResult, Bag } from "./types";
import { WorkflowBag, createStepContext } from "./context";
import { validateInput } from "./schema";
import { StepExecutionError } from "./errors";
import crypto from "crypto";

function generateRunId(): string {
  return crypto.randomBytes(8).toString("hex");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeWorkflow(
  definition: WorkflowDefinition,
  payload: TriggerPayload
): Promise<RunResult> {
  const runId = generateRunId();
  const startedAt = new Date();
  const bag = new WorkflowBag();
  const maxAttempts = (definition.retries ?? 0) + 1;
  const retryDelayMs = definition.retryDelayMs ?? 1000;

  let stepsExecuted = 0;

  for (let i = 0; i < definition.steps.length; i++) {
    const step = definition.steps[i];
    const context = createStepContext(
      definition.name,
      step.name,
      i,
      definition.steps.length,
      payload.firedAt,
      runId
    );

    // Validate input against the step's schema
    validateInput(step.name, payload.data, step.schema);

    let lastError: Error | null = null;
    let succeeded = false;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Pass input, the shared bag, and context. Return value is intentionally ignored.
        await step.handler(payload.data, bag, context);
        succeeded = true;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < maxAttempts) {
          console.warn(
            `[flowo] Step "${step.name}" failed (attempt ${attempt}/${maxAttempts}). ` +
              `Retrying in ${retryDelayMs}ms...`
          );
          await delay(retryDelayMs);
        }
      }
    }

    if (!succeeded && lastError) {
      const stepErr = new StepExecutionError(step.name, maxAttempts, lastError);
      return {
        runId,
        workflowName: definition.name,
        triggerName: payload.triggerName,
        status: stepsExecuted > 0 ? "partial" : "failed",
        stepsExecuted,
        failedStep: step.name,
        error: stepErr.message,
        bag: bag.snapshot() as Bag,
        startedAt,
        completedAt: new Date(),
      };
    }

    stepsExecuted++;
  }

  return {
    runId,
    workflowName: definition.name,
    triggerName: payload.triggerName,
    status: "success",
    stepsExecuted,
    bag: bag.snapshot() as Bag,
    startedAt,
    completedAt: new Date(),
  };
}
