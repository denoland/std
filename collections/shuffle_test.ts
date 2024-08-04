// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { SeededPrng } from "../random/seeded.ts";
import { shuffle } from "./shuffle.ts";
import { assertAlmostEquals, assertEquals } from "@std/assert";

Deno.test("shuffle() handles empty arrays", () => {
  assertEquals(shuffle([]), []);
});

Deno.test("shuffle() handles arrays with only one item", () => {
  assertEquals(shuffle([1]), [1]);
});

Deno.test("shuffle() shuffles the provided array", () => {
  const { random } = new SeededPrng(2);
  const items = [1, 2, 3, 4, 5];

  assertEquals(shuffle(items, { random }), [3, 2, 5, 4, 1]);
  assertEquals(shuffle(items, { random }), [1, 3, 4, 5, 2]);
  assertEquals(shuffle(items, { random }), [2, 5, 4, 3, 1]);
});

Deno.test("shuffle() returns a copy and without modifying the original array", () => {
  const items = [1, 2, 3, 4, 5];
  const originalItems = [...items];

  for (let i = 0; i < 10; ++i) {
    shuffle(items);
    assertEquals(items, originalItems);
  }
});

Deno.test("shuffle() gives relatively uniform distribution of results", () => {
  const { random } = new SeededPrng(1);
  const items = [1, 2, 3, 4, 5];

  const results = Array.from({ length: 100 }, () => shuffle(items, { random }));

  for (const idx of items.keys()) {
    const groupsByidx = Object.values(
      Object.groupBy(results.map((result) => result[idx]), (item) => item!),
    ) as number[][];

    for (const group of groupsByidx) {
      assertAlmostEquals(
        group.length,
        results.length / items.length,
        results.length / 10,
      );
    }
  }
});
