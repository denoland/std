// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { getAssertionState } from "@std/internal/assertion-state";

const assertionState = getAssertionState();

export function hasAssertions() {
  assertionState.setAssertionCheck(true);
}

export function emitAssertionTrigger() {
  assertionState.setAssertionTriggered(true);
}

export function assertions(num: number) {
  assertionState.setAssertionCount(num);
}

export function emitAssertionCountUpdate() {
  assertionState.updateAssertionTriggerCount();
}
