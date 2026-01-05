// Copyright 2018-2026 the Deno authors. MIT license.

import { getAssertionState } from "@std/internal/assertion-state";

const assertionState = getAssertionState();

export function hasAssertions() {
  assertionState.setAssertionCheck(true);
}

export function assertions(num: number) {
  assertionState.setAssertionCount(num);
}

export function emitAssertionTrigger() {
  assertionState.setAssertionTriggered(true);
  assertionState.updateAssertionTriggerCount();
}
