// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertGreaterOrEqual, assertThrows } from "./mod.ts";
import { assertType, type IsExact } from "../testing/types.ts";

Deno.test("assertGreaterOrEqual() matches when actual value is greater or equal than expected value", () => {
  assertGreaterOrEqual(2, 1);
  assertGreaterOrEqual(1n, 1n);
  assertGreaterOrEqual(1.1, 1);
  assertGreaterOrEqual(null, 0); // coerced to 0
});

Deno.test("assertGreaterOrEqual() throws when actual value is smaller than expected value", () => {
  assertThrows(() => assertGreaterOrEqual(1, 2));
  assertThrows(() => assertGreaterOrEqual(null, 1));

  // Compile-time errors
  // assertThrows(() => assertGreater(undefined, 1));
  // assertThrows(() => assertGreater(0, null));
});

Deno.test("assertGreaterOrEqual() on strings", () => {
  // Strings
  assertGreaterOrEqual("", "");
  assertThrows(() => assertGreaterOrEqual("", "a"));
  assertThrows(() => assertGreaterOrEqual(null, "a"));
});

Deno.test("assertGreater type narrowing", () => {
  const n = 0 as number | undefined;
  // @ts-expect-error -- `undefined` not allowed for n; disable to see compile-time error below
  assertGreaterOrEqual(n, 0); // `undefined` narrowed out
  assertType<IsExact<typeof n, number>>(true);
  const s = "" as string | undefined;
  // @ts-expect-error -- `undefined` not allowed for s
  assertGreaterOrEqual(s, ""); // `undefined` narrowed out
  assertType<IsExact<typeof s, string>>(true);
  const b = false as boolean | undefined;
  // @ts-expect-error -- `undefined` not allowed for b
  assertGreaterOrEqual(b, false); // `undefined` narrowed out
  assertType<IsExact<typeof b, boolean>>(true);
});
