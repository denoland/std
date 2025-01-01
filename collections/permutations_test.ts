// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { permutations } from "./permutations.ts";

function permutationsTest<T>(
  input: [Array<T>],
  expected: Array<Array<T>>,
  message?: string,
) {
  const actual = permutations(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "permutations() handles no mutation",
  fn() {
    const array = [1, 2, 3];
    permutations(array);

    assertEquals(array, [1, 2, 3]);
  },
});

Deno.test({
  name: "permutations() handles empty input",
  fn() {
    permutationsTest(
      [[]],
      [],
    );
  },
});

Deno.test({
  name: "permutations() handles one element",
  fn() {
    permutationsTest(
      [
        [true],
      ],
      [[true]],
    );
    permutationsTest(
      [
        [undefined],
      ],
      [[undefined]],
    );
  },
});

Deno.test({
  name: "permutations() ignores equality",
  fn() {
    permutationsTest(
      [[1, 1]],
      [[1, 1], [1, 1]],
    );
  },
});

Deno.test({
  name: "permutations() handles examples",
  fn() {
    permutationsTest(
      [["a", "b", "c"]],
      [
        ["a", "b", "c"],
        ["b", "a", "c"],
        ["c", "a", "b"],
        ["a", "c", "b"],
        ["b", "c", "a"],
        ["c", "b", "a"],
      ],
    );
    permutationsTest(
      [[true, false, true]],
      [
        [true, false, true],
        [false, true, true],
        [true, true, false],
        [true, true, false],
        [false, true, true],
        [true, false, true],
      ],
    );
  },
});
