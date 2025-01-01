// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
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

export function getNodeFsPromises() {
  return (globalThis as any).process.getBuiltinModule("node:fs/promises");
}
