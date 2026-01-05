// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { cycle } from "./unstable_cycle.ts";

Deno.test({
  name: "cycle() basic usage with an array",
  fn() {
    const cyclic = cycle([1, 2, 3]);
    const result = [];

    for (const num of cyclic) {
      result.push(num);
      if (result.length === 7) break;
    }
    assertEquals(result, [1, 2, 3, 1, 2, 3, 1]);
  },
});

Deno.test({
  name: "cycle() works with a string iterable",
  fn() {
    const cyclic = cycle("ab");
    const result = [];

    for (const ch of cyclic) {
      result.push(ch);
      if (result.length === 5) break;
    }
    assertEquals(result, ["a", "b", "a", "b", "a"]);
  },
});

Deno.test({
  name: "cycle() works with a single element iterable",
  fn() {
    const cyclic = cycle([42]);
    const result = [];

    for (const num of cyclic) {
      result.push(num);
      if (result.length === 4) break;
    }
    assertEquals(result, [42, 42, 42, 42]);
  },
});

Deno.test({
  name: "cycle() does not mutate the input iterable",
  fn() {
    const input = [1, 2, 3];
    const cyclic = cycle(input);

    const result = [];
    for (const num of cyclic) {
      result.push(num);
      if (result.length === 5) break;
    }

    assertEquals(input, [1, 2, 3]);
  },
});
