// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

export const isWindows: boolean = getIsWindows() === true;

function getIsWindows(): boolean | true {
  return (
    getIsWindowsOnDeno() ??
    getIsWindowsOnBrowser() ??
    getIsWindowsOnNodeOrBun() ??
    false
  );
}

/**
 * @returns whether the os is windows or undefined if not running
 * in a deno runtime
 */
function getIsWindowsOnDeno(): boolean | undefined {
  // deno-lint-ignore no-explicit-any
  const { Deno } = globalThis as any;
  if (typeof Deno?.build?.os === "string") {
    return Deno.build.os === "windows";
  }
}

/**
 * @returns whether the os is windows or undefined if not running
 * in a web browser
 */
function getIsWindowsOnBrowser(): boolean | undefined {
  // deno-lint-ignore no-explicit-any
  const { navigator } = globalThis as any;
  if (navigator?.userAgent?.includes?.("windows")) {
    return true;
  }
}

/**
 * according to documentation node's os module is implemented
 * in bun as well.
 * {@link https://bun.sh/docs/runtime/nodejs-apis#node-os}
 *
 * @returns whether the os is windows or undefined if not running
 * on node or bun runtime
 */
function getIsWindowsOnNodeOrBun(): boolean | undefined {
  // deno-lint-ignore no-explicit-any
  const { navigator } = globalThis as any;
  if (navigator?.os?.version()?.includes?.("windows")) {
    return true;
  }
}
