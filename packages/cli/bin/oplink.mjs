#!/usr/bin/env node
// Oplink CLI entry point (ESM)
// Loads the built CLI from dist and runs the main command router.
import { runMain } from "../dist/run.mjs";

try {
  await runMain();
} catch (err) {
  console.error(err);
  process.exit(1);
}

