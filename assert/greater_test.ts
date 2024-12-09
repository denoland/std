// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertGreater, assertThrows } from "./mod.ts";
import { assertType, type IsExact } from "../testing/types.ts";

Deno.test("assertGreaterOrEqual() matches when actual value is greater than expected value", () => {
  assertGreater(2, 1);
  assertGreater(2n, 1n);
  assertGreater(1.1, 1);
  assertGreater(null, -1); // coerced to 0
});

Deno.test("assertGreaterOrEqual() throws when actual value is smaller or equal than expected value", () => {
  assertThrows(() => assertGreater(1, 2));
  assertThrows(() => assertGreater(null, 0));

  // Compile-time errors
  // assertThrows(() => assertGreater(undefined, 1));
  // assertThrows(() => assertGreater(0, null));
});

Deno.test("assertGreater() on strings", () => {
  // Strings
  assertGreater("b", "a");
  assertThrows(() => assertGreater("", "a"));
  assertThrows(() => assertGreater(null, "a"));
});

Deno.test("assertGreater type narrowing", () => {
  const n = 0 as number | undefined;
  // @ts-expect-error -- `undefined` not allowed for n; disable to see compile-time error below
  assertGreater(n, -1); // `undefined` narrowed out
  assertType<IsExact<typeof n, number>>(true);
  const s = "a" as string | undefined;
  // @ts-expect-error -- `undefined` not allowed for s
  assertGreater(s, ""); // `undefined` narrowed out
  assertType<IsExact<typeof s, string>>(true);
  const b = true as boolean | undefined;
  // @ts-expect-error -- `undefined` not allowed for b
  assertGreater(b, false); // `undefined` narrowed out
  assertType<IsExact<typeof b, boolean>>(true);
});
