/**
 * Trigger definitions for flowo.
 *
 * Triggers and workflows are registered separately on the Runner.
 * A trigger is linked to a workflow by matching names — the trigger
 * name referenced in a WorkflowDefinition must match a registered
 * TriggerDefinition.
 */

import { TriggerDefinition, TriggerPayload } from "./types";

export class Trigger {
  public readonly name: string;
  public readonly definition: TriggerDefinition;

  constructor(definition: TriggerDefinition) {
    this.name = definition.name;
    this.definition = definition;
  }

  /**
   * Build a payload object for this trigger firing.
   */
  buildPayload(data: unknown): TriggerPayload {
    return {
      triggerName: this.name,
      data,
      firedAt: new Date(),
    };
  }
}
