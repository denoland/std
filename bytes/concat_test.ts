// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals } from "../assert/mod.ts";
import { concat } from "./concat.ts";

Deno.test("concat()", () => {
  const encoder = new TextEncoder();
  const u1 = encoder.encode("Hello ");
  const u2 = encoder.encode("World");
  const joined = concat([u1, u2]);
  assertEquals(new TextDecoder().decode(joined), "Hello World");
  assert(u1 !== joined);
  assert(u2 !== joined);
});

Deno.test("concat() handles empty arrays", () => {
  const u1 = new Uint8Array();
  const u2 = new Uint8Array();
  const joined = concat([u1, u2]);
  assertEquals(joined.byteLength, 0);
  assert(u1 !== joined);
  assert(u2 !== joined);
});

Deno.test("concat() handles multiple Uint8Array", () => {
  const encoder = new TextEncoder();
  const u1 = encoder.encode("Hello ");
  const u2 = encoder.encode("W");
  const u3 = encoder.encode("o");
  const u4 = encoder.encode("r");
  const u5 = encoder.encode("l");
  const u6 = encoder.encode("d");
  const joined = concat([u1, u2, u3, u4, u5, u6]);
  assertEquals(new TextDecoder().decode(joined), "Hello World");
  assert(u1 !== joined);
  assert(u2 !== joined);
});

Deno.test("concat() handles an array of Uint8Array", () => {
  const a = [
    new Uint8Array([0, 1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
  ];
  const joined = concat(a);
  const expected = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assertEquals(joined, expected);
});
