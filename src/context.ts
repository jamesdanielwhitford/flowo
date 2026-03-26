/**
 * Context and Bag classes for flowo step execution.
 *
 * The Bag is the primary mechanism for passing state between steps.
 * Steps receive the bag by reference and mutate it directly.
 * Return values from step handlers are ignored for state purposes.
 */

import { Bag, StepContext } from "./types";

export class WorkflowBag implements Bag {
  [key: string]: unknown;

  constructor(initial?: Partial<Bag>) {
    if (initial) {
      Object.assign(this, initial);
    }
  }

  /**
   * Merge a plain object into the bag.
   */
  merge(data: Record<string, unknown>): void {
    Object.assign(this, data);
  }

  /**
   * Return a snapshot of the bag as a plain object.
   */
  snapshot(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(this)) {
      out[key] = this[key];
    }
    return out;
  }
}

export function createStepContext(
  workflowName: string,
  stepName: string,
  stepIndex: number,
  totalSteps: number,
  triggeredAt: Date,
  runId: string
): StepContext {
  return {
    workflowName,
    stepName,
    stepIndex,
    totalSteps,
    triggeredAt,
    runId,
  };
}
