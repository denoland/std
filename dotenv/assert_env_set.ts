// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * Error thrown when a required environment variable is not set in the current
 * process.
 */
export class MissingEnvVarError extends Error {
  key: string;

  constructor(message: string, key: string) {
    super(message);
    this.name = "MissingEnvVarError";
    this.key = key;
  }
}

/**
 * Asserts that the given environment variable has been set in the current
 * process by throwing if it's not.
 *
 * Requires [--allow-env[=key] permissions]{@link https://docs.deno.com/runtime/manual/basics/permissions#environment-variables}.
 *
 * @example
 * ```ts
 * // Run with --allow-env=FOO permissions
 * import { assertEnvSet } from "https://deno.land/std@$STD_VERSION/dotenv/assert_env_set.ts";
 *
 * // Throws when the value of the "FOO" environment variable is not set.
 * assertEnvSet("FOO");
 * ```
 */
export function assertEnvSet(key: string) {
  if (!Deno.env.has(key)) {
    throw new MissingEnvVarError(
      `Missing environment variable: ${key}
      
      ${key}=<VALUE>
      `,
      key,
    );
  }
}
