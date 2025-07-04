// Copyright 2018-2025 the Deno authors. MIT license.

export function checkWindows(): boolean {
  // deno-lint-ignore no-explicit-any
  const global = globalThis as any;
  const os = global.Deno?.build?.os;

  // Check Deno, then the remaining runtimes (e.g. Node, Bun and the browser)
  return typeof os === "string"
    ? os === "windows"
    : global.navigator?.platform?.startsWith("Win") ??
      global.process?.platform?.startsWith("win") ?? false;
}
