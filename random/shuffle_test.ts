// Copyright 2018-2025 the Deno authors. MIT license.
import { randomSeeded } from "./seeded.ts";
import { shuffle } from "./shuffle.ts";
import {
  assertAlmostEquals,
  assertEquals,
  assertNotStrictEquals,
} from "@std/assert";

Deno.test("shuffle() handles empty arrays", () => {
  const array: number[] = [];
  const shuffled = shuffle(array);

  assertEquals(shuffled, array);
  assertNotStrictEquals(shuffled, array);
});

Deno.test("shuffle() handles arrays with only one item", () => {
  const array = [1];
  const shuffled = shuffle(array);

  assertEquals(shuffled, array);
  assertNotStrictEquals(shuffled, array);
});

Deno.test("shuffle() handles arrays with two items", () => {
  const prng = randomSeeded(0n);
  const items = [1, 2];

  const results = new Set<string>();
  for (let i = 0; i < 10; i++) {
    results.add(JSON.stringify(shuffle(items, { prng })));
  }
  assertEquals(results.size, 2);
});

Deno.test("shuffle() shuffles the provided array", () => {
  const prng = randomSeeded(0n);

  const items = [1, 2, 3, 4, 5];

  assertEquals(shuffle(items, { prng }), [2, 3, 5, 4, 1]);
  assertEquals(shuffle(items, { prng }), [3, 4, 1, 5, 2]);
  assertEquals(shuffle(items, { prng }), [2, 4, 5, 3, 1]);
});

Deno.test("shuffle() with PRNG always returning 0 produces predictable result", () => {
  const items = [1, 2, 3, 4, 5];
  assertEquals(
    shuffle(items, { prng: () => 0 }),
    shuffle(items, { prng: () => 0 }),
  );
});

Deno.test("shuffle() with PRNG returning max value produces predictable result", () => {
  const items = [1, 2, 3, 4, 5];
  assertEquals(
    shuffle(items, { prng: () => 0.9999999999 }),
    shuffle(items, { prng: () => 0.9999999999 }),
  );
});

Deno.test("shuffle() handles arrays with null and undefined values", () => {
  const prng = randomSeeded(0n);
  const items = [1, null, undefined, 2, null];
  const shuffled = shuffle(items, { prng });

  assertEquals(shuffled.length, items.length);
  assertEquals(shuffled.filter((x) => x === null).length, 2);
  assertEquals(shuffled.filter((x) => x === undefined).length, 1);
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
  const prng = randomSeeded(0n);

  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const results = Array.from(
    { length: 1e3 },
    () => shuffle(items, { prng }),
  );

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
