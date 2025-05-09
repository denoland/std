// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { assertEquals, assertGreater } from "@std/assert";

/**
 * Counts the number of `expect` assertions made in a test.
 * Used to implement `expect.hasAssertions` and `expect.assertion`.
 */
export class AssertionCounter {
  #state: {
    assertionCount: number | undefined;
    assertionCheck: boolean;
    assertionTriggeredCount: number;
  };

  constructor() {
    this.#state = {
      assertionCount: undefined,
      assertionCheck: false,
      assertionTriggeredCount: 0,
    };

    // If any checks were registered, `validateAndReset` should have been called
    // to reset and deregister the checks
    globalThis.addEventListener("unload", () => {
      if (
        this.#state.assertionCheck ||
        this.#state.assertionCount !== undefined
      ) {
        throw new Error(
          "AssertionCounter was not cleaned up: If tests are not otherwise failing, ensure `expect.hasAssertion` and `expect.assertions` are only run in bdd tests",
        );
      }
    });
  }

  /**
   * Registers an `expect.hasAssertions`.
   *
   * @param val Whether an assertion was expected
   */
  setAssertionCheck(val: boolean) {
    this.#state.assertionCheck = val;
  }

  /**
   * Registers an `expect.assertion`.
   *
   * @param num The number of expected assertions
   */
  setAssertionCount(num: number) {
    this.#state.assertionCount = num;
  }

  /**
   * Call this when an assertion is seen to increment the internal assertion count.
   */
  updateAssertionTriggerCount() {
    this.#state.assertionTriggeredCount += 1;
  }

  /**
   * Performs all AssertionCounter checks and resets this AssertionCounter.
   * If any checks fail, throw an AssertionError and reset.
   */
  validateAndReset(): void {
    try {
      if (this.#state.assertionCheck) {
        assertGreater(
          this.#state.assertionTriggeredCount,
          0,
          "Expected at least one assertion to be called but received none",
        );
      }

      if (this.#state.assertionCount !== undefined) {
        assertEquals(
          this.#state.assertionCount,
          this.#state.assertionTriggeredCount,
          `Expected exactly ${this.#state.assertionCount} assertions to be called, ` +
            `but received ${this.#state.assertionTriggeredCount}`,
        );
      }
    } finally {
      // Reset, as this may be reused for other tests
      this.#state = {
        assertionCount: undefined,
        assertionCheck: false,
        assertionTriggeredCount: 0,
      };
    }
  }
}

const assertionCounter = new AssertionCounter();

/**
 * Get the global instance of AssertionCounter
 */
export function getAssertionCounter(): AssertionCounter {
  return assertionCounter;
}

export function hasAssertions() {
  assertionCounter.setAssertionCheck(true);
}

export function assertions(num: number) {
  assertionCounter.setAssertionCount(num);
}

export function emitAssertionTrigger() {
  assertionCounter.updateAssertionTriggerCount();
}
