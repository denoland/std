// Copyright 2018-2026 the Deno authors. MIT license.

export function cwd(errorMessage: string): string {
  // deno-lint-ignore no-explicit-any
  const global = globalThis as any;
  const getCwd = global.process?.cwd ?? global.Deno?.cwd;
  if (typeof getCwd !== "function") {
    throw new TypeError(errorMessage);
  }
  return getCwd();
}
