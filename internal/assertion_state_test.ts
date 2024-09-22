// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { AssertionState } from "./assertion_state.ts";

Deno.test("AssertionState checkAssertionErrorState pass", () => {
  const assertionState = new AssertionState();
  assertionState.setAssertionTriggered(true);

  assertEquals(assertionState.checkAssertionErrorState(), false);
});

Deno.test("AssertionState checkAssertionErrorState pass", () => {
  const assertionState = new AssertionState();
  assertionState.setAssertionTriggered(true);

  assertEquals(assertionState.checkAssertionErrorState(), false);

  assertionState.setAssertionCheck(true);
  assertEquals(assertionState.checkAssertionErrorState(), false);
});

Deno.test("AssertionState checkAssertionErrorState fail", () => {
  const assertionState = new AssertionState();
  assertionState.setAssertionCheck(true);

  assertEquals(assertionState.checkAssertionErrorState(), true);
});
