// deno-lint-ignore-file no-explicit-any
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

// Check Deno, then the remaining runtimes (e.g. Node, Bun and the browser)
export const isWindows: boolean =
  (globalThis as any).Deno?.build.os === "windows" ||
  (globalThis as any).navigator?.platform?.startsWith("Win") ||
  (globalThis as any).process?.platform?.startsWith("win") ||
  false;
