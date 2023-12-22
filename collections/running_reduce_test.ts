// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import { runningReduce } from "./running_reduce.ts";

Deno.test({
  name: "runningReduce() handles no mutation",
  fn() {
    const numbers = [1, 2, 3, 4, 5];
    runningReduce(numbers, (sum, current) => sum + current, 0);

    assertEquals(numbers, [1, 2, 3, 4, 5]);
  },
});

Deno.test({
  name: "runningReduce() handles array of numbers initial value 0",
  fn() {
    const numbers = [1, 2, 3, 4, 5];
    const result = runningReduce(numbers, (sum, current) => sum + current, 0);

    assertEquals(result, [1, 3, 6, 10, 15]);
  },
});

Deno.test({
  name: "runningReduce() handles array of numbers initial value 5",
  fn() {
    const numbers = [1, 2, 3, 4, 5];
    const result = runningReduce(numbers, (sum, current) => sum + current, 5);

    assertEquals(result, [6, 8, 11, 15, 20]);
  },
});

Deno.test({
  name: `runningReduce() handles array of strings initial value ""`,
  fn() {
    const strings = ["a", "b", "c", "d", "e"];
    const result = runningReduce(strings, (str, current) => str + current, "");

    assertEquals(result, ["a", "ab", "abc", "abcd", "abcde"]);
  },
});

Deno.test({
  name: `runningReduce() handles array of strings initial value "foo"`,
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
  name: "runningReduce() handles empty array initial value 0",
  fn() {
    const result = runningReduce([], (sum, current) => sum + current, 0);

    assertEquals(result, []);
  },
});

Deno.test({
  name: "runningReduce() handles empty array initial value 5",
  fn() {
    const result = runningReduce([], (sum, current) => sum + current, 5);

    assertEquals(result, []);
  },
});

Deno.test({
  name: "runningReduce() handles array of objects initial value 0",
  fn() {
    const medals = [
      { country: "USA", count: 113 },
      { country: "CHN", count: 88 },
      { country: "JPN", count: 58 },
    ];
    const result = runningReduce(
      medals,
      (sum, current) => sum + current.count,
      0,
    );

    assertEquals(result, [113, 201, 259]);
  },
});

Deno.test({
  name: `runningReduce() handles array of objects initial value ""`,
  fn() {
    const medals = [
      { country: "USA", count: 113 },
      { country: "CHN", count: 88 },
      { country: "JPN", count: 58 },
    ];
    const result = runningReduce(
      medals,
      (sum, current) => sum + current.count,
      "",
    );

    assertEquals(result, ["113", "11388", "1138858"]);
  },
});

Deno.test({
  name: "runningReduce() reduces array of numbers with currentIndex",
  fn() {
    const numbers = [1, 2, 3, 4, 5];
    const result = runningReduce(
      numbers,
      (sum, current, currentIndex) => sum + current + currentIndex,
      0,
    );

    assertEquals(result, [1, 4, 9, 16, 25]);
  },
});

Deno.test({
  name: "runningReduce() reduces array of strings with currentIndex",
  fn() {
    const strings = ["a", "b", "c", "d", "e"];
    const result = runningReduce(
      strings,
      (sum, current, currentIndex) => sum + current + currentIndex,
      "",
    );

    assertEquals(result, ["a0", "a0b1", "a0b1c2", "a0b1c2d3", "a0b1c2d3e4"]);
  },
});

Deno.test({
  name: "runningReduce() reduces array of objects with currentIndex",
  fn() {
    const medals = [
      { country: "USA", count: 113 },
      { country: "CHN", count: 88 },
      { country: "JPN", count: 58 },
    ];
    const result = runningReduce(
      medals,
      (_, current, currentIndex) => {
        return currentIndex + current.country;
      },
      "",
    );

    assertEquals(result, ["0USA", "1CHN", "2JPN"]);
  },
});
