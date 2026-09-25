// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { lerp } from "./lerp.ts";

Deno.test("lerp() returns start when t = 0", () => {
  assertEquals(lerp(0, 10, 0), 0);
});

Deno.test("lerp() returns end when t = 1", () => {
  assertEquals(lerp(0, 10, 1), 10);
});

Deno.test("lerp() returns midpoint when t = 0.5", () => {
  assertEquals(lerp(0, 10, 0.5), 5);
});

Deno.test("lerp() handles negative values", () => {
  assertEquals(lerp(-10, 10, 0.5), 0);
});

Deno.test("lerp() returns the endpoints exactly even for extreme magnitudes", () => {
  assertEquals(lerp(1e30, 1, 1), 1);
  assertEquals(lerp(Number.MAX_VALUE, -Number.MAX_VALUE, 0), Number.MAX_VALUE);
});

Deno.test("lerp() extrapolates for t outside [0, 1]", () => {
  assertEquals(lerp(0, 10, 1.5), 15);
  assertEquals(lerp(0, 10, -0.5), -5);
});
