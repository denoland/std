// Copyright 2018-2025 the Deno authors. MIT license.
import { includesNeedle } from "./includes_needle.ts";
import { assert } from "@std/assert";

Deno.test("includesNeedle()", () => {
  const encoder = new TextEncoder();
  const source = encoder.encode("deno.land");
  const pattern = encoder.encode("deno");

  assert(includesNeedle(source, pattern));
  assert(includesNeedle(new Uint8Array([0, 1, 2, 3]), new Uint8Array([2, 3])));

  assert(includesNeedle(source, pattern, -10));
  assert(!includesNeedle(source, pattern, -1));
});
