// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertNotStrictEquals } from "@std/assert";
import { shuffle } from "./shuffle.ts";

Deno.test({
  name: "shuffle() returns a new array of the same length",
  fn() {
    const numbers = [1, 2, 3, 4];
    const shuffled = shuffle(numbers);
    assertEquals(shuffled.length, 4);
    assertNotStrictEquals(shuffled, numbers);
  },
});

Deno.test({
  name: "shuffle() preserves all elements",
  fn() {
    const numbers = [1, 2, 3, 4];
    const shuffled = shuffle(numbers);
    assertEquals(shuffled.sort(), [1, 2, 3, 4]);
  },
});

Deno.test({
  name: "shuffle() does not mutate input",
  fn() {
    const numbers = [1, 2, 3, 4];
    shuffle(numbers);
    assertEquals(numbers, [1, 2, 3, 4]);
  },
});

Deno.test({
  name: "shuffle() handles empty array",
  fn() {
    assertEquals(shuffle([]), []);
  },
});

Deno.test({
  name: "shuffle() handles single element",
  fn() {
    assertEquals(shuffle([42]), [42]);
  },
});
