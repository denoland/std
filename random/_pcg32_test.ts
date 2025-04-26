// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { Pcg32 } from "./_pcg32.ts";
import { nextFloat64 } from "./number_types.ts";

Deno.test("nextU32() generates random 32-bit integers", () => {
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

  const pgc = Pcg32.seedFromUint64(0n);
  for (const sample of rustRandSamples) {
    assertEquals(pgc.nextUint32(), sample);
  }
});

Deno.test("writeBytes() writes bytes", () => {
  const pgc = Pcg32.seedFromUint64(0n);

  const a = new Uint8Array(10);
  const b = a.subarray(3, 8);
  const c = pgc.getRandomValues(b);

  assert(b === c);
  assertEquals(Array.from(b), [3, 217, 205, 17, 215]);
  assertEquals(Array.from(a), [0, 0, 0, 3, 217, 205, 17, 215, 0, 0]);
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

  const pgc = Pcg32.seedFromUint64(0n);
  for (const sample of rustRandSamples) {
    assertEquals(nextFloat64(pgc.getRandomValues.bind(pgc)), sample);
  }
});

Deno.test("writeBytes() can be used to generate the same arbitrary numeric types as rust rand crate", async (t) => {
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

    const pgc = Pcg32.seedFromUint64(0n);
    for (const sample of rustRandSamples) {
      const b = pgc.getRandomValues(new Uint8Array(1));
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

    const pgc = Pcg32.seedFromUint64(0n);
    for (const sample of rustRandSamples) {
      const b = pgc.getRandomValues(new Uint8Array(8));
      assertEquals(new DataView(b.buffer).getBigInt64(0, true), sample);
    }
  });
});
