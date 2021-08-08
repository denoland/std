// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../../testing/asserts.ts";
import { mapValues } from "../map_values.ts";
import { Selector } from "../types.ts";

function mapValuesTest<T, O>(
  input: [Record<string, T>, Selector<T, O>],
  expected: Record<string, O>,
  message?: string,
) {
  const actual = mapValues(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "[collections/mapValues] no mutation",
  fn() {
    const object = { a: 5, b: true };
    mapValues(object, (it) => it ?? "nothing");

    assertEquals(object, { a: 5, b: true });
  },
});

Deno.test({
  name: "[collections/mapValues] empty input",
  fn() {
    mapValuesTest(
      [{}, (it) => it],
      {},
    );
  },
});

Deno.test({
  name: "[collections/mapValues] identity",
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
  name: "[collections/mapValues] falsy values",
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
  name: "[collections/mapValues] normal mapppers",
  fn() {
    mapValuesTest(
      [
        {
          "FoodFile": "/home/deno/food.txt",
          "CalendarFile": "/home/deno/weekend.cal",
        },
        (path) => path.substr(path.lastIndexOf(".")),
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
