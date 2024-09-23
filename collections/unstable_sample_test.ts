// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import {
  type ArrayLikeArg,
  assert,
  assertEquals,
  AssertionError,
} from "@std/assert";
import { sample } from "./unstable_sample.ts";

Deno.test("(unstable) sample() does not mutate input", () => {
  const array = ["a", "abc", "ba"];
  sample(array);
  assertEquals(array, ["a", "abc", "ba"]);
});

Deno.test("(unstable) sample() handles empty input", () => {
  const actual = sample([]);
  assertEquals(actual, undefined);
});

Deno.test("(unstable) sample() handles array of numbers", () => {
  const input = [1, 2, 3];
  const actual = sample([1, 2, 3]);
  assert(actual && input.includes(actual));
});

Deno.test("(unstable) sample() handles array of objects", () => {
  const input = [
    {
      name: "(unstable) Anna",
      age: 18,
    },
    {
      name: "(unstable) Kim",
      age: 24,
    },
  ];
  const actual = sample(input);
  assert(actual && input.includes(actual));
});

Deno.test("(unstable) sample() returns the first element if there is only one element", () => {
  const input = [1];
  const actual = sample(input);
  assertEquals(actual, 1);
});

Deno.test("(unstable) sample() handles a string", () => {
  const input = "abc";
  const actual = sample(input);
  assert(actual && input.includes(actual));
});

Deno.test("(unstable) sample() handles a generator", () => {
  function* gen() {
    yield 1;
    yield 2;
    yield 3;
  }
  const actual = sample(gen());
  assert(actual && [1, 2, 3].includes(actual));
});
