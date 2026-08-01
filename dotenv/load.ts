// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * Loads environment variables from a `.env` file into the process environment
 * as a side effect of importing this module.
 *
 * ```ts ignore
 * import "@std/dotenv/load";
 *
 * Deno.env.get("GREETING"); // "hello world"
 * ```
 *
 * @deprecated This will be removed in 0.227.0. Use the
 * {@link https://docs.deno.com/runtime/reference/env_variables/ | --env-file}
 * flag instead. See the
 * {@link https://jsr.io/@std/dotenv | module documentation} for migration
 * notes.
 *
 * @module
 */

import { loadSync } from "./mod.ts";

if (!(Deno.readTextFileSync instanceof Function)) {
  // Avoid errors that occur in deno deploy: https://github.com/denoland/std/issues/1957
  // deno-lint-ignore no-console
  console.warn(
    `Deno.readTextFileSync is not a function: No .env data was read.`,
  );
} else {
  loadSync({ export: true });
}
