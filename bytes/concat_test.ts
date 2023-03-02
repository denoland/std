// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals } from "../testing/asserts.ts";
import { concat } from "./concat.ts";

Deno.test("[bytes] concat", () => {
  const encoder = new TextEncoder();
  const u1 = encoder.encode("Hello ");
  const u2 = encoder.encode("World");
  const joined = concat(u1, u2);
  assertEquals(new TextDecoder().decode(joined), "Hello World");
  assert(u1 !== joined);
  assert(u2 !== joined);
});

Deno.test("[bytes] concat empty arrays", () => {
  const u1 = new Uint8Array();
  const u2 = new Uint8Array();
  const joined = concat(u1, u2);
  assertEquals(joined.byteLength, 0);
  assert(u1 !== joined);
  assert(u2 !== joined);
});

Deno.test("[bytes] concat multiple arrays", () => {
  const encoder = new TextEncoder();
  const u1 = encoder.encode("Hello ");
  const u2 = encoder.encode("W");
  const u3 = encoder.encode("o");
  const u4 = encoder.encode("r");
  const u5 = encoder.encode("l");
  const u6 = encoder.encode("d");
  const joined = concat(u1, u2, u3, u4, u5, u6);
  assertEquals(new TextDecoder().decode(joined), "Hello World");
  assert(u1 !== joined);
  assert(u2 !== joined);
});
