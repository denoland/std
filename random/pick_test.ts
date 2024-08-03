// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertAlmostEquals, assertEquals } from "@std/assert";
import { pick, pickWeighted } from "./pick.ts";
import { SeededPrng } from "./seeded.ts";

Deno.test("pick() picks a random item from the provided items", () => {
  const items = ["a", "b", "c"];
  const { random } = new SeededPrng(1);

  const picks = Array.from({ length: 10 }, () => pick(items, { random }));

  assertEquals(picks, ["a", "c", "a", "c", "a", "b", "b", "c", "a", "b"]);
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
    Object.groupBy(picks, (item) => item.value),
  ) as (typeof items)[];

  assertEquals(groups.length, 3);

  for (const group of groups) {
    const item = items.find((item) => item.value === group[0]!.value)!;
    console.log(item);
    assertAlmostEquals(
      group.length,
      picks.length / totalWeight * item.weight,
      picks.length / 10,
    );
  }
});
