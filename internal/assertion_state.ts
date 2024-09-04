// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { AssertionError } from "@std/assert/assertion-error";

export class AssertionState {
  #state: {
    assertionCheck: boolean;
    assertionTriggered: boolean;
  };

  constructor() {
    this.#state = {
      assertionCheck: false,
      assertionTriggered: false,
    };
  }

  setAssertionCheck(val: boolean) {
    this.#state.assertionCheck = val;
  }

  setAssertionTriggered(val: boolean) {
    this.#state.assertionTriggered = val;
  }

  checkAssertionError() {
    if (this.#state.assertionCheck && !this.#state.assertionTriggered) {
      throw new AssertionError(
        "Expected at least one assertion to be called but received none.",
      );
    }
  }
}

const assertionState = new AssertionState();

export function getAssertionState(): AssertionState {
  return assertionState;
}
