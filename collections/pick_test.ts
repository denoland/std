// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertNotStrictEquals } from "@std/assert";
import { pick } from "./pick.ts";
import { assertType, type IsExact } from "@std/testing/types";

Deno.test({
  name: "pick() returns a new empty object when no keys are provided",
  fn() {
    const obj = { a: 5, b: 6, c: 7, d: 8 };
    const picked = pick(obj, []);

    assertEquals(picked, {});
    assertNotStrictEquals(picked, obj);
  },
});

Deno.test({
  name:
    "pick() returns a new object without properties missing in the original object",
  fn() {
    // deno-lint-ignore no-explicit-any
    const obj = { a: 5, b: 6, c: 7, d: 8 } as any;
    const picked: { a: 5; x?: 5; y?: 5 } = pick(obj, ["a", "x", "y"]);

    assertEquals(picked, { a: 5 });
    assertNotStrictEquals(picked, obj);
  },
});

Deno.test({
  name:
    "pick() returns a new object from the provided object with the provided keys",
  fn() {
    const obj = { a: 5, b: 6, c: 7, d: 8 };
    const picked = pick(obj, ["a", "c"]);

    assertEquals(picked, { a: 5, c: 7 });
    assertNotStrictEquals(picked, obj);
  },
});

Deno.test({
  name:
    "pick() returns a new object from the provided object with the provided keys (all keys are provided)",
  fn() {
    const obj = { a: 5, b: 6, c: 7, d: 8 };
    const picked = pick(obj, ["a", "b", "c", "d"]);

    assertEquals(picked, { a: 5, b: 6, c: 7, d: 8 });
    assertNotStrictEquals(picked, obj);
  },
});

Deno.test({
  name:
    "pick() correctly infers its generic when passed to generic (issue #6961)",
  fn() {
    const obj = { a: 5, b: 6, c: 7, d: 8 };

    const f = <T extends Record<string, unknown>>(t: T) => t;
    const picked = f(pick(obj, ["a"]));

    assertType<
      IsExact<
        typeof picked,
        { a: number }
      >
    >(true);
  },
});
