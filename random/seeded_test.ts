// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { SeededPrng } from "./seeded.ts";
import { assertAlmostEquals, assertEquals } from "@std/assert";

Deno.test("SeededPrng#random() generates random numbers", async (t) => {
  await t.step("seeded with a 3-tuple", () => {
    const prng = new SeededPrng([17740, 29216, 6029]);
    assertEquals(prng.random(), 0.8280769879176713);
    assertEquals(prng.random(), 0.6090445210936662);
    assertEquals(prng.random(), 0.10273315291976637);
  });

  await t.step("seeded with a number", () => {
    const prng = new SeededPrng(1722685125224);
    assertEquals(prng.random(), 0.8773132982020172);
    assertEquals(prng.random(), 0.18646363474450567);
    assertEquals(prng.random(), 0.12047326745398279);
  });
});

Deno.test("SeededPrng's `seed` parameter is converted to a 3-tuple when set with a number", async (t) => {
  await t.step("seeded with a number", () => {
    const scalarSeed = 1722685125224;
    const expectedSeed = [5489, 15597, 5057] as const;
    const prng1 = new SeededPrng(scalarSeed);
    assertEquals(prng1.seed, expectedSeed);
    assertEquals(prng1.random(), new SeededPrng(expectedSeed).random());
  });
});

Deno.test("SeededPrng#randomSeed() returns a new 3-tuple seed", async (t) => {
  await t.step("returns a new seed", () => {
    const prng = new SeededPrng([17740, 29216, 6029]);
    const seed = prng.randomSeed();
    assertEquals(seed, [25066, 18459, 3116]);
  });
});

Deno.test("SeededPrng#random() gives relatively uniform distribution of random numbers", async (t) => {
  const prng = new SeededPrng(1);
  const results = Array.from({ length: 1e4 }, prng.random);

  await t.step("all results are between 0 and 1", () => {
    assertEquals(results.every((result) => result >= 0 && result < 1), true);
  });

  await t.step("all (or almost all) results are unique", () => {
    assertAlmostEquals(new Set(results).size, results.length, 10);
  });

  await t.step("the mean average of the results is close to 0.5", () => {
    const average = results.reduce((sum, result) => sum + result, 0) /
      results.length;
    assertAlmostEquals(average, 0.5, 0.05);
  });

  await t.step(
    "approximately one tenth of the results lie in each decile",
    () => {
      const deciles = Object.values(
        Object.groupBy(results, (result) => Math.floor(result * 10)),
      ) as number[][];

      assertEquals(deciles.length, 10);

      for (const decile of deciles) {
        assertAlmostEquals(
          decile.length,
          results.length / 10,
          results.length / 100,
        );
      }
    },
  );

  await t.step(
    "the mean average of each thousand results is close to 0.5",
    () => {
      const slices = Object.values(
        Object.groupBy(results, (_, idx) => Math.floor(idx / 1000)),
      ) as number[][];

      for (const results of slices) {
        const average = results.reduce((sum, result) => sum + result, 0) /
          results.length;
        assertAlmostEquals(average, 0.5, 0.05);
      }
    },
  );
});
