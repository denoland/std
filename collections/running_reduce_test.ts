// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { runningReduce } from "./running_reduce.ts";

Deno.test({
  name: "[collections/runningReduce] no mutation",
  fn() {
    const numbers = [1, 2, 3, 4, 5];
    runningReduce(numbers, (sum, current) => sum + current, 0);

    assertEquals(numbers, [1, 2, 3, 4, 5]);
  },
});

Deno.test({
  name: "[collections/runningReduce] array of numbers",
  fn() {
    const numbers = [1, 2, 3, 4, 5];
    const result = runningReduce(numbers, (sum, current) => sum + current, 0);

    assertEquals(result, [1, 3, 6, 10, 15]);
  },
});

Deno.test({
  name: "[collections/runningReduce] array of strings",
  fn() {
    const strings = ["a", "b", "c", "d", "e"];
    const result = runningReduce(strings, (str, current) => str + current, "");

    assertEquals(result, ["a", "ab", "abc", "abcd", "abcde"]);
  },
});

Deno.test({
  name: "[collections/runningReduce] empty input",
  fn() {
    const result = runningReduce([], (sum, current) => sum + current, 0);

    assertEquals(result, []);
  },
});
