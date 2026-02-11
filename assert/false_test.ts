// Copyright 2018-2026 the Deno authors. MIT license.
import { assertFalse, AssertionError, assertThrows } from "./mod.ts";

Deno.test("assertFalse() throws if expr is truthy", () => {
  const TRUTHY_VALUES = [true, 1, -1, 1n, "string", {}, [], Symbol(), () => {}];
  for (const value of TRUTHY_VALUES) {
    const msg = crypto.randomUUID();
    assertThrows(() => assertFalse(value, msg), AssertionError, msg);
  }
});

Deno.test("assertFalse() does not throw if expr is falsy", () => {
  const FALSY_VALUES = [false, 0, 0n, "", null, undefined, NaN];
  for (const value of FALSY_VALUES) {
    assertFalse(value);
  }
});
