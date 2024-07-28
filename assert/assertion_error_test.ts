// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { AssertionError, assertStrictEquals, assertThrows } from "./mod.ts";

Deno.test("AssertionError", async (t) => {
  const originalError = new Error("foo");
  const assertionError = assertThrows(() => {
    try {
      throw originalError;
    } catch (cause) {
      throw new AssertionError("bar", { cause });
    }
  }, AssertionError);

  await t.step(
    'value of message parameter is accessible on property "message"',
    () => assertStrictEquals(assertionError.message, "bar"),
  );

  await t.step("options parameter", async (t) => {
    await t.step(
      'value of property "cause" is accessible on property "cause"',
      () => assertStrictEquals(assertionError.cause, originalError),
    );
  });
});
