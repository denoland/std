// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { indexOfNeedle } from "./index_of_needle.ts";
import { assertEquals } from "../assert/mod.ts";

Deno.test("indexOfNeedle() handles repeating occurence", () => {
  const i = indexOfNeedle(
    new Uint8Array([1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 3]),
    new Uint8Array([0, 1, 2]),
  );
  assertEquals(i, 2);
});

Deno.test("indexOfNeedle() handles single occurence", () => {
  const i = indexOfNeedle(new Uint8Array([0, 0, 1]), new Uint8Array([0, 1]));
  assertEquals(i, 1);
});

Deno.test("indexOfNeedle() handles text encoded occurence", () => {
  const encoder = new TextEncoder();
  const i = indexOfNeedle(encoder.encode("Deno"), encoder.encode("D"));
  assertEquals(i, 0);
});

Deno.test("indexOfNeedle() handles missing occurence", () => {
  const i = indexOfNeedle(new Uint8Array(), new Uint8Array([0, 1]));
  assertEquals(i, -1);
});

Deno.test("indexOfNeedle() returns index of occurence after start", () => {
  const i = indexOfNeedle(
    new Uint8Array([0, 1, 2, 0, 1, 2]),
    new Uint8Array([0, 1]),
    1,
  );
  assertEquals(i, 3);
});

Deno.test("indexOfNeedle() returns -1 if occurence is before start", () => {
  const i = indexOfNeedle(
    new Uint8Array([0, 1, 2, 0, 1, 2]),
    new Uint8Array([0, 1]),
    7,
  );
  assertEquals(i, -1);
});

Deno.test("indexOfNeedle() handles start index less than 0", () => {
  assertEquals(
    indexOfNeedle(
      new Uint8Array([0, 1, 2, 0, 1, 2]),
      new Uint8Array([0, 1]),
      3,
    ),
    3,
  );
  assertEquals(
    indexOfNeedle(
      new Uint8Array([0, 1, 2, 1, 1, 2]),
      new Uint8Array([0, 1]),
      3,
    ),
    -1,
  );
});
