// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals } from "@std/assert";

import { sizeOf } from "./size_of.ts";

Deno.test({
  name: "sizeOf - string",
  fn() {
    assertEquals(sizeOf("abcdefghijklmnopq"), 21);
    assertEquals(sizeOf("🥟🥟"), 12);
  },
});

Deno.test({
  name: "sizeOf - number",
  fn() {
    assertEquals(sizeOf(63), 4);
    assertEquals(sizeOf(64), 5);
    assertEquals(sizeOf(8_191), 5);
    assertEquals(sizeOf(8_192), 6);
    assertEquals(sizeOf(1_048_575), 6);
    assertEquals(sizeOf(1_048_576), 7);
    assertEquals(sizeOf(134_217_727), 7);
    assertEquals(sizeOf(134_217_728), 8);
    assertEquals(sizeOf(2_147_483_647), 8);
    assertEquals(sizeOf(2_147_483_648), 11);
    assertEquals(sizeOf(Number.MAX_SAFE_INTEGER), 11);
  },
});

Deno.test({
  name: "sizeOf - boolean",
  fn() {
    assertEquals(sizeOf(true), 3);
    assertEquals(sizeOf(false), 3);
  },
});

Deno.test({
  name: "sizeOf - bigint",
  fn() {
    assertEquals(sizeOf(63n), 12);
    assertEquals(sizeOf(BigInt(Number.MAX_SAFE_INTEGER + 1)), 12);
  },
});

Deno.test({
  name: "sizeOf - undefined",
  fn() {
    assertEquals(sizeOf(undefined), 3);
  },
});

Deno.test({
  name: "sizeOf - null",
  fn() {
    assertEquals(sizeOf(null), 3);
  },
});

Deno.test({
  name: "sizeOf - Date",
  fn() {
    assertEquals(sizeOf(new Date()), 11);
  },
});

Deno.test({
  name: "sizeOf - RegExp",
  fn() {
    assertEquals(sizeOf(/ab[cdefg]hijklmnopq/ig), 25);
  },
});

Deno.test({
  name: "sizeOf - Error",
  fn() {
    assert(
      sizeOf(new URIError("boo hoo", { cause: new Error("boo") })) >= 496,
    );
  },
});

Deno.test({
  name: "sizeOf - Uint8Array",
  fn() {
    assertEquals(sizeOf(new Uint8Array([1, 2, 3])), 12);
  },
});

Deno.test({
  name: "sizeOf - ArrayBuffer",
  fn() {
    assertEquals(sizeOf(new Uint8Array([1, 2, 3]).buffer), 12);
  },
});

Deno.test({
  name: "sizeOf - Array",
  fn() {
    assertEquals(sizeOf([1, 2, 3, "boo", true, false, /abc/]), 27);
  },
});

Deno.test({
  name: "sizeOf - Set",
  fn() {
    assertEquals(sizeOf(new Set([1, 2, 3, 4, "foo"])), 18);
  },
});

Deno.test({
  name: "sizeOf - Map",
  fn() {
    assertEquals(
      sizeOf(
        new Map<string, string | number>([["a", 1], ["b", 2], ["c", "d"]]),
      ),
      21,
    );
  },
});

Deno.test({
  name: "sizeOf - object",
  fn() {
    assertEquals(
      sizeOf({ a: new Map([[{ a: 1 }, { b: /234/ }]]), b: false }),
      36,
    );
  },
});
