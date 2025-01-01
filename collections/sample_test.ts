// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { sample } from "./sample.ts";

Deno.test({
  name: "sample() handles no mutation",
  fn() {
    const array = ["a", "abc", "ba"];
    sample(array);

    assertEquals(array, ["a", "abc", "ba"]);
  },
});

Deno.test({
  name: "sample() handles empty input",
  fn() {
    const actual = sample([]);
    assertEquals(actual, undefined);
  },
});

Deno.test({
  name: "sample() handles array of numbers",
  fn() {
    const input = [1, 2, 3];
    const actual = sample([1, 2, 3]);

    assert(actual && input.includes(actual));
  },
});

Deno.test({
  name: "sample() handles array of objects",
  fn() {
    const input = [
      {
        name: "Anna",
        age: 18,
      },
      {
        name: "Kim",
        age: 24,
      },
    ];
    const actual = sample(input);

    assert(actual && input.includes(actual));
  },
});
