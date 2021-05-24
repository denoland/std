// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
type THook = (fn: Function) => void | Promise<void>;
type HookType = "beforeEach" | "afterEach";

const hooks: Partial<Record<HookType, Function>> = {};

/**
 * Register new testing hooks.
 *
 * @param {THook} fn
 * @param {HookType} hookType
 */
function _addHook(fn: Function, hookType: HookType): void {
  if (typeof fn !== "function") {
    throw new TypeError(
      "Invalid first argument. It must be a callback function."
    );
  }
  if (typeof hookType !== "string") {
    throw new TypeError(
      `Invalid second argument, ${hookType}. It must be a string`
    );
  }
  hooks[hookType] = fn;
}
