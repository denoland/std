// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// deno-lint-ignore-file no-explicit-any no-process-globals

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
  } else if (typeof process !== "undefined") {
    return process.platform === "win32";
  }
  return false;
}
