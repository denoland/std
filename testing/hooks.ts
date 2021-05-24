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

/**
 * Helper function to execute registred hooks.
 */
export const withHooks = (fn: () => void | Promise<void>) => () => {
  if (typeof fn !== "function") {
    throw new TypeError(
      "Invalid first argument. It must be a callback function."
    );
  }
  if (hooks.beforeEach) {
    hooks.beforeEach();
  }
  // execute the callback function
  fn();
  if (hooks.afterEach) {
    hooks.afterEach();
  }
};

/**
 * INFO:
 * Runs a function before each of the tests.
 * If the function returns a promise or is a generator,
 * Deno aits for that promise to resolve before running the test.
 * `fn` can be async if required.
 */
export const beforeEach: THook = (fn) => _addHook(fn, "beforeEach");
/**
 * INFO:
 * Runs a function after each of the tests.
 * `fn` can be async if required.
 */
export const afterEach: THook = (fn) => _addHook(fn, "afterEach");
