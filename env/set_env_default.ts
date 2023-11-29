// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * Sets a default value for the given environment variable, if one is not
 * already set.
 *
 * Requires [--allow-env[=key] permissions]{@link https://docs.deno.com/runtime/manual/basics/permissions#environment-variables}.
 *
 * @example
 * ```ts
 * // Run with --allow-env=FOO permissions
 * import { setEnvDefault } from "https://deno.land/std@$STD_VERSION/env/set_env_default.ts";
 *
 * // Sets the value of the `FOO` environment variable to `BAR` if not already
 * // set.
 * setEnvDefault("FOO", "BAR");
 * ```
 */
export function setEnvDefault(key: string, defaultValue: string) {
  if (!Deno.env.has(key)) Deno.env.set(key, defaultValue);
}
