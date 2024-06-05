// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

export const isWindows: boolean = getIsWindows() === true;

function getIsWindows(): boolean | true {
  return getIsWindowsOnDeno() ?? getIsWindowsOnBrowser() ?? false;
}

function getIsWindowsOnDeno(): boolean | undefined {
  // deno-lint-ignore no-explicit-any
  const { Deno } = globalThis as any;
  if (typeof Deno?.build?.os === "string") {
    return Deno.build.os === "windows";
  }
}

function getIsWindowsOnBrowser(): boolean | undefined {
  // deno-lint-ignore no-explicit-any
  const { navigator } = globalThis as any;
  if (navigator?.userAgent?.includes?.("Windows")) {
    return true;
  }
}
