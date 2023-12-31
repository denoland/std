// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import { mapValues } from "./map_values.ts";

function mapValuesTest<T, O>(
  input: [Record<string, T>, (value: T) => O],
  expected: Record<string, O>,
  message?: string,
) {
  const actual = mapValues(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "mapValues() handles no mutation",
  fn() {
    const object = { a: 5, b: true };
    mapValues(object, (it) => it ?? "nothing");

    assertEquals(object, { a: 5, b: true });
  },
});

Deno.test({
  name: "mapValues() handles empty input",
  fn() {
    mapValuesTest(
      [{}, (it) => it],
      {},
    );
  },
});

Deno.test({
  name: "mapValues() handles identity",
  fn() {
    mapValuesTest(
      [
        {
          foo: true,
          bar: "lorem",
          1: -5,
        },
        (it) => it,
      ],
      {
        foo: true,
        bar: "lorem",
        1: -5,
      },
    );
  },
});

Deno.test({
  name: "mapValues() handles falsy values",
  fn() {
    mapValuesTest<number, null | undefined | string | boolean>(
      [
        {
          "something": 0,
          "yetanotherkey": 1,
          "andonemore": 2,
          "lastone": 3,
        },
        (it) => [null, undefined, "", false][it],
      ],
      {
        "something": null,
        "yetanotherkey": undefined,
        "andonemore": "",
        "lastone": false,
      },
    );
  },
});

Deno.test({
  name: "mapValues() handles normal mappers",
  fn() {
    mapValuesTest(
      [
        {
          "FoodFile": "/home/deno/food.txt",
          "CalendarFile": "/home/deno/weekend.cal",
        },
        (path) => path.slice(path.lastIndexOf(".")),
      ],
      {
        "FoodFile": ".txt",
        "CalendarFile": ".cal",
      },
    );
    mapValuesTest(
      [
        {
          "Curry": 20,
          "Beans": 2,
          "Rice": 3.5,
        },
        (price) => price.toFixed(2),
      ],
      {
        "Curry": "20.00",
        "Beans": "2.00",
        "Rice": "3.50",
      },
    );
  },
});

Deno.test({
  name: "mapValues() preserves key type (Record)",
  fn() {
    type Variants = "a" | "b";
    const input: Record<Variants, string> = { a: "a", b: "b" };
    const actual = mapValues(
      input,
      (_: string) => 1,
    );
    const expected = { a: 1, b: 1 };

    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "mapValues() preserves key type (Partial Record)",
  fn() {
    type Variants = "a" | "b";
    const input: Partial<Record<Variants, string>> = { a: "a" };
    const actual = mapValues(
      input,
      (_: string) => 1,
    );
    const expected = { a: 1 };

    assertEquals(actual, expected);
  },
});
