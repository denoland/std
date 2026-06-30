// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { sortBy } from "./sort_by.ts";

Deno.test({
  name: "sortBy() handles no mutation",
  fn() {
    const array = ["a", "abc", "ba"];
    sortBy(array, (it) => it.length);

    assertEquals(array, ["a", "abc", "ba"]);
  },
});

Deno.test({
  name: "sortBy() calls the selector function once",
  fn() {
    let callCount = 0;
    const array = [0, 1, 2];
    sortBy(array, (it) => {
      callCount++;
      return it;
    });

    assertEquals(callCount, array.length);
  },
});

Deno.test({
  name: "sortBy() handles empty input",
  fn() {
    assertEquals(sortBy([], () => 5), []);
  },
});

Deno.test({
  name: "sortBy() handles single element",
  fn() {
    const single = [{ value: 42 }];
    assertEquals(sortBy(single, (it) => it.value), [{ value: 42 }]);
  },
});

Deno.test({
  name: "sortBy() handles two elements",
  fn() {
    assertEquals(sortBy([2, 1], (it) => it), [1, 2]);
    assertEquals(sortBy([1, 2], (it) => it), [1, 2]);
  },
});

Deno.test({
  name: "sortBy() handles identity selector",
  fn() {
    assertEquals(sortBy([2, 3, 1], (it) => it), [1, 2, 3]);
  },
});

Deno.test({
  name: "sortBy() handles stable sort",
  fn() {
    assertEquals(
      sortBy([
        { id: 1, date: "February 1, 2022" },
        { id: 2, date: "December 17, 1995" },
        { id: 3, date: "June 12, 2012" },
        { id: 4, date: "December 17, 1995" },
        { id: 5, date: "June 12, 2012" },
      ], (it) => new Date(it.date)),
      [
        { id: 2, date: "December 17, 1995" },
        { id: 4, date: "December 17, 1995" },
        { id: 3, date: "June 12, 2012" },
        { id: 5, date: "June 12, 2012" },
        { id: 1, date: "February 1, 2022" },
      ],
    );

    assertEquals(
      sortBy([
        { id: 1, str: "c" },
        { id: 2, str: "a" },
        { id: 3, str: "b" },
        { id: 4, str: "a" },
        { id: 5, str: "b" },
      ], (it) => it.str),
      [
        { id: 2, str: "a" },
        { id: 4, str: "a" },
        { id: 3, str: "b" },
        { id: 5, str: "b" },
        { id: 1, str: "c" },
      ],
    );
  },
});

Deno.test({
  name: "sortBy() handles special number values",
  fn() {
    assertEquals(
      sortBy([
        1,
        Number.POSITIVE_INFINITY,
        2,
        Number.NEGATIVE_INFINITY,
        3,
        Number.NaN,
        4,
        Number.NaN,
      ], (it) => it),
      [
        Number.NEGATIVE_INFINITY,
        1,
        2,
        3,
        4,
        Number.POSITIVE_INFINITY,
        Number.NaN,
        Number.NaN,
      ],
    );

    assertEquals(
      sortBy([
        Number.NaN,
        1,
        Number.POSITIVE_INFINITY,
        Number.NaN,
        7,
        Number.NEGATIVE_INFINITY,
        Number.NaN,
        2,
        6,
        5,
        9,
      ], (it) => it),
      [
        Number.NEGATIVE_INFINITY,
        1,
        2,
        5,
        6,
        7,
        9,
        Number.POSITIVE_INFINITY,
        Number.NaN,
        Number.NaN,
        Number.NaN,
      ],
    );

    // Test that NaN sort is stable.
    const nanArray = [
      { id: 1, nan: Number.NaN },
      { id: 2, nan: Number.NaN },
      { id: 3, nan: Number.NaN },
      { id: 4, nan: Number.NaN },
    ];
    assertEquals(sortBy(nanArray, ({ nan }) => nan), nanArray);
  },
});

Deno.test({
  name: "sortBy() handles invalid dates via getTime",
  fn() {
    // Use .getTime() to get numeric NaN which triggers proper NaN handling
    const items = [
      { id: 1, date: new Date("2020-01-01") },
      { id: 2, date: new Date("invalid") },
      { id: 3, date: new Date("2019-01-01") },
    ];
    const result = sortBy(items, (it) => it.date.getTime());
    // NaN from invalid date sorts to end
    assertEquals(result[0], { id: 3, date: new Date("2019-01-01") });
    assertEquals(result[1], { id: 1, date: new Date("2020-01-01") });
    assertEquals(result[2]!.id, 2);
  },
});

Deno.test({
  name: "sortBy() handles sortings",
  fn() {
    const testArray = [
      { name: "benchmark", stage: 3 },
      { name: "test", stage: 2 },
      { name: "build", stage: 1 },
      { name: "deploy", stage: 4 },
    ];

    assertEquals(sortBy(testArray, (it) => it.stage), [
      { name: "build", stage: 1 },
      { name: "test", stage: 2 },
      { name: "benchmark", stage: 3 },
      { name: "deploy", stage: 4 },
    ]);

    assertEquals(sortBy(testArray, (it) => it.name), [
      { name: "benchmark", stage: 3 },
      { name: "build", stage: 1 },
      { name: "deploy", stage: 4 },
      { name: "test", stage: 2 },
    ]);

    assertEquals(
      sortBy([
        "9007199254740999",
        "9007199254740991",
        "9007199254740995",
      ], (it) => BigInt(it)),
      [
        "9007199254740991",
        "9007199254740995",
        "9007199254740999",
      ],
    );

    assertEquals(
      sortBy([
        "February 1, 2022",
        "December 17, 1995",
        "June 12, 2012",
      ], (it) => new Date(it)),
      [
        "December 17, 1995",
        "June 12, 2012",
        "February 1, 2022",
      ],
    );
  },
});

Deno.test({
  name: "sortBy() handles desc ordering",
  fn() {
    assertEquals(
      sortBy(
        [
          "January 27, 1995",
          "November 26, 2020",
          "June 17, 1952",
          "July 15, 1993",
        ],
        (it) => new Date(it),
        { order: "desc" },
      ),
      [
        "November 26, 2020",
        "January 27, 1995",
        "July 15, 1993",
        "June 17, 1952",
      ],
    );
  },
});

Deno.test({
  name: "sortBy() handles explicit asc ordering",
  fn() {
    assertEquals(
      sortBy([3, 1, 2], (it) => it, { order: "asc" }),
      [1, 2, 3],
    );
  },
});

Deno.test({
  name: "sortBy() works with iterators",
  fn() {
    const set = new Set([10, 312, 99, 5.45, 100, -3, 4.6]);

    assertEquals(
      sortBy(set, (it) => it),
      [-3, 4.6, 5.45, 10, 99, 100, 312],
    );
    assertEquals(
      sortBy(set, (it) => it, { order: "desc" }),
      [312, 100, 99, 10, 5.45, 4.6, -3],
    );

    const map = new Map([
      ["a", 2],
      ["c", 1],
      ["b", 3],
    ]);

    assertEquals(sortBy(map, (it) => it[0]), [
      ["a", 2],
      ["b", 3],
      ["c", 1],
    ]);
    assertEquals(sortBy(map, (it) => it[1], { order: "desc" }), [
      ["b", 3],
      ["a", 2],
      ["c", 1],
    ]);
  },
});

Deno.test({
  name: "sortBy() works with generators",
  fn() {
    function* gen() {
      yield { value: 3 };
      yield { value: 1 };
      yield { value: 2 };
    }
    assertEquals(sortBy(gen(), (it) => it.value), [
      { value: 1 },
      { value: 2 },
      { value: 3 },
    ]);
  },
});

Deno.test({
  name: "sortBy() handles large arrays",
  fn() {
    const large = Array.from(
      { length: 10000 },
      (_, i) => ({ i, rand: Math.random() }),
    );
    const sorted = sortBy(large, (it) => it.rand);

    // Verify sorted order
    for (let i = 1; i < sorted.length; i++) {
      assertEquals(sorted[i - 1]!.rand <= sorted[i]!.rand, true);
    }
    // Verify no elements lost
    assertEquals(sorted.length, 10000);
  },
});

Deno.test({
  name: "sortBy() passes index to selector",
  fn() {
    assertEquals(sortBy([2, 3, 1], (_, index) => -index), [1, 3, 2]);
  },
});
