// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { runningReduce } from "./running_reduce.ts";

Deno.test({
  name: "[collections/runningReduce] no mutation",
  fn() {
    const numbers = [1, 2, 3, 4, 5];
    runningReduce(numbers, (sum, current) => sum + current);

    assertEquals(numbers, [1, 2, 3, 4, 5]);
  },
});

Deno.test({
  name: "[collections/runningReduce] array of numbers",
  fn() {
    const numbers = [1, 2, 3, 4, 5];
    const result = runningReduce(numbers, (sum, current) => sum + current);

    assertEquals(result, [1, 3, 6, 10, 15]);
  },
});

Deno.test({
  name: "[collections/runningReduce] array of numbers with initialValue 0",
  fn() {
    const numbers = [1, 2, 3, 4, 5];
    const result = runningReduce(numbers, (sum, current) => sum + current, 0);

    assertEquals(result, [1, 3, 6, 10, 15]);
  },
});

Deno.test({
  name: "[collections/runningReduce] array of numbers with initialValue",
  fn() {
    const numbers = [1, 2, 3, 4, 5];
    const result = runningReduce(numbers, (sum, current) => sum + current, 5);

    assertEquals(result, [6, 8, 11, 15, 20]);
  },
});

Deno.test({
  name: "[collections/runningReduce] array of strings",
  fn() {
    const strings = ["a", "b", "c", "d", "e"];
    const result = runningReduce(strings, (str, current) => str + current);

    assertEquals(result, ["a", "ab", "abc", "abcd", "abcde"]);
  },
});

Deno.test({
  name: `[collections/runningReduce] array of strings with initialValue ""`,
  fn() {
    const strings = ["a", "b", "c", "d", "e"];
    const result = runningReduce(strings, (str, current) => str + current, "");

    assertEquals(result, ["a", "ab", "abc", "abcd", "abcde"]);
  },
});

Deno.test({
  name: "[collections/runningReduce] array of strings with initialValue",
  fn() {
    const strings = ["a", "b", "c", "d", "e"];
    const result = runningReduce(
      strings,
      (str, current) => str + current,
      "foo",
    );

    assertEquals(result, ["fooa", "fooab", "fooabc", "fooabcd", "fooabcde"]);
  },
});

Deno.test({
  name: "[collections/runningReduce] empty array",
  fn() {
    const result = runningReduce(
      [],
      (sum, current) => (sum + current) as never,
    );

    assertEquals(result, []);
  },
});

Deno.test({
  name: "[collections/runningReduce] array of strings and number",
  fn() {
    const result = runningReduce(
      [1, "foo", 2, "bar"],
      // deno-lint-ignore no-explicit-any
      (sum: any, current: any) => sum + current,
    );

    assertEquals(result, [1, "1foo", "1foo2", "1foo2bar"]);
  },
});

Deno.test({
  name:
    "[collections/runningReduce] array of strings and number with initialValue",
  fn() {
    const result = runningReduce(
      [1, "foo", 2, "bar"],
      // deno-lint-ignore no-explicit-any
      (sum: any, current: any) => sum + current,
      5,
    );

    assertEquals(result, [6, "6foo", "6foo2", "6foo2bar"]);
  },
});
