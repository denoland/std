// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { takeLastWhile } from "./unstable_take_last_while.ts";

Deno.test("(unstable) takeLastWhile() handles num array", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = takeLastWhile(arr, (i) => i !== 4);

  assertEquals(actual, [5, 6]);
});

Deno.test("(unstable) takeLastWhile() adds two to each num in predicate", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = takeLastWhile(arr, (i) => i + 2 !== 6);

  assertEquals(actual, [5, 6]);
});

Deno.test("(unstable) takeLastWhile() handles negatives", () => {
  const arr = [-1, -2, -3, -4, -5, -6];

  const actual = takeLastWhile(arr, (i) => i < -4);
  assertEquals(actual, [-5, -6]);
});

Deno.test("(unstable) takeLastWhile() handles no mutation", () => {
  const arr = [1, 2, 3, 4, 5, 6];

  const actual = takeLastWhile(arr, (i) => i !== 4);
  assertEquals(actual, [5, 6]);
  assertEquals(arr, [1, 2, 3, 4, 5, 6]);
});

Deno.test("(unstable) takeLastWhile() handles empty input array returns empty array", () => {
  const arr: number[] = [];

  const actual = takeLastWhile(arr, (i) => i > 4);

  assertEquals(actual, []);
});

Deno.test("(unstable) takeLastWhile() returns empty array when the last element doesn't match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = takeLastWhile(arr, (i) => i !== 4);

  assertEquals(actual, []);
});

Deno.test("(unstable) takeLastWhile() returns the same array when all elements match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = takeLastWhile(arr, (i) => i !== 400);

  assertEquals(actual, [1, 2, 3, 4]);
});

Deno.test("(unstable) handles generator", () => {
  function* gen() {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
    yield 5;
    yield 6;
  }
  const actual = takeLastWhile(gen(), (i) => i !== 4);
  assertEquals(actual, [5, 6]);
});

Deno.test("(unstable) takeLastWhile() returns empty array when the last generator element does not match the predicate", () => {
  function* gen() {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
  }

  const actual = takeLastWhile(gen(), (i) => i !== 4);
  assertEquals(actual, []);
});

Deno.test("(unstable) takeLastWhile() returns the same array when all elements match the predicate", () => {
  function* gen(): Generator<number> {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
  }
  const actual = takeLastWhile(gen(), (i) => i !== 400);
  assertEquals(actual, [1, 2, 3, 4]);
});

Deno.test("(unstable) takeLastWhile() empty generator returns empty array", () => {
  function* gen(): Generator<number> {}
  const actual = takeLastWhile(gen(), (i) => i > 4);
  assertEquals(actual, []);
});

Deno.test("(unstable) takeLastWhile() gets from last matching element from an array", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = takeLastWhile(arr, (i) => i !== 2 && i !== 4);
  assertEquals(actual, [5, 6]);
});

Deno.test("(unstable) takeLastWhile() gets from last matching element from a generator", () => {
  function* gen(): Generator<number> {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
    yield 5;
    yield 6;
  }
  const actual = takeLastWhile(gen(), (i) => i !== 2 && i !== 4);
  assertEquals(actual, [5, 6]);
});
