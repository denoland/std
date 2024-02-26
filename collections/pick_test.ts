// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertNotStrictEquals } from "../assert/mod.ts";
import { pick } from "./pick.ts";

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
