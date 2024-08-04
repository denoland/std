// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { SeededPrng } from "./seeded.ts";
import {
  assertAlmostEquals,
  assertEquals,
  AssertionError,
  assertThrows,
} from "@std/assert";

Deno.test("SeededPrng#random() validates `seed` param", async (t) => {
  await t.step(
    "throws if constructor is called with an invalid value",
    async (t) => {
      await t.step("zero", () => {
        assertThrows(
          () => new SeededPrng(0),
          AssertionError,
          "Invalid seed value: 0. Must be a positive safe integer.",
        );
      });

      await t.step("negative", () => {
        assertThrows(
          () => new SeededPrng(-1),
          AssertionError,
          "Invalid seed value: -1. Must be a positive safe integer.",
        );
      });

      await t.step("too large", () => {
        assertThrows(
          () => new SeededPrng(Number.MAX_SAFE_INTEGER + 1),
          AssertionError,
          "Invalid seed value: 9007199254740992. Must be a positive safe integer.",
        );
      });

      await t.step("invalid 3-tuple", () => {
        assertThrows(
          () => new SeededPrng([1, 2, -1]),
          AssertionError,
          "Invalid seed value: -1. Must be a positive safe integer.",
        );
      });

      await t.step("incomplete 3-tuple", () => {
        const tuple = [1, 2];

        assertThrows(
          () => new SeededPrng(tuple as [number, number, number]),
          AssertionError,
          "Invalid seed value: undefined. Must be a positive safe integer.",
        );
      });
    },
  );

  await t.step("throws if seed is set to an invalid value", () => {
    const prng = new SeededPrng(1);

    assertThrows(
      () => prng.seed = 1.5,
      AssertionError,
      "Invalid seed value: 1.5. Must be a positive safe integer.",
    );
  });

  await t.step("throws if seed is set to an invalid value", () => {
    const prng = new SeededPrng(1);

    assertThrows(
      () => prng.seed = [1.5, 2.5, 3.5],
      AssertionError,
      "Invalid seed value: 1.5. Must be a positive safe integer.",
    );
  });

  await t.step("throws if seed is not a positive safe integer", () => {
    const prng = new SeededPrng(1);

    assertThrows(
      () => prng.seed = [1.5, 2.5, 3.5],
      AssertionError,
      "Invalid seed value: 1.5. Must be a positive safe integer.",
    );
  });
});

Deno.test("SeededPrng#random() generates random numbers", async (t) => {
  await t.step("seeded with a 3-tuple", () => {
    const prng = new SeededPrng([17740, 29216, 6029]);
    assertEquals(prng.random(), 0.8280769879176713);
    assertEquals(prng.random(), 0.6090445210936662);
    assertEquals(prng.random(), 0.10273315291976637);
  });

  await t.step("seeded with a number", () => {
    const prng = new SeededPrng(1722685125224);
    assertEquals(prng.random(), 0.8603823920023603);
    assertEquals(prng.random(), 0.29120972350650653);
    assertEquals(prng.random(), 0.008982246237530855);
  });
});

Deno.test("SeededPrng's `seed` parameter is converted to a 3-tuple when set with a number", async (t) => {
  await t.step("seeded with a number", () => {
    const scalarSeed = 1722685125224;
    const expectedSeed = [5488, 15596, 5056] as const;
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
