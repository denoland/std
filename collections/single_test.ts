// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { single } from "./single.ts";

function singleTest<I>(
  input: [Array<I>, (element: I) => boolean],
  expected: I | undefined,
  message?: string,
) {
  const actual = single(...input);
  assertEquals(actual, expected, message);
}

function singleDefaultPredicatorTest<I>(
  input: Array<I>,
  expected: I | undefined,
  message?: string,
) {
  const actual = single(input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "[collections/single] no mutation",
  fn() {
    const array = [1, 2, 3];
    single(array, (it) => it % 2 === 0);

    assertEquals(array, [1, 2, 3]);
  },
});

Deno.test({
  name: "[collections/single] empty input",
  fn() {
    singleTest(
      [[], (_) => true],
      undefined,
    );
  },
});

Deno.test({
  name: "[collections/single] only one element",
  fn() {
    singleTest(
      [[42], (_it) => true],
      42,
    );
    singleTest(
      [["foo"], (_it) => true],
      "foo",
    );
    singleTest(
      [[null], (_it) => true],
      null,
    );
    singleTest(
      [[undefined], (_it) => true],
      undefined,
    );
  },
});

Deno.test({
  name: "[collections/single] no matches",
  fn() {
    singleTest(
      [[9, 11, 13], (it) => it % 2 === 0],
      undefined,
    );
    singleTest(
      [["foo", "bar"], (it) => it.startsWith("z")],
      undefined,
    );
    singleTest(
      [[{ done: false }], (it) => it.done],
      undefined,
    );
  },
});

Deno.test({
  name: "[collections/single] only match",
  fn() {
    singleTest(
      [[9, 12, 13], (it) => it % 2 === 0],
      12,
    );
    singleTest(
      [["zap", "foo", "bar"], (it) => it.startsWith("z")],
      "zap",
    );
    singleTest(
      [[{ done: false }, { done: true }], (it) => it.done],
      { done: true },
    );
  },
});

Deno.test({
  name: "[collections/single] multiple matches",
  fn() {
    singleTest(
      [[9, 12, 13, 14], (it) => it % 2 === 0],
      undefined,
    );
    singleTest(
      [["zap", "foo", "bar", "zee"], (it) => it.startsWith("z")],
      undefined,
    );
  },
});

Deno.test({
  name: "[collections/single] default predicator",
  fn() {
    singleDefaultPredicatorTest(
      [42],
      42,
    );
    singleDefaultPredicatorTest(
      ["foo"],
      "foo",
    );
    singleDefaultPredicatorTest(
      [9, 11, 13],
      undefined,
    );
    singleDefaultPredicatorTest(
      ["foo", "bar"],
      undefined,
    );
  },
});
