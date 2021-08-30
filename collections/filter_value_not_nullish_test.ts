// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { filterValuesNotNullish } from "./filter_value_not_nullish.ts";

function filterValuesNotNullishTest<T, O>(
  input: [record: Readonly<Record<string, T>>],
  expected: Record<string, NonNullable<T>>,
  message?: string,
) {
  const actual = filterValuesNotNullish(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "[collections/filterValuesNotNullish] no mutation",
  fn() {
    const record = {
      Arnold: "William",
      Sarah: null,
      Kim: "Martha",
    };

    filterValuesNotNullish(record);

    assertEquals(record, {
      Arnold: "William",
      Sarah: null,
      Kim: "Martha",
    });
  },
});

Deno.test({
  name: "[collections/filterValuesNotNullish] empty input",
  fn() {
    filterValuesNotNullishTest([{}], {});
  },
});

Deno.test({
  name: "[collections/filterValuesNotNullish] identity",
  fn() {
    filterValuesNotNullishTest(
      [
        {
          Arnold: "William",
          Sarah: "Arthur",
          Kim: "Martha",
        },
      ],
      {
        Arnold: "William",
        Sarah: "Arthur",
        Kim: "Martha",
      },
    );
  },
});

Deno.test({
  name: "[collections/filterValuesNotNullish] falsy values",
  fn() {
    filterValuesNotNullishTest(
      [
        {
          Arnold: false,
          Sarah: "",
          Kim: {},
          William: 0,
          Martha: [],
        },
      ],
      {
        Arnold: false,
        Sarah: "",
        Kim: {},
        William: 0,
        Martha: [],
      },
    );
  },
});

Deno.test({
  name: "[collections/filterValuesNotNullish] nullish value",
  fn() {
    filterValuesNotNullishTest(
      [
        {
          Arnold: "William",
          Sarah: undefined,
          Kim: "Martha",
        },
      ],
      {
        Arnold: "William",
        Kim: "Martha",
      },
    );
    filterValuesNotNullishTest(
      [
        {
          Arnold: "William",
          Sarah: null,
          Kim: "Martha",
        },
      ],
      {
        Arnold: "William",
        Kim: "Martha",
      },
    );
  },
});
