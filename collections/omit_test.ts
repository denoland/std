// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertNotStrictEquals } from "@std/assert";
import { omit } from "./omit.ts";

Deno.test({
  name: "omit() returns a new object from the provided object",
  fn() {
    const obj = { a: 5, b: 6, c: 7, d: 8 };
    const omitted = omit(obj, []);

    assertEquals(omitted, { a: 5, b: 6, c: 7, d: 8 });
    assertNotStrictEquals(omitted, obj);
  },
});

Deno.test({
  name:
    "omit() returns a new object from the provided object without the provided keys",
  fn() {
    const obj = { a: 5, b: 6, c: 7, d: 8 };
    const omitted = omit(obj, ["a", "c"]);

    assertEquals(omitted, { b: 6, d: 8 });
    assertNotStrictEquals(omitted, obj);
  },
});

Deno.test({
  name: "omit() returns an empty object when the provided keys is empty",
  fn() {
    const obj = { a: 5, b: 6, c: 7, d: 8 };
    const omitted = omit(obj, ["a", "b", "c", "d"]);

    assertEquals(omitted, {});
    assertNotStrictEquals(omitted, obj);
  },
});
