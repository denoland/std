// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Check the test suite internal state
 *
 * @example Usage
 * ```ts ignore
 * import { AssertionState } from "@std/internal";
 *
 * const assertionState = new AssertionState();
 * ```
 */
export class AssertionState {
  #state: {
    assertionCount: number | undefined;
    assertionCheck: boolean;
    assertionTriggered: boolean;
    assertionTriggeredCount: number;
  };

  constructor() {
    this.#state = {
      assertionCount: undefined,
      assertionCheck: false,
      assertionTriggered: false,
      assertionTriggeredCount: 0,
    };

    if (typeof globalThis?.addEventListener === "function") {
      globalThis.addEventListener("unload", () => {
        this.#ensureCleanedUp();
      });
    } else if (
      // deno-lint-ignore no-explicit-any
      typeof (globalThis as any)?.process?.on === "function"
    ) {
      // deno-lint-ignore no-explicit-any
      (globalThis as any).process.on("exit", () => {
        this.#ensureCleanedUp();
      });
    } else {
      // deno-lint-ignore no-console
      console.warn("AssertionCounter cleanup step was not registered");
    }
  }

  #ensureCleanedUp() {
    // If any checks were registered, after the test suite runs the checks,
    // `resetAssertionState` should also have been called. If it was not,
    // then the test suite did not run the checks.
    if (
      this.#state.assertionCheck ||
      this.#state.assertionCount !== undefined
    ) {
      throw new Error(
        "AssertionCounter was not cleaned up: If tests are not otherwise failing, ensure `expect.hasAssertion` and `expect.assertions` are only run in bdd tests",
      );
    }
  }

  /**
   * Get the number that through `expect.assertions` api set.
   *
   * @returns the number that through `expect.assertions` api set.
   *
   * @example Usage
   * ```ts ignore
   * import { AssertionState } from "@std/internal";
   *
   * const assertionState = new AssertionState();
   * assertionState.assertionCount;
   * ```
   */
  get assertionCount(): number | undefined {
    return this.#state.assertionCount;
  }

  /**
   * Get a certain number that assertions were called before.
   *
   * @returns return a certain number that assertions were called before.
   *
   * @example Usage
   * ```ts ignore
   * import { AssertionState } from "@std/internal";
   *
   * const assertionState = new AssertionState();
   * assertionState.assertionTriggeredCount;
   * ```
   */
  get assertionTriggeredCount(): number {
    return this.#state.assertionTriggeredCount;
  }

  /**
   * If `expect.hasAssertions` called, then through this method to update #state.assertionCheck value.
   *
   * @param val Set #state.assertionCheck's value
   *
   * @example Usage
   * ```ts ignore
   * import { AssertionState } from "@std/internal";
   *
   * const assertionState = new AssertionState();
   * assertionState.setAssertionCheck(true);
   * ```
   */
  setAssertionCheck(val: boolean) {
    this.#state.assertionCheck = val;
  }

  /**
   * If any matchers was called, `#state.assertionTriggered` will be set through this method.
   *
   * @param val Set #state.assertionTriggered's value
   *
   * @example Usage
   * ```ts ignore
   * import { AssertionState } from "@std/internal";
   *
   * const assertionState = new AssertionState();
   * assertionState.setAssertionTriggered(true);
   * ```
   */
  setAssertionTriggered(val: boolean) {
    this.#state.assertionTriggered = val;
  }

  /**
   * If `expect.assertions` called, then through this method to update #state.assertionCheck value.
   *
   * @param num Set #state.assertionCount's value, for example if the value is set 2, that means
   * you must have two assertion matchers call in your test suite.
   *
   * @example Usage
   * ```ts ignore
   * import { AssertionState } from "@std/internal";
   *
   * const assertionState = new AssertionState();
   * assertionState.setAssertionCount(2);
   * ```
   */
  setAssertionCount(num: number) {
    this.#state.assertionCount = num;
  }

  /**
   * If any matchers was called, `#state.assertionTriggeredCount` value will plus one internally.
   *
   * @example Usage
   * ```ts ignore
   * import { AssertionState } from "@std/internal";
   *
   * const assertionState = new AssertionState();
   * assertionState.updateAssertionTriggerCount();
   * ```
   */
  updateAssertionTriggerCount() {
    if (this.#state.assertionCount !== undefined) {
      this.#state.assertionTriggeredCount += 1;
    }
  }

  /**
   * Check Assertion internal state, if `#state.assertionCheck` is set true, but
   * `#state.assertionTriggered` is still false, then should throw an Assertion Error.
   *
   * @returns a boolean value, that the test suite is satisfied with the check. If not,
   * it should throw an AssertionError.
   *
   * @example Usage
   * ```ts ignore
   * import { AssertionState } from "@std/internal";
   *
   * const assertionState = new AssertionState();
   * if (assertionState.checkAssertionErrorState()) {
   *   // throw AssertionError("");
   * }
   * ```
   */
  checkAssertionErrorState(): boolean {
    return this.#state.assertionCheck && !this.#state.assertionTriggered;
  }

  /**
   * Reset all assertion state when every test suite function ran completely.
   *
   * @example Usage
   * ```ts ignore
   * import { AssertionState } from "@std/internal";
   *
   * const assertionState = new AssertionState();
   * assertionState.resetAssertionState();
   * ```
   */
  resetAssertionState(): void {
    this.#state = {
      assertionCount: undefined,
      assertionCheck: false,
      assertionTriggered: false,
      assertionTriggeredCount: 0,
    };
  }

  /**
   * Check Assertion called state, if `#state.assertionCount` is set to a number value, but
   * `#state.assertionTriggeredCount` is less then it, then should throw an assertion error.
   *
   * @returns a boolean value, that the test suite is satisfied with the check. If not,
   * it should throw an AssertionError.
   *
   * @example Usage
   * ```ts ignore
   * import { AssertionState } from "@std/internal";
   *
   * const assertionState = new AssertionState();
   * if (assertionState.checkAssertionCountSatisfied()) {
   *   // throw AssertionError("");
   * }
   * ```
   */
  checkAssertionCountSatisfied(): boolean {
    return this.#state.assertionCount !== undefined &&
      this.#state.assertionCount !== this.#state.assertionTriggeredCount;
  }
}

const assertionState = new AssertionState();

/**
 * return an instance of AssertionState
 *
 * @returns AssertionState
 *
 * @example Usage
 * ```ts ignore
 * import { getAssertionState } from "@std/internal";
 *
 * const assertionState = getAssertionState();
 * assertionState.setAssertionTriggered(true);
 * ```
 */
export function getAssertionState(): AssertionState {
  return assertionState;
}
