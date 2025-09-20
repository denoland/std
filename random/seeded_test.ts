// Copyright 2018-2025 the Deno authors. MIT license.
import { getRandomValuesSeeded } from "./get_random_values_seeded.ts";
import { nextFloat64 } from "./next_float_64.ts";
import { type Prng, randomSeeded } from "./seeded.ts";
import { assertAlmostEquals, assertEquals } from "@std/assert";

Deno.test("randomSeeded() generates random numbers", () => {
  const prng = randomSeeded(1n);

  assertEquals(prng(), 0.20176767697557807);
  assertEquals(prng(), 0.4911644416861236);
  assertEquals(prng(), 0.7924694607499987);
});

Deno.test("getRandomValuesSeeded() with nextFloat64() gives relatively uniform distribution of random numbers", async (t) => {
  function randomSeeded53Bit(seed: bigint): Prng {
    const getRandomValues = getRandomValuesSeeded(seed);
    return () => nextFloat64(getRandomValues);
  }

  const prng = randomSeeded53Bit(1n);
  const results = Array.from({ length: 1e4 }, prng);

  await t.step("all results are in [0, 1)", () => {
    assertEquals(results.every((result) => result >= 0 && result < 1), true);
  });

  await t.step("all (or almost all) results are unique", () => {
    assertAlmostEquals(new Set(results).size, results.length, 10);
  });

  await t.step("the mean average of the results is close to 0.5", () => {
    const avg = results.reduce((sum, n) => sum + n, 0) / results.length;
    assertAlmostEquals(avg, 0.5, 0.05);
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
          results.length / 50,
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

Deno.test("getRandomValuesSeeded() generates bytes", () => {
  const prng = getRandomValuesSeeded(1n);
  assertEquals(
    prng(new Uint8Array(5)),
    new Uint8Array([230, 11, 167, 51, 238]),
  );
});

Deno.test("getRandomValuesSeeded() fixed results for some seeds https://github.com/denoland/std/issues/6688", () => {
  const seed = 6552010792480112863n;
  const prng = randomSeeded(seed);

  assertEquals(prng(), 0.6705842935480177);
});
