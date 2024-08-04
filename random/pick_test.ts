// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import {
  assertAlmostEquals,
  assertEquals,
  AssertionError,
  assertThrows,
} from "@std/assert";
import { pick, pickWeighted } from "./pick.ts";
import { SeededPrng } from "./seeded.ts";

Deno.test("pick() returns undefined if the array is empty", () => {
  const items: string[] = [];
  assertEquals(pick(items), undefined);
});

Deno.test("pick() picks a random item from the provided items", () => {
  const items = ["a", "b", "c"];
  const { random } = new SeededPrng(1);

  const picks = Array.from({ length: 10 }, () => pick(items, { random }));

  assertEquals(picks, ["a", "c", "a", "c", "a", "a", "a", "b", "a", "c"]);
});

Deno.test("pickWeighted() returns undefined if the array is empty", () => {
  const items: Array<{ value: string; weight: number }> = [];
  assertEquals(pickWeighted(items), undefined);
});

Deno.test("pickWeighted() throws if the total weight is 0", () => {
  const items = [{ value: "a", weight: 0 }, { value: "b", weight: 0 }];

  assertThrows(
    () => pickWeighted(items),
    AssertionError,
    "Total weight must be greater than 0",
  );
});

Deno.test("pickWeighted() never picks an item with weight of 0", () => {
  const items = [{ value: "a", weight: 1 }, { value: "b", weight: 0 }];
  assertEquals(pickWeighted(items), "a");
});

Deno.test("pickWeighted() picks a random item from the provided items with a weighted probability", () => {
  const items = [{ value: "a", weight: 1 }, { value: "b", weight: 2 }, {
    value: "c",
    weight: 3,
  }];
  const totalWeight = items.reduce((sum, { weight }) => sum + weight, 0);
  const { random } = new SeededPrng(1);

  const picks = Array.from(
    { length: 1000 },
    () => pickWeighted(items, { random }),
  );

  const groups = Object.values(
    Object.groupBy(picks, (item) => item!),
  ) as string[][];

  assertEquals(groups.length, 3);

  for (const group of groups) {
    const item = items.find((item) => item.value === group[0]!)!;
    assertAlmostEquals(
      group.length,
      picks.length / totalWeight * item.weight,
      picks.length / 10,
    );
  }
});
