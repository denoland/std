// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import {
  assert,
  assertInstanceOf,
  AssertionError,
  assertStrictEquals,
} from "./mod.ts";

Deno.test("AssertionError", async (t) => {
  let expectedPathReached = false;
  const originalError = new Error("foo");
  try {
    throw originalError;
  } catch (cause) {
    try {
      throw new AssertionError("bar", { cause });
    } catch (cause) {
      assertInstanceOf(cause, AssertionError);

      await t.step(
        'value of message parameter is accessible on property "message"',
        () => assertStrictEquals(cause.message, "bar"),
      );

      await t.step("options parameter", async (t) => {
        await t.step(
          'value of property "cause" is accessible on property "cause"',
          () => assertStrictEquals(cause.cause, originalError),
        );
      });

      expectedPathReached = true;
    }
  }
  assert(
    expectedPathReached,
    "Expected all exception-handling code paths to be reached",
  );
});
