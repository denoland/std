// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { getAssertionState } from "@std/internal/assertion-state";

const assertionState = getAssertionState();

export function hasAssertions() {
  assertionState.setAssertionCheck(true);
}

export function emitAssertionTrigger() {
  assertionState.setAssertionTriggered(true);
}
