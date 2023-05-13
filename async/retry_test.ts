// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { backoff, retry } from "./retry.ts";
import { assertEquals, assertRejects } from "../testing/asserts.ts";

function generateErroringFunction(errorsBeforeSucceeds: number) {
  let errorCount = 0;

  return () => {
    if (errorCount >= errorsBeforeSucceeds) {
      return errorCount;
    }
    errorCount++;
    throw `Only errored ${errorCount} times`;
  };
}

Deno.test("[async] retry", async function () {
  const threeErrors = generateErroringFunction(3);
  const result = await retry(threeErrors, {
    minTimeout: 100,
  });
  assertEquals(result, 3);
});

Deno.test("[async] retry fails after max errors is passed", async function () {
  const fiveErrors = generateErroringFunction(5);
  await assertRejects(() =>
    retry(fiveErrors, {
      minTimeout: 100,
    })
  );
});

Deno.test(
  "[async] retry throws if minTimeout is less than maxTimeout",
  async function () {
    await assertRejects(() =>
      retry(() => {}, {
        minTimeout: 1000,
        maxTimeout: 100,
      })
    );
  },
);

Deno.test(
  "[async] retry does not throw if maxTimeout is -1",
  async function () {
    await retry(() => {}, {
      minTimeout: 1000,
      maxTimeout: -1,
    });
  },
);

Deno.test("[async] retry with backoffFn option", async (t) => {
  for (const [name, backoffFn] of Object.entries(backoff)) {
    await t.step(name, async (t) => {
      await t.step("succeeds after retrying", async () => {
        const result = await retry(generateErroringFunction(3), {
          minTimeout: 1,
          backoffFn,
        });
        assertEquals(result, 3);
      });

      await t.step("fails after max errors passed", async () => {
        await assertRejects(() =>
          retry(generateErroringFunction(5), { minTimeout: 1, backoffFn })
        );
      });
    });
  }
});

// test util to ensure deterministic results during testing of backoff functions by polyfilling Math.random
function prngMulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0);
  };
}

// random seed generated with crypto.getRandomValues(new Uint32Array(1))[0]
const INITIAL_SEED = 3460544849;

const firstTenExpectedTimings: Record<
  keyof typeof backoff,
  {
    results: readonly (readonly number[] & { length: 10 })[] & { length: 10 };
    total: number;
  }
> = {
  none: {
    results: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ] as const,
    total: 0,
  },
  exponential: {
    results: [
      [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
      [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
      [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
      [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
      [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
      [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
      [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
      [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
      [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
      [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200],
    ] as const,
    total: 1_023_000,
  },
  fullJitter: {
    results: [
      [69, 83, 56, 791, 131, 2140, 5480, 7706, 6036, 17908],
      [54, 16, 23, 381, 145, 2717, 3195, 4374, 3149, 21390],
      [32, 183, 334, 155, 391, 2954, 2890, 8202, 25202, 38387],
      [54, 89, 26, 174, 741, 1245, 1021, 12191, 19834, 17559],
      [74, 71, 113, 43, 496, 3196, 3843, 7860, 8943, 44312],
      [20, 129, 52, 555, 857, 3072, 3955, 7078, 5640, 1339],
      [75, 154, 59, 302, 998, 851, 5034, 8401, 23920, 41925],
      [86, 26, 211, 491, 139, 2263, 4502, 10713, 15976, 32328],
      [35, 10, 18, 449, 774, 698, 743, 8833, 24537, 7446],
      [11, 122, 178, 132, 573, 1803, 5107, 4505, 11523, 17598],
    ] as const,
    total: 532_705,
  },
  equalJitter: {
    results: [
      [85, 142, 228, 796, 865, 2670, 5940, 10253, 15818, 34554],
      [77, 108, 211, 591, 872, 2959, 4797, 8587, 14375, 36295],
      [66, 192, 367, 478, 996, 3077, 4645, 10501, 25401, 44794],
      [77, 145, 213, 487, 1170, 2223, 3711, 12495, 22717, 34380],
      [87, 136, 257, 421, 1048, 3198, 5122, 10330, 17272, 47756],
      [60, 164, 226, 677, 1228, 3136, 5177, 9939, 15620, 26270],
      [88, 177, 229, 551, 1299, 2026, 5717, 10600, 24760, 46562],
      [93, 113, 305, 646, 870, 2732, 5451, 11756, 20788, 41764],
      [67, 105, 209, 625, 1187, 1949, 3571, 10816, 25069, 29323],
      [55, 161, 289, 466, 1087, 2501, 5753, 8652, 18561, 34399],
    ] as const,
    total: 777_854,
  },
  decorrelatedJitter: {
    results: [
      [238, 356, 235, 697, 263, 560, 1453, 2664, 1961, 2122],
      [209, 143, 119, 222, 151, 400, 650, 732, 358, 507],
      [164, 460, 1169, 760, 633, 1761, 2441, 4728, 13966, 31438],
      [208, 334, 159, 182, 307, 419, 285, 819, 1925, 2046],
      [248, 329, 352, 151, 210, 628, 1171, 2196, 2367, 6158],
      [140, 307, 207, 461, 787, 2270, 4246, 7088, 4763, 471],
      [251, 603, 351, 460, 899, 791, 1888, 3751, 10522, 25867],
      [272, 193, 353, 688, 271, 604, 1305, 3292, 6200, 11782],
      [169, 121, 112, 232, 389, 333, 204, 454, 1309, 657],
      [121, 261, 404, 284, 370, 668, 1620, 1775, 2452, 2594],
    ] as const,
    total: 197_666,
  },
};

Deno.test("[async] retry - backoff function timings", async (t) => {
  const originalMathRandom = Math.random;

  for (const [name, fn] of Object.entries(backoff)) {
    await t.step(name, () => {
      let nextSeed = INITIAL_SEED;

      const expectedTimingData =
        firstTenExpectedTimings[name as keyof typeof backoff];

      let total = 0;

      for (const row of expectedTimingData.results) {
        const randUint32 = prngMulberry32(nextSeed);
        nextSeed = prngMulberry32(nextSeed)();
        Math.random = () => randUint32() / 0x100000000;

        const results: number[] = [];
        const base = 100;
        const cap = Infinity;
        let prev = base;

        for (let i = 0; i < 10; ++i) {
          const result = fn(cap, base, i, 2, prev);
          prev = result;
          total += Math.round(result);
          results.push(Math.round(result));
        }

        assertEquals(results as unknown, row);
      }

      assertEquals(total, expectedTimingData.total);
    });
  }

  Math.random = originalMathRandom;
});
