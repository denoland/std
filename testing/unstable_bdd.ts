// Copyright 2018-2025 the Deno authors. MIT license.

import { globalSanitizersState } from "./_test_suite.ts";

export type ConfigureGlobalSanitizersOptions = {
  sanitizeOps?: boolean;
  sanitizeResources?: boolean;
  sanitizeExit?: boolean;
};

export function configureGlobalSanitizers(
  options: ConfigureGlobalSanitizersOptions,
): void {
  globalSanitizersState.sanitizeOps = options.sanitizeOps;
  globalSanitizersState.sanitizeResources = options.sanitizeResources;
  globalSanitizersState.sanitizeExit = options.sanitizeExit;
}
