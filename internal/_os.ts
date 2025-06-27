// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

// Check Deno, then the remaining runtimes (e.g. Node, Bun and the browser)
export const isWindows: boolean = checkWindows();

export function checkWindows(): boolean {
  // deno-lint-ignore no-explicit-any
  const global = globalThis as any;
  const os = global.Deno?.build?.os;

  return typeof os === "string"
    ? os === "windows"
    : global.navigator?.platform?.startsWith("Win") ??
      global.process?.platform?.startsWith("win") ?? false;
}
