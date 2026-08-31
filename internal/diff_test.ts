// Copyright 2018-2026 the Deno authors. MIT license.

import { assertFp, backTrace, createCommon, createFp, diff } from "./diff.ts";
import { assertEquals, assertThrows } from "@std/assert";

Deno.test({
  name: "diff() with empty values",
  fn() {
    assertEquals(diff([], []), []);
  },
});

Deno.test({
  name: 'diff() "a" vs "b"',
  fn() {
    assertEquals(diff(["a"], ["b"]), [
      { type: "removed", value: "a" },
      { type: "added", value: "b" },
    ]);
  },
});

Deno.test({
  name: 'diff() "a" vs "a"',
  fn() {
    assertEquals(diff(["a"], ["a"]), [{ type: "common", value: "a" }]);
  },
});

Deno.test({
  name: 'diff() "a" vs ""',
  fn() {
    assertEquals(diff(["a"], []), [{ type: "removed", value: "a" }]);
  },
});

Deno.test({
  name: 'diff() "" vs "a"',
  fn() {
    assertEquals(diff([], ["a"]), [{ type: "added", value: "a" }]);
  },
});

Deno.test({
  name: 'diff() "a" vs "a, b"',
  fn() {
    assertEquals(diff(["a"], ["a", "b"]), [
      { type: "common", value: "a" },
      { type: "added", value: "b" },
    ]);
  },
});

Deno.test({
  name: 'diff() "a, x, c" vs "a, b, c"',
  fn() {
    assertEquals(diff(["a", "x", "c"], ["a", "b", "c"]), [
      { type: "common", value: "a" },
      { type: "removed", value: "x" },
      { type: "added", value: "b" },
      { type: "common", value: "c" },
    ]);
  },
});

Deno.test({
  name: 'diff() "strength" vs "string"',
  fn() {
    assertEquals(diff(Array.from("strength"), Array.from("string")), [
      { type: "common", value: "s" },
      { type: "common", value: "t" },
      { type: "common", value: "r" },
      { type: "removed", value: "e" },
      { type: "added", value: "i" },
      { type: "common", value: "n" },
      { type: "common", value: "g" },
      { type: "removed", value: "t" },
      { type: "removed", value: "h" },
    ]);
  },
});

Deno.test({
  name: 'diff() "strength" vs ""',
  fn() {
    assertEquals(diff(Array.from("strength"), Array.from("")), [
      { type: "removed", value: "s" },
      { type: "removed", value: "t" },
      { type: "removed", value: "r" },
      { type: "removed", value: "e" },
      { type: "removed", value: "n" },
      { type: "removed", value: "g" },
      { type: "removed", value: "t" },
      { type: "removed", value: "h" },
    ]);
  },
});

Deno.test({
  name: 'diff() "" vs "strength"',
  fn() {
    assertEquals(diff(Array.from(""), Array.from("strength")), [
      { type: "added", value: "s" },
      { type: "added", value: "t" },
      { type: "added", value: "r" },
      { type: "added", value: "e" },
      { type: "added", value: "n" },
      { type: "added", value: "g" },
      { type: "added", value: "t" },
      { type: "added", value: "h" },
    ]);
  },
});

Deno.test({
  name: 'diff() "abc", "c" vs "abc", "bcd", "c"',
  fn() {
    assertEquals(diff(["abc", "c"], ["abc", "bcd", "c"]), [
      { type: "common", value: "abc" },
      { type: "added", value: "bcd" },
      { type: "common", value: "c" },
    ]);
  },
});

Deno.test({
  name: "diff() does not throw RangeError for large disjoint arrays",
  fn() {
    const n = 2 ** 18;
    const a = Array.from({ length: n }, (_, i) => `a${i}`);
    const b = Array.from({ length: n }, (_, i) => `b${i}`);
    const result = diff(a, b);
    assertEquals(result.length, n * 2);
    assertEquals(result[0], { type: "removed", value: "a0" });
    assertEquals(result[n - 1], { type: "removed", value: `a${n - 1}` });
    assertEquals(result[n], { type: "added", value: "b0" });
    assertEquals(result[n * 2 - 1], { type: "added", value: `b${n - 1}` });
  },
});

Deno.test({
  name:
    "diff() keeps a single inner change as one hunk when the Myers table would overflow",
  fn() {
    const side = 10_000;
    const prefix = Array.from({ length: side }, (_, i) => `p${i}`);
    const suffix = Array.from({ length: side }, (_, i) => `s${i}`);
    const a = [...prefix, "old", ...suffix];
    const b = [...prefix, "new", ...suffix];
    assertEquals(diff(a, b), [
      ...prefix.map((value) => ({ type: "common" as const, value })),
      { type: "removed", value: "old" },
      { type: "added", value: "new" },
      ...suffix.map((value) => ({ type: "common" as const, value })),
    ]);
  },
});

Deno.test({
  name: "assertFp()",
  fn() {
    const fp = { y: 0, id: 0 };
    assertEquals(assertFp(fp), undefined);
  },
});

Deno.test({
  name: "assertFp() throws",
  fn() {
    assertThrows(
      () => assertFp({ id: 0 }),
      Error,
      "Unexpected value, expected 'FarthestPoint': received object",
    );
    assertThrows(
      () => assertFp({ y: 0 }),
      Error,
      "Unexpected value, expected 'FarthestPoint': received object",
    );
    assertThrows(
      () => assertFp(undefined),
      Error,
      "Unexpected value, expected 'FarthestPoint': received undefined",
    );
    assertThrows(
      () => assertFp(null),
      Error,
      "Unexpected value, expected 'FarthestPoint': received object",
    );
  },
});

Deno.test({
  name: "backTrace()",
  fn() {
    assertEquals(
      backTrace([], [], { y: 0, id: 0 }, false, new Uint32Array(0), 0),
      [],
    );
    assertEquals(
      backTrace(["a"], ["b"], { y: 1, id: 3 }, false, new Uint32Array(10), 5),
      [],
    );
  },
});

Deno.test({
  name: "createCommon()",
  fn() {
    assertEquals(createCommon([], []), []);
    assertEquals(createCommon([1], []), []);
    assertEquals(createCommon([], [1]), []);
    assertEquals(createCommon([1], [1]), [1]);
    assertEquals(createCommon([1, 2], [1]), [1]);
    assertEquals(createCommon([1], [1, 2]), [1]);
  },
});

Deno.test({
  name: "createFp()",
  fn() {
    assertEquals(
      createFp(
        0,
        0,
        new Uint32Array(0),
        0,
        0,
        { y: -1, id: 0 },
        { y: -1, id: 0 },
      ),
      { y: 0, id: 0 },
    );
  },
});

Deno.test({
  name: 'createFp() "isAdding"',
  fn() {
    assertEquals(
      createFp(
        0,
        0,
        new Uint32Array(0),
        0,
        0,
        { y: 0, id: 0 },
        { y: -1, id: 0 },
      ),
      { y: 0, id: 1 },
    );
  },
});

Deno.test({
  name: 'createFp() "!isAdding"',
  fn() {
    assertEquals(
      createFp(
        0,
        0,
        new Uint32Array(0),
        0,
        0,
        { y: -1, id: 0 },
        { y: 0, id: 0 },
      ),
      { y: -1, id: 1 },
    );
  },
});

Deno.test({
  name: "createFp() throws",
  fn() {
    assertThrows(
      () => createFp(0, 0, new Uint32Array(0), 0, 0),
      Error,
      "Unexpected missing FarthestPoint",
    );
  },
});
