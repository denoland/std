// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { lastIndexOfNeedle } from "./last_index_of_needle.ts";

Deno.test("lastIndexOfNeedle() handles repeating occurrence", () => {
  const i = lastIndexOfNeedle(
    new Uint8Array([0, 1, 2, 0, 1, 2, 0, 1, 3]),
    new Uint8Array([0, 1, 2]),
  );
  assertEquals(i, 3);
});

Deno.test("lastIndexOfNeedle() handles single occurrence", () => {
  const i = lastIndexOfNeedle(
    new Uint8Array([0, 1, 1]),
    new Uint8Array([0, 1]),
  );
  assertEquals(i, 0);
});

Deno.test("lastIndexOfNeedle() handles missing occurrence", () => {
  const i = lastIndexOfNeedle(new Uint8Array(), new Uint8Array([0, 1]));
  assertEquals(i, -1);
});

Deno.test("lastIndexOfNeedle() returns index of occurrence after start", () => {
  const i = lastIndexOfNeedle(
    new Uint8Array([0, 1, 2, 0, 1, 2]),
    new Uint8Array([0, 1]),
    2,
  );
  assertEquals(i, 0);
});

Deno.test("lastIndexOfNeedle() returns -1 with too small start", () => {
  const i = lastIndexOfNeedle(
    new Uint8Array([0, 1, 2, 0, 1, 2]),
    new Uint8Array([0, 1]),
    -1,
  );
  assertEquals(i, -1);
});

Deno.test("lastIndexOfNeedle() returns index if start is greater than source index", () => {
  const i = lastIndexOfNeedle(
    new Uint8Array([0, 1, 2, 0, 1, 2]),
    new Uint8Array([0, 1]),
    7,
  );
  assertEquals(i, 3);
});

Deno.test("lastIndexOfNeedle() returns -1 if needle doesn't exist within source", () => {
  const i = lastIndexOfNeedle(
    new Uint8Array([0, 1, 2, 0, 1, 2]),
    new Uint8Array([2, 3]),
  );
  assertEquals(i, -1);
});
