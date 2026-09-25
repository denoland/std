// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { radToDeg } from "./rad_to_deg.ts";

Deno.test("radToDeg() converts PI to 180 degrees", () => {
  assertEquals(radToDeg(Math.PI), 180);
});

Deno.test("radToDeg() converts PI/2 to 90 degrees", () => {
  assertEquals(radToDeg(Math.PI / 2), 90);
});

Deno.test("radToDeg() converts 0 to 0", () => {
  assertEquals(radToDeg(0), 0);
});

Deno.test("radToDeg() converts 2*PI to 360", () => {
  assertEquals(radToDeg(Math.PI * 2), 360);
});
