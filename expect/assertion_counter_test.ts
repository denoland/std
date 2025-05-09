// Copyright 2018-2025 the Deno authors. MIT license.

import { assertThrows } from "@std/assert";
import { AssertionCounter, getAssertionCounter } from "./assertion_counter.ts";
import { expect } from "./expect.ts";

Deno.test("AssertionCounter", async (t) => {
  await t.step("passes with 1 assertion", () => {
    const assertionCounter = new AssertionCounter();
    assertionCounter.setAssertionCheck(true);
    assertionCounter.setAssertionCount(1);

    assertionCounter.updateAssertionTriggerCount();

    // Should not throw
    assertionCounter.validateAndReset();
  });

  await t.step("rejects if assertions were expected but not called", () => {
    const assertionCounter = new AssertionCounter();
    assertionCounter.setAssertionCheck(true);

    assertThrows(() => {
      assertionCounter.validateAndReset();
    });
  });

  await t.step("rejects if 1 assertion was expected but 0 were called", () => {
    const assertionCounter = new AssertionCounter();
    assertionCounter.setAssertionCount(1);

    assertThrows(() => {
      assertionCounter.validateAndReset();
    });
  });

  await t.step("rejects if 1 assertion was expected but 2 were called", () => {
    const assertionCounter = new AssertionCounter();
    assertionCounter.setAssertionCount(1);

    assertionCounter.updateAssertionTriggerCount();
    assertionCounter.updateAssertionTriggerCount();

    assertThrows(() => {
      assertionCounter.validateAndReset();
    });
  });

  await t.step("resets after a rejection", () => {
    const assertionCounter = new AssertionCounter();
    assertionCounter.setAssertionCount(1);

    assertThrows(() => {
      assertionCounter.validateAndReset();
    });

    assertionCounter.setAssertionCount(0);
    // Should not throw
    assertionCounter.validateAndReset();
  });
});

Deno.test("getAssertionCounter()", async (t) => {
  await t.step("counts expect assertions", () => {
    const assertionCounter = getAssertionCounter();
    expect.hasAssertions();
    expect.assertions(1);

    expect(1).toBe(1);

    // Should not throw
    assertionCounter.validateAndReset();
  });

  await t.step("works out of order", () => {
    const assertionCounter = getAssertionCounter();

    expect(1).toBe(1);

    expect.hasAssertions();
    expect.assertions(1);

    // Should not throw
    assertionCounter.validateAndReset();
  });

  await t.step("rejects if the wrong number of assertions were seen", () => {
    const assertionCounter = getAssertionCounter();

    expect.hasAssertions();
    assertThrows(() => {
      assertionCounter.validateAndReset();
    });

    expect.assertions(1);
    assertThrows(() => {
      assertionCounter.validateAndReset();
    });

    expect.assertions(1);
    expect(1).toBe(1);
    expect(1).toBe(1);
    assertThrows(() => {
      assertionCounter.validateAndReset();
    });
  });
});
