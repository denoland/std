// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

export const isWindows: boolean = getIsWindows() === true;

function getIsWindows(): boolean | undefined {
  return (
    getIsWindowsOnDeno() || getIsWindowsOnBrowser() || getIsWindowsOnNodeOrBun()
  );
}

/**
 * @returns whether the os is windows or undefined if not running
 * in a deno runtime, undefined if not a deno runtime.
 */
function getIsWindowsOnDeno(): boolean | undefined {
  const { Deno } = globalThis;
  if (typeof Deno?.build?.os === "string") {
    return Deno.build.os === "windows";
  }
}

/**
 * @returns whether the os is windows or undefined if not running
 * in a web browser, undefined if not a web browser
 */
function getIsWindowsOnBrowser(): boolean | undefined {
  const { navigator } = globalThis;

  return containsWindows(navigator?.userAgent);
}

/**
 * according to documentation node's os module is implemented
 * in bun as well.
 * {@link https://bun.sh/docs/runtime/nodejs-apis#node-os}
 *
 * @returns whether the os is windows or undefined if not running
 * on node or bun runtime
 */
function getIsWindowsOnNodeOrBun() {
  const os = tryGettingNodeOsModule();

  return containsWindows(os?.version());
}

type OsModule = {
  version(): string;
};

// deno-lint-ignore no-explicit-any
declare const require: any;

function tryGettingNodeOsModule(): OsModule | undefined {
  try {
    return getNodeOsModule();
  } catch {
    return undefined;
  }
}

function getNodeOsModule(): OsModule | undefined {
  if (require !== undefined) {
    return require("os");
  } else {
    return undefined;
  }
}

function containsWindows(s?: string): boolean | undefined {
  if (typeof s === "string") {
    return s.toUpperCase().includes("WINDOWS");
  } else {
    return undefined;
  }
}
