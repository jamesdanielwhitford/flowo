/**
 * basic-workflow.ts
 *
 * A complete working example demonstrating the correct flowo patterns:
 *
 * 1. defineSchema() must be called before addStep() for each step.
 * 2. Triggers and workflows are registered separately on the Runner.
 * 3. Inter-step state is passed via the bag, not return values.
 * 4. Retry config (retries, retryDelayMs) is set on the Workflow, not on steps.
 * 5. runner.start() must be called before runner.fire().
 */

import { Workflow, Runner } from "../src/index";

// ---------------------------------------------------------------------------
// Step 1: Define the trigger
// ---------------------------------------------------------------------------

// Triggers are registered on the Runner, not embedded in workflow definitions.
const USER_SIGNUP_TRIGGER = "user.signup";

// ---------------------------------------------------------------------------
// Step 2: Build the workflow
// ---------------------------------------------------------------------------

// Retry config lives on the workflow, not on individual steps.
const onboardingWorkflow = new Workflow({
  name: "user-onboarding",
  triggerName: USER_SIGNUP_TRIGGER,
  retries: 2,
  retryDelayMs: 500,
});

// For each step: call defineSchema() first, then addStep().
// Skipping defineSchema() will throw SchemaNotDefinedError at runtime.

onboardingWorkflow.defineSchema("validateUser", {
  required: ["userId", "email"],
  properties: {
    userId: { type: "string", description: "Unique user identifier" },
    email: { type: "string", description: "User email address" },
  },
});

onboardingWorkflow.addStep("validateUser", async (input, bag, ctx) => {
  const data = input as { userId: string; email: string };

  console.log(`  [${ctx.stepName}] Validating user: ${data.userId}`);

  // State is stored in the bag — return values are NOT used for passing state.
  bag.userId = data.userId;
  bag.email = data.email;
  bag.validatedAt = new Date().toISOString();

  console.log(`  [${ctx.stepName}] User validated. Bag updated.`);
});

onboardingWorkflow.defineSchema("sendWelcomeEmail", {
  required: ["userId", "email"],
});

onboardingWorkflow.addStep("sendWelcomeEmail", async (input, bag, ctx) => {
  // Read state from the bag — not from the return value of the previous step.
  const userId = bag.userId as string;
  const email = bag.email as string;

  console.log(`  [${ctx.stepName}] Sending welcome email to ${email} (user: ${userId})`);

  // Simulate async work
  await new Promise((r) => setTimeout(r, 100));

  bag.welcomeEmailSentAt = new Date().toISOString();

  console.log(`  [${ctx.stepName}] Email sent. Step ${ctx.stepIndex + 1}/${ctx.totalSteps}`);
});

onboardingWorkflow.defineSchema("createDefaultSettings", {
  required: ["userId"],
});

onboardingWorkflow.addStep("createDefaultSettings", async (input, bag, ctx) => {
  const userId = bag.userId as string;

  console.log(`  [${ctx.stepName}] Creating default settings for user: ${userId}`);

  bag.settings = {
    theme: "light",
    notifications: true,
    createdAt: new Date().toISOString(),
  };

  console.log(`  [${ctx.stepName}] Settings created.`);
});

// ---------------------------------------------------------------------------
// Step 3: Set up the Runner
// ---------------------------------------------------------------------------

// Trigger registry and workflow registry are separate — they are linked by name.
const runner = new Runner({ name: "main-runner", verbose: true });

// Register the trigger independently.
runner.registerTrigger(USER_SIGNUP_TRIGGER, {
  name: USER_SIGNUP_TRIGGER,
  description: "Fires when a new user signs up",
  schema: {
    required: ["userId", "email"],
  },
});

// Register the workflow independently.
runner.registerWorkflow("user-onboarding", onboardingWorkflow);

// ---------------------------------------------------------------------------
// Step 4: Start runner and fire the trigger
// ---------------------------------------------------------------------------

async function main() {
  // Must call start() before fire() — otherwise RunnerNotStartedError is thrown.
  await runner.start();

  console.log("\n--- Firing trigger: user.signup ---\n");

  const result = await runner.fire(USER_SIGNUP_TRIGGER, {
    userId: "usr_abc123",
    email: "alice@example.com",
  });

  console.log("\n--- Run result ---");
  console.log(`Status:          ${result.status}`);
  console.log(`Run ID:          ${result.runId}`);
  console.log(`Steps executed:  ${result.stepsExecuted}`);
  console.log(`Bag snapshot:`);
  console.log(JSON.stringify(result.bag, null, 2));

  await runner.stop();
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
