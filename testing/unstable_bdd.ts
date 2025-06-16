// Copyright 2018-2025 the Deno authors. MIT license.

import { globalSanitizersState } from "./_test_suite.ts";
import type { DescribeArgs, ItArgs, TestSuite } from "./bdd.ts";
import { describe as describe_, it as it_, test as test_ } from "./bdd.ts";

const describe = describe_ as typeof describe_ & describe;
const it = it_ as typeof it_ & it;
const test = test_ as typeof test_ & test;

// deno-lint-ignore deno-style-guide/naming-convention
interface describe {
  /**
   * Register a test case that is not yet implemented. Alias of `.ignore()`.
   */
  todo<T>(...args: DescribeArgs<T>): TestSuite<T>;
}

// deno-lint-ignore deno-style-guide/naming-convention
interface it {
  todo<T>(...args: ItArgs<T>): void;
}

// deno-lint-ignore deno-style-guide/naming-convention
interface test {
  todo<T>(...args: ItArgs<T>): void;
}

/** Options for {@linkcode configureGlobalSanitizers}. */
export type ConfigureGlobalSanitizersOptions = {
  sanitizeOps?: boolean;
  sanitizeResources?: boolean;
  sanitizeExit?: boolean;
};

/**
 * Configures the global sanitizers.
 * @param options The options
 * @example Usage
 * ```ts no-assert
 * import { configureGlobalSanitizers } from "@std/testing/unstable-bdd";
 * configureGlobalSanitizers({ sanitizeResources: false })
 * ```
 */
export function configureGlobalSanitizers(
  options: ConfigureGlobalSanitizersOptions,
): void {
  globalSanitizersState.sanitizeOps = options.sanitizeOps;
  globalSanitizersState.sanitizeResources = options.sanitizeResources;
  globalSanitizersState.sanitizeExit = options.sanitizeExit;
}

/**
 * Register a test suite that is not yet implemented.
 *
 * @example Usage
 * ```ts
 * import { describe, it, beforeAll } from "@std/testing/bdd";
 * import { assertEquals } from "@std/assert";
 *
 * describe.todo("example");
 * ```
 *
 * @param args The test suite body
 */
describe.todo = function describeTodo<T>(
  ...args: DescribeArgs<T>
): TestSuite<T> {
  return describe.ignore(...args);
};

/**
 * Register a test case that is not yet implemented.
 *
 * @example Usage
 * ```ts
 * import { describe, it } from "@std/testing/bdd";
 * import { assertEquals } from "@std/assert";
 *
 * describe("example", () => {
 *   it.todo("should pass", () => {});
 * });
 * ```
 *
 * @param args The test case
 */
it.todo = function itTodo<T>(...args: ItArgs<T>): void {
  it.ignore(...args);
};

/**
 * Register a test case that is not yet implemented.
 *
 * @example Usage
 * ```ts
 * import { describe, test } from "@std/testing/bdd";
 * import { assertEquals } from "@std/assert";
 *
 * describe("example", () => {
 *   test.todo("should pass", () => {});
 * });
 * ```
 *
 * @param args The test case
 */
test.todo = function itTodo<T>(...args: ItArgs<T>): void {
  it.todo(...args);
};

export { describe, it, test };
