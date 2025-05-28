// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertEquals, assertNotEquals } from "@std/assert";
import { Pcg32 } from "./_pcg32.ts";
import { seedBytesFromUint64 } from "./_seed_bytes_from_uint64.ts";
import { nextFloat64 } from "./next_float_64.ts";
import { mockLittleEndian } from "./_test_utils.ts";
import { platform } from "./_platform.ts";

Deno.test("seedBytesFromUint64() generates seeds from bigints", async (t) => {
  await t.step("first 10 16-bit seeds are same as rand crate", async (t) => {
    /**
     * Expected results obtained by copying the Rust code from
     * https://github.com/rust-random/rand/blob/f7bbcca/rand_core/src/lib.rs#L359-L388
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
        const actual = Array.from(
          seedBytesFromUint64(BigInt(i), new Uint8Array(16)),
        );
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
          const actual = Array.from(
            seedBytesFromUint64(1n, new Uint8Array(i + 1)),
          );
          assertEquals(actual, slice);
        });
      }
    },
  );

  const U64_CEIL = 2n ** 64n;

  await t.step("wraps bigint input to u64", async (t) => {
    await t.step("exact multiple of U64_CEIL", () => {
      const expected = Array.from(
        seedBytesFromUint64(BigInt(0n), new Uint8Array(16)),
      );
      const actual = Array.from(
        seedBytesFromUint64(U64_CEIL * 99n, new Uint8Array(16)),
      );
      assertEquals(actual, expected);
    });

    await t.step("multiple of U64_CEIL + 1", () => {
      const expected = Array.from(seedBytesFromUint64(1n, new Uint8Array(16)));
      const actual = Array.from(
        seedBytesFromUint64(1n + U64_CEIL * 3n, new Uint8Array(16)),
      );
      assertEquals(actual, expected);
    });

    await t.step("multiple of U64_CEIL - 1", () => {
      const expected = Array.from(seedBytesFromUint64(-1n, new Uint8Array(16)));
      const actual = Array.from(
        seedBytesFromUint64(U64_CEIL - 1n, new Uint8Array(16)),
      );
      assertEquals(actual, expected);
    });

    await t.step("negative multiple of U64_CEIL", () => {
      const expected = Array.from(seedBytesFromUint64(0n, new Uint8Array(16)));
      const actual = Array.from(
        seedBytesFromUint64(U64_CEIL * -3n, new Uint8Array(16)),
      );
      assertEquals(actual, expected);
    });

    await t.step("negative multiple of U64_CEIL", () => {
      const expected = Array.from(seedBytesFromUint64(0n, new Uint8Array(16)));
      const actual = Array.from(
        seedBytesFromUint64(U64_CEIL * -3n, new Uint8Array(16)),
      );
      assertEquals(actual, expected);
    });
  });
});

Deno.test("nextUint32() generates random 32-bit integers", () => {
  /**
   * ```rs
   * use rand_pcg::rand_core::{RngCore, SeedableRng};
   * use rand_pcg::Lcg64Xsh32;
   *
   * let mut rng = Lcg64Xsh32::seed_from_u64(0);
   * for _ in 0..10 {
   *  println!("{},", rng.next_u32());
   * }
   * ```
   */
  const rustRandSamples = [
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

  const pcg = new Pcg32(0n);
  for (const sample of rustRandSamples) {
    assertEquals(pcg.nextUint32(), sample);
  }
});

Deno.test("getRandomValues() writes bytes", () => {
  const pcg = new Pcg32(0n);

  const a = new Uint8Array(10);
  const b = a.subarray(3, 8);
  const c = pcg.getRandomValues(b);

  assert(b === c);
  assertEquals(Array.from(b), [3, 217, 205, 17, 215]);
  assertEquals(Array.from(a), [0, 0, 0, 3, 217, 205, 17, 215, 0, 0]);
});

Deno.test("getRandomValues() gives correct results for multi-byte typed arrays in both endiannesses", async (t) => {
  for (
    const numberType of [
      "Int8",
      "Int16",
      "Int32",
      "BigInt64",
      "Uint8",
      "Uint16",
      "Uint32",
      "BigUint64",
    ] as const
  ) {
    await t.step(numberType, () => {
      const platformLittleEndian = platform.littleEndian;

      const length = 10;
      const TypedArray =
        globalThis[`${numberType}Array`] as BigInt64ArrayConstructor;
      const { BYTES_PER_ELEMENT } = TypedArray;

      const native = new Pcg32(0n).getRandomValues(new TypedArray(length));
      const u8 = new Pcg32(0n).getRandomValues(
        new Uint8Array(length * BYTES_PER_ELEMENT),
      );
      const dv = new DataView(u8.buffer);
      const fromDv = TypedArray.from({ length }, (_, i) => {
        return dv[`get${numberType}`](i * BYTES_PER_ELEMENT, true) as bigint;
      });

      assertEquals(native, fromDv);

      for (const littleEndian of [false, true]) {
        using _ = mockLittleEndian(littleEndian);
        const TypedArray =
          globalThis[`${numberType}Array`] as BigInt64ArrayConstructor;
        const mocked = new Pcg32(0n).getRandomValues(new TypedArray(length));

        assertEquals(mocked, native);
        if (BYTES_PER_ELEMENT > 1 && littleEndian !== platformLittleEndian) {
          assertNotEquals(u8, new Uint8Array(mocked.buffer));
        }
      }
    });
  }
});

Deno.test("nextFloat64() generates the same random numbers as rust rand crate", () => {
  /**
   * ```rs
   * use rand::prelude::*;
   * use rand_pcg::Lcg64Xsh32;
   * fn main() -> () {
   *   let mut rng = Lcg64Xsh32::seed_from_u64(0);
   *   for _ in 0..10 {
   *     let val: f64 = rng.random();
   *     println!("{val},");
   *   }
   * }
   * ```
   */
  const rustRandSamples = [
    0.986392965323652,
    0.24601264253217958,
    0.37644842389200484,
    0.6668384108033093,
    0.5500284577750535,
    0.027211583252904847,
    0.4610097964014602,
    0.24912787257622104,
    0.10493815385866834,
    0.4625920669083482,
  ];

  const pcg = new Pcg32(0n);
  for (const sample of rustRandSamples) {
    assertEquals(nextFloat64(pcg.getRandomValues.bind(pcg)), sample);
  }
});

Deno.test("getRandomValues() can be used to generate the same arbitrary numeric types as rust rand crate", async (t) => {
  await t.step("u8", () => {
    /**
     * ```rs
     * use rand::prelude::*;
     * use rand_pcg::Lcg64Xsh32;
     * fn main() -> () {
     *   let mut rng = Lcg64Xsh32::seed_from_u64(0);
     *   for _ in 0..10 {
     *     let val: u8 = rng.random();
     *     println!("{val},");
     *   }
     * }
     * ```
     */
    const rustRandSamples = [3, 215, 211, 62, 155, 133, 142, 14, 192, 62];

    const pcg = new Pcg32(0n);
    for (const sample of rustRandSamples) {
      const b = pcg.getRandomValues(new Uint8Array(1));
      assertEquals(b[0], sample);
    }
  });

  await t.step("i64", () => {
    /**
     * ```rs
     * use rand::prelude::*;
     * use rand_pcg::Lcg64Xsh32;
     * fn main() -> () {
     *   let mut rng = Lcg64Xsh32::seed_from_u64(0);
     *   for _ in 0..10 {
     *     let val: u64 = rng.random();
     *     println!("{val}n,");
     *   }
     * }
     * ```
     */
    const rustRandSamples = [
      -251005486276683517n,
      4538132255688111059n,
      6944247732487142299n,
      -6145746571101709170n,
      -8300509879875978816n,
      501965112106777777n,
      8504129729690683813n,
      4595598107041274030n,
      1935767267798412705n,
      8533317468786625891n,
    ];

    const pcg = new Pcg32(0n);
    for (const sample of rustRandSamples) {
      const b = pcg.getRandomValues(new Uint8Array(8));
      assertEquals(new DataView(b.buffer).getBigInt64(0, true), sample);
    }
  });
});
