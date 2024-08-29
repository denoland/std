// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

// deno-lint-ignore no-explicit-any
const { process, Deno } = globalThis as any;

// TODO(iuioiua): Simplify if `process` becomes a global in Deno
// Check Deno, then the browser, then Node and Bun
export const isWindows = Deno?.build.os === "windows" ||
  navigator.userAgent.includes("Windows") ||
  process?.platform === "win32";
