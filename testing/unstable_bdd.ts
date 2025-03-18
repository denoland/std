// Copyright 2018-2025 the Deno authors. MIT license.

import { globalSanitizersState } from "./_test_suite.ts";

/** Options for {@linkcode configureGlobalSanitizers}. */
export type ConfigureGlobalSanitizersOptions = {
  sanitizeOps?: boolean;
  sanitizeResources?: boolean;
  sanitizeExit?: boolean;
};

/**
 * Configures the global sanitizers.
 * @param options The options
 * @example Usage
 * ```ts no-assert
 * import { configureGlobalSanitizers } from "@std/testing/unstable-bdd";
 * configureGlobalSanitizers({ sanitizeResources: false })
 * ```
 */
export function configureGlobalSanitizers(
  options: ConfigureGlobalSanitizersOptions,
): void {
  globalSanitizersState.sanitizeOps = options.sanitizeOps;
  globalSanitizersState.sanitizeResources = options.sanitizeResources;
  globalSanitizersState.sanitizeExit = options.sanitizeExit;
}
