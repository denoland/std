// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertLessOrEqual, assertThrows } from "./mod.ts";
import { assertType, type IsExact } from "../testing/types.ts";

Deno.test("assertLessOrEqualOrEqual", () => {
  // Numbers
  assertLessOrEqual(1, 2);
  assertLessOrEqual(1n, 2n);
  assertLessOrEqual(1, 1.1);
  assertLessOrEqual(null, 1); // coerced to 0

  // Failures
  assertThrows(() => assertLessOrEqual(2, 1));
  assertThrows(() => assertLessOrEqual(null, -1));

  // Compile-time errors
  // assertThrows(() => assertLessOrEqual(undefined, 1));
  // assertThrows(() => assertLessOrEqual(0, null));

  // Strings
  assertLessOrEqual("a", "a");
  assertThrows(() => assertLessOrEqual("a", ""));
  assertThrows(() => assertLessOrEqual(null, "a"));
});

Deno.test("assertLessOrEqualOrEqual() type narrowing", () => {
  const n = 0 as number | undefined;
  // @ts-expect-error -- `undefined` not allowed for n
  assertLessOrEqual(n, 0); // `undefined` narrowed out
  assertType<IsExact<typeof n, number>>(true);
  const s = "" as string | undefined;
  // @ts-expect-error -- `undefined` not allowed for s
  assertLessOrEqual(s, ""); // `undefined` narrowed out
  assertType<IsExact<typeof s, string>>(true);
  const b = false as boolean | undefined;
  // @ts-expect-error -- `undefined` not allowed for b
  assertLessOrEqual(b, false); // `undefined` narrowed out
  assertType<IsExact<typeof b, boolean>>(true);
});
