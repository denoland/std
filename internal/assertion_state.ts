// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

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

  checkAssertionError(): boolean {
    return this.#state.assertionCheck && !this.#state.assertionTriggered;
  }
}

const assertionState = new AssertionState();

export function getAssertionState(): AssertionState {
  return assertionState;
}
