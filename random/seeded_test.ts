// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { SeededPrng, type State } from "./seeded.ts";
import { assertAlmostEquals, assertEquals, assertThrows } from "@std/assert";

Deno.test("SeededPrng constructor validates its parameters", async (t) => {
  await t.step("zero inc converted to 1", () => {
    const prng = new SeededPrng({ seed: [1n, 0n] });
    assertEquals(prng.state, [1n, 1n]);
  });

  await t.step("negative wraps to positive", () => {
    const prng = new SeededPrng({ seed: [-1n, -1n] });
    assertEquals(prng.state, [18446744073709551615n, 18446744073709551615n]);
  });

  await t.step("too large wraps around", () => {
    const prng = new SeededPrng({
      seed: [18446744073709551616n, 18446744073709551616n],
    });
    assertEquals(prng.state, [0n, 1n]);
  });

  await t.step("3-tuple is truncated to 2-tuple", () => {
    const state = [1n, 1n, 1n];
    const prng = new SeededPrng({ seed: state as State });
    assertEquals(prng.state, [1n, 1n]);
  });

  await t.step("incomplete 2-tuple throws", () => {
    const state = [0n];
    assertThrows(
      () => new SeededPrng({ seed: state as State }),
    );
  });
});

Deno.test("SeededPrng#random() generates random numbers", async (t) => {
  await t.step("seeded with a 2-tuple", () => {
    const prng = new SeededPrng({
      seed: [15571158787346713293n, 10094278282842616068n],
    });

    assertEquals(prng.random(), 0.37356163561344147);
    assertEquals(prng.random(), 0.46312552504241467);
    assertEquals(prng.random(), 0.11483323690481484);
  });

  await t.step("seeded with a number", () => {
    const prng = new SeededPrng({ seed: 3247111518449632355n });
    assertEquals(prng.random(), 0.24684110353700817);
    assertEquals(prng.random(), 0.23029523785226047);
    assertEquals(prng.random(), 0.8534279884770513);
  });
});

Deno.test("SeededPrng's scalar `seed` parameter is converted to a 2-tuple state", async (t) => {
  await t.step("seeded with a number", () => {
    const seed = 3247111518449632355n;
    const expectedState = [
      12286687917611493543n,
      9966339993921492669n,
    ] as const;
    const prng1 = new SeededPrng({ seed });
    assertEquals(prng1.state, expectedState);
    assertEquals(
      prng1.random(),
      new SeededPrng({ seed: expectedState }).random(),
    );
  });
});

Deno.test("SeededPrng#randomSeed() returns a new bigint seed", async (t) => {
  await t.step("returns a new seed", () => {
    const prng = new SeededPrng({ seed: 8440806997079658278n });
    const seed = prng.randomSeed();
    assertEquals(seed, 7310962475811222600n);
  });
});

Deno.test("SeededPrng#random() gives relatively uniform distribution of random numbers", async (t) => {
  const prng = new SeededPrng({ seed: 1n });
  const results = Array.from({ length: 1e4 }, prng.random);

  await t.step("all results are between 0 and 1", () => {
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

Deno.test("SeededPrng#random() generates same results as Python's numpy+randomgen implementation given the same state and inc", async () => {
  /**
   * Python code to generate the results.json file:
   *
   * ```py
   * import numpy as np
   * from randomgen import PCG32
   * import json
   *
   * path = './random/testdata/results.json'
   * seeds = json.load(open(path))
   *
   * def uint32_to_float64(rnd: int):
   *   return rnd / (2 ** 32)
   *
   * def rands(seed):
   *   bg = np.random.Generator(PCG32()).bit_generator
   *   bg.state = { **bg.state, 'state': { 'state': int(seed[0]), 'inc': int(seed[1]) } }
   *   return [uint32_to_float64(bg.random_raw()) for _ in range(10)]
   *
   * json.dump([[seed[0], seed[1], rands((int(seed[0]), int(seed[1])))] for seed in seeds], open(path, "w"), indent='\t')
   * ```
   */

  const seeds =
    (await import("./testdata/results.json", { with: { type: "json" } }))
      .default as [string, string, number[]][];

  for (const [state, inc, results] of seeds) {
    const prng = new SeededPrng({ seed: [state, inc].map(BigInt) as State });
    const actual = Array.from({ length: 10 }, prng.random);

    assertEquals(actual, results);
  }
});
