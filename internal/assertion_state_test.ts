// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { AssertionState } from "./assertion_state.ts";

Deno.test("AssertionState checkAssertionErrorStateAndReset pass", () => {
  const assertionState = new AssertionState();
  assertionState.setAssertionTriggered(true);

  assertEquals(assertionState.checkAssertionErrorStateAndReset(), false);
});

Deno.test("AssertionState checkAssertionErrorStateAndReset pass", () => {
  const assertionState = new AssertionState();
  assertionState.setAssertionTriggered(true);

  assertEquals(assertionState.checkAssertionErrorStateAndReset(), false);

  assertionState.setAssertionCheck(true);
  assertEquals(assertionState.checkAssertionErrorStateAndReset(), true);
});

Deno.test("AssertionState checkAssertionErrorStateAndReset fail", () => {
  const assertionState = new AssertionState();
  assertionState.setAssertionCheck(true);

  assertEquals(assertionState.checkAssertionErrorStateAndReset(), true);
});
