// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals, assertStringIncludes } from "@std/assert";
import { AssertionState } from "./assertion_state.ts";
import { stripAnsiCode } from "./styles.ts";

Deno.test("AssertionState checkAssertionErrorState pass", () => {
  const assertionState = new AssertionState();
  try {
    assertionState.setAssertionTriggered(true);
    assertEquals(assertionState.checkAssertionErrorState(), false);
  } finally {
    assertionState.resetAssertionState();
  }
});

Deno.test("AssertionState checkAssertionErrorState pass", () => {
  const assertionState = new AssertionState();
  try {
    assertionState.setAssertionTriggered(true);

    assertEquals(assertionState.checkAssertionErrorState(), false);

    assertionState.setAssertionCheck(true);
    assertEquals(assertionState.checkAssertionErrorState(), false);
  } finally {
    assertionState.resetAssertionState();
  }
});

Deno.test("AssertionState checkAssertionErrorState fail", () => {
  const assertionState = new AssertionState();
  try {
    assertionState.setAssertionCheck(true);
    assertEquals(assertionState.checkAssertionErrorState(), true);
  } finally {
    assertionState.resetAssertionState();
  }
});

Deno.test({
  name: "AssertionState throws if not cleaned up",
  ignore: !Deno.Command,
  fn: async () => {
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "eval",
        `
          import { AssertionState } from "@std/internal/assertion-state";
          const assertionState = new AssertionState();
          assertionState.setAssertionCount(0);
        `,
      ],
    });
    const { stderr } = await command.output();
    const errorMessage = stripAnsiCode(new TextDecoder().decode(stderr));
    // TODO(WWRS): Test for the expected message when Deno displays it instead of "Uncaught null"
    assertStringIncludes(errorMessage, "error: Uncaught");
  },
});
