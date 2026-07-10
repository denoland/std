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
