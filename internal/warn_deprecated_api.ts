// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

// deno-lint-ignore no-explicit-any
const { Deno } = globalThis as any;

const ALREADY_WARNED_DEPRECATED = new Set<string>();

interface WarnDeprecatedApiConfig {
  /** The name of the deprecated API. */
  name: string;
  /** The stack trace of the deprecated API. */
  stack: string;
  /** The version in which the API will be removed. */
  version: string;
  /** An optional message to print. */
  message?: string;
}

/**
 * Prints a warning message to the console for the given deprecated API.
 *
 * These warnings can be disabled by setting `NO_DEPRECATION_WARNINGS=1`
 * in the current process.
 */
export function warnDeprecatedApi(config: WarnDeprecatedApiConfig) {
  if (
    Deno?.permissions.querySync({
        name: "env",
        variable: "NO_DEPRECATION_WARNINGS",
      }).state === "granted" &&
    Deno?.env.get("NO_DEPRECATION_WARNINGS") === "1"
  ) return;

  // Remove the prepending "Error\n" from the stack output.
  const stack = config.stack.slice(6);
  const key = config.name + stack;

  if (ALREADY_WARNED_DEPRECATED.has(key)) return;
  ALREADY_WARNED_DEPRECATED.add(key);

  console.log(
    "%cWarning",
    "color: yellow;",
    `Use of deprecated API \`${config.name}\`. This API will be removed in ${config.version} of the Deno Standard Library.`,
    config.message ?? "",
    "\n" + stack,
  );
}
