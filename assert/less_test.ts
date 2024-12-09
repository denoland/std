// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertLess, assertThrows } from "./mod.ts";
import { assertType, type IsExact } from "../testing/types.ts";

Deno.test("assertLess", () => {
  // Numbers
  assertLess(1, 2);
  assertLess(1n, 2n);
  assertLess(1, 1.1);
  assertLess(null, 1); // coerced to 0

  // Failures
  assertThrows(() => assertLess(2, 1));
  assertThrows(() => assertLess(null, -1));

  // Compile-time errors
  // assertThrows(() => assertLess(undefined, 1));
  // assertThrows(() => assertLess(-1, null));

  // Strings
  assertLess("a", "b");
  assertThrows(() => assertLess("a", ""));
  assertThrows(() => assertLess(null, "a"));
});

Deno.test("assertLess() type narrowing", () => {
  const n = 0 as number | undefined;
  // @ts-expect-error -- `undefined` not allowed for n; disable to see compile-time error below
  assertLess(n, 1); // `undefined` narrowed out
  assertType<IsExact<typeof n, number>>(true);
  const s = "" as string | undefined;
  // @ts-expect-error -- `undefined` not allowed for s
  assertLess(s, "a"); // `undefined` narrowed out
  assertType<IsExact<typeof s, string>>(true);
  const b = false as boolean | undefined;
  // @ts-expect-error -- `undefined` not allowed for b
  assertLess(b, true); // `undefined` narrowed out
  assertType<IsExact<typeof b, boolean>>(true);
});
