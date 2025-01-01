// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "../assert/equals.ts";
import { fromSeed, nextU32, seedFromU64 } from "./_pcg32.ts";

Deno.test("seedFromU64() generates seeds from bigints", async (t) => {
  await t.step("first 10 16-bit seeds are same as rand crate", async (t) => {
    /**
     * Expected results obtained by copying the Rust code from
     * https://github.com/rust-random/rand/blob/f7bbccaedf6c63b02855b90b003c9b1a4d1fd1cb/rand_core/src/lib.rs#L359-L388
     * but directly returning `seed` instead of `Self::from_seed(seed)`
     */
    // deno-fmt-ignore
    const expectedResults = [
      [236, 242, 115, 249, 129, 181, 205, 69, 135, 240, 70, 115, 6, 173, 108, 173],
      [234, 216, 29, 114, 93, 38, 16, 78, 137, 156, 59, 248, 66, 206, 120, 46],
      [77, 209, 16, 204, 177, 124, 55, 30, 237, 239, 68, 142, 238, 125, 215, 7],
      [108, 90, 247, 27, 160, 186, 6, 71, 76, 124, 221, 142, 87, 133, 92, 175],
      [197, 166, 196, 87, 44, 68, 69, 62, 55, 32, 34, 218, 130, 107, 171, 170],
      [60, 64, 172, 11, 74, 188, 224, 128, 161, 112, 220, 75, 85, 212, 145, 251],
      [177, 93, 150, 16, 48, 3, 23, 51, 155, 104, 76, 121, 82, 134, 239, 107],
      [200, 12, 64, 59, 208, 32, 108, 9, 55, 166, 59, 111, 242, 79, 37, 30],
      [222, 11, 88, 159, 202, 89, 63, 215, 36, 57, 0, 156, 63, 131, 114, 90],
      [21, 119, 90, 241, 241, 191, 180, 229, 150, 199, 126, 251, 25, 141, 7, 4],
    ];

    for (const [i, expected] of expectedResults.entries()) {
      await t.step(`With seed ${i}n`, () => {
        const actual = Array.from(seedFromU64(BigInt(i), 16));
        assertEquals(actual, expected);
      });
    }
  });

  await t.step(
    "generates arbitrary-length seed data from a single bigint",
    async (t) => {
      // deno-fmt-ignore
      const expectedBytes = [234, 216, 29, 114, 93, 38, 16, 78, 137, 156, 59, 248, 66, 206, 120, 46, 186];

      for (const i of expectedBytes.keys()) {
        const slice = expectedBytes.slice(0, i + 1);

        await t.step(`With length ${i + 1}`, () => {
          const actual = Array.from(seedFromU64(1n, i + 1));
          assertEquals(actual, slice);
        });
      }
    },
  );

  const U64_CEIL = 2n ** 64n;

  await t.step("wraps bigint input to u64", async (t) => {
    await t.step("exact multiple of U64_CEIL", () => {
      const expected = Array.from(seedFromU64(BigInt(0n), 16));
      const actual = Array.from(seedFromU64(U64_CEIL * 99n, 16));
      assertEquals(actual, expected);
    });

    await t.step("multiple of U64_CEIL + 1", () => {
      const expected = Array.from(seedFromU64(1n, 16));
      const actual = Array.from(seedFromU64(1n + U64_CEIL * 3n, 16));
      assertEquals(actual, expected);
    });

    await t.step("multiple of U64_CEIL - 1", () => {
      const expected = Array.from(seedFromU64(-1n, 16));
      const actual = Array.from(seedFromU64(U64_CEIL - 1n, 16));
      assertEquals(actual, expected);
    });

    await t.step("negative multiple of U64_CEIL", () => {
      const expected = Array.from(seedFromU64(0n, 16));
      const actual = Array.from(seedFromU64(U64_CEIL * -3n, 16));
      assertEquals(actual, expected);
    });

    await t.step("negative multiple of U64_CEIL", () => {
      const expected = Array.from(seedFromU64(0n, 16));
      const actual = Array.from(seedFromU64(U64_CEIL * -3n, 16));
      assertEquals(actual, expected);
    });
  });
});

Deno.test("nextU32() generates random 32-bit integers", async (t) => {
  /**
   * Expected results obtained from the Rust `rand` crate as follows:
   * ```rs
   * use rand_pcg::rand_core::{RngCore, SeedableRng};
   * use rand_pcg::Lcg64Xsh32;
   *
   * let mut rng = Lcg64Xsh32::seed_from_u64(0);
   * for _ in 0..10 {
   *  println!("{}", rng.next_u32());
   * }
   * ```
   */
  const expectedResults = [
    298703107,
    4236525527,
    336081875,
    1056616254,
    1060453275,
    1616833669,
    501767310,
    2864049166,
    56572352,
    2362354238,
  ];

  const pgc = fromSeed(seedFromU64(0n, 16));
  const next = () => nextU32(pgc);

  for (const [i, expected] of expectedResults.entries()) {
    await t.step(`#${i + 1} generated uint32`, () => {
      const actual = next();
      assertEquals(actual, expected);
    });
  }
});
