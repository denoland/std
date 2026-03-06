// Copyright 2018-2026 the Deno authors. MIT license.

import { sample } from "./sample.ts";
import {
  assertAlmostEquals,
  assertArrayIncludes,
  assertEquals,
  assertThrows,
} from "@std/assert";
import { randomSeeded } from "./seeded.ts";

Deno.test({
  name: "sample() handles no mutation",
  fn() {
    const array = ["a", "abc", "ba"];
    sample(array);

    assertEquals(array, ["a", "abc", "ba"]);
  },
});

Deno.test({
  name: "sample() returns undefined if the array is empty",
  fn() {
    const actual = sample([]);
    assertEquals(actual, undefined);
  },
});

Deno.test({
  name: "sample() handles array of numbers",
  fn() {
    const input = [1, 2, 3];
    const actual = sample(input);

    assertArrayIncludes(input, [actual]);
  },
});

Deno.test({
  name: "sample() handles array of objects",
  fn() {
    const input = [
      {
        name: "Anna",
        age: 18,
      },
      {
        name: "Kim",
        age: 24,
      },
    ];
    const actual = sample(input);

    assertArrayIncludes(input, [actual]);
  },
});

Deno.test("sample() picks a random item from the provided items", () => {
  const items = ["a", "b", "c"];
  const prng = randomSeeded(0n);

  const picks = Array.from(
    { length: 10 },
    () => sample(items, { prng }),
  );

  assertEquals(picks, ["a", "c", "a", "a", "a", "b", "a", "c", "a", "b"]);
});

Deno.test("sample() with weights returns undefined if the array is empty", () => {
  const items: unknown[] = [];
  const weights: number[] = [];
  assertEquals(sample(items, { weights }), undefined);
});

Deno.test("sample() with weights throws if the total weight is 0", () => {
  const items = ["a", "b", "c"];
  const weights = [0, 0, 0];

  assertThrows(
    () => sample(items, { weights }),
    RangeError,
    "Total weight must be greater than 0",
  );
});

Deno.test("sample() with weights throws if the wrong number of weights is provided", () => {
  const items = ["a", "b", "c"] as const;
  const weights = [1, 2, 3, 4] as const;

  assertThrows(
    () => sample(items, { weights }),
    RangeError,
    "The length of the weights array must match the length of the input array",
  );
});

Deno.test("sample() works with typed arrays", () => {
  const items = new Uint8Array([0, 1, 2]);
  const weights = new Uint8Array([10, 5, 250]);
  const prng = randomSeeded(1n);

  assertEquals(sample(items, { weights, prng }), 2);
});

Deno.test("sample() with weights never picks an item with weight of 0", () => {
  const items = ["a", "b"];
  const weights = [1, 0];

  assertEquals(sample(items, { weights }), "a");
});

Deno.test("sample() with weights picks a random item from the provided items with a weighted probability", () => {
  const weightedItems = [["a", 1], ["b", 2], ["c", 3]] as const;
  const weights = weightedItems.map(([, weight]) => weight);
  const values = weightedItems.map(([value]) => value);
  const totalWeight = weights.reduce((sum, n) => sum + n, 0);
  const prng = randomSeeded(0n);

  const picks = Array.from(
    { length: 1000 },
    () => sample(values, { prng, weights }),
  );

  const groups = Object.values(
    Object.groupBy(picks, (item) => item!),
  ) as string[][];

  assertEquals(groups.length, 3);

  for (const group of groups) {
    const [, weight] = weightedItems.find(([item]) => item === group[0]!)!;
    assertAlmostEquals(
      group.length,
      picks.length / totalWeight * weight,
      picks.length / 10,
    );
  }
});

Deno.test("sample() with weights works with a Map", () => {
  const weightedItems = new Map([["a", 1], ["b", 2], ["c", 999]]);
  const prng = randomSeeded(0n);

  const result = sample([...weightedItems.keys()], {
    weights: [...weightedItems.values()],
    prng,
  });

  assertEquals(result, "c");
});
