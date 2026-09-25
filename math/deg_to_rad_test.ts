// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { degToRad } from "./deg_to_rad.ts";

Deno.test("degToRad() converts 180 degrees to PI", () => {
  assertEquals(degToRad(180), Math.PI);
});

Deno.test("degToRad() converts 90 degrees to PI/2", () => {
  assertEquals(degToRad(90), Math.PI / 2);
});

Deno.test("degToRad() converts 0 degrees to 0", () => {
  assertEquals(degToRad(0), 0);
});

Deno.test("degToRad() converts 360 degrees to 2*PI", () => {
  assertEquals(degToRad(360), Math.PI * 2);
});
