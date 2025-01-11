// Copyright 2018-2025 the Deno authors. MIT license.
// deno-lint-ignore-file no-explicit-any

/**
 * True if the runtime is Deno, false otherwise.
 */
export const isDeno = navigator.userAgent?.includes("Deno");

/** True if the platform is windows, false otherwise */
export const isWindows = checkWindows();

/**
 * @returns true if the platform is Windows, false otherwise.
 */
function checkWindows(): boolean {
  if (typeof navigator !== "undefined" && (navigator as any).platform) {
    return (navigator as any).platform.startsWith("Win");
  } else if (typeof (globalThis as any).process !== "undefined") {
    return (globalThis as any).platform === "win32";
  }
  return false;
}

/**
 * @returns The Node.js `fs` module.
 */
export function getNodeFs() {
  return (globalThis as any).process.getBuiltinModule("node:fs");
}
