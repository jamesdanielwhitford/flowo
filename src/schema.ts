/**
 * Simple schema validation for flowo.
 * No external dependencies — validates required fields and basic types.
 */

import { SchemaDefinition } from "./types";
import { SchemaValidationError } from "./errors";

export function validateInput(
  stepName: string,
  input: unknown,
  schema: SchemaDefinition
): void {
  if (!schema.required || schema.required.length === 0) {
    return;
  }

  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new SchemaValidationError(stepName, schema.required);
  }

  const inputObj = input as Record<string, unknown>;
  const missingFields: string[] = [];

  for (const field of schema.required) {
    if (!(field in inputObj) || inputObj[field] === undefined || inputObj[field] === null) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new SchemaValidationError(stepName, missingFields);
  }

  // Type-check declared properties if present
  if (schema.properties) {
    for (const [propName, propDef] of Object.entries(schema.properties)) {
      if (!(propName in inputObj)) continue;

      const value = inputObj[propName];
      const expectedType = propDef.type;

      if (expectedType === "array" && !Array.isArray(value)) {
        throw new SchemaValidationError(stepName, [
          `${propName} (expected array, got ${typeof value})`,
        ]);
      } else if (expectedType !== "array" && typeof value !== expectedType) {
        throw new SchemaValidationError(stepName, [
          `${propName} (expected ${expectedType}, got ${typeof value})`,
        ]);
      }
    }
  }
}
