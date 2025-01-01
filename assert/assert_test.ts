// Copyright 2018-2025 the Deno authors. MIT license.
import { assert, AssertionError, assertThrows } from "./mod.ts";

Deno.test("assert() throws if expr is falsy", () => {
  const FALSY_VALUES = [false, 0, "", null, undefined, NaN];
  for (const value of FALSY_VALUES) {
    const msg = crypto.randomUUID();
    assertThrows(() => assert(value, msg), AssertionError, msg);
  }
});
