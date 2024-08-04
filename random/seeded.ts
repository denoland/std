// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { randomIntegerBetween } from "./between.ts";
import { assert } from "@std/assert/assert";

/**
 * A 3-tuple seed for a {@linkcode SeededPrng}.
 */
export type Seed = readonly [number, number, number];

const A = 30269;
const B = 30307;
const C = 30323;

/**
 * A seeded pseudo-random number generator, implementing the
 * {@link https://en.wikipedia.org/wiki/Wichmann–Hill | Wichmann-Hill}
 * algorithm.
 *
 * @example Usage
 * ```ts
 * import { SeededPrng } from "@std/random";
 * import { assertEquals } from "@std/assert";
 *
 * const prng = new SeededPrng([17740, 29216, 6029]);
 *
 * assertEquals(prng.random(), 0.8280769879176713);
 * assertEquals(prng.random(), 0.6090445210936662);
 * assertEquals(prng.random(), 0.10273315291976637);
 * ```
 */
export class SeededPrng {
  // @ts-expect-error assigned in constructor via `seed` setter
  #x: number;
  // @ts-expect-error assigned in constructor via `seed` setter
  #y: number;
  // @ts-expect-error assigned in constructor via `seed` setter
  #z: number;

  /**
   * Constructs a new instance.
   *
   * @param seed - The seed for the random number generator, which can be
   * either a 3-tuple of positive integers or a single positive integer, which
   * will be converted to a 3-tuple.
   *
   * @example Usage
   * ```ts no-assert
   * import { SeededPrng } from "@std/random";
   * const prng = new SeededPrng([5489, 15597, 5057]);
   * ```
   */
  constructor(seed: Seed | number) {
    this.seed = seed;

    // For convenience, allowing destructuring and direct usage in callbacks
    // equivalently to Math.random()
    this.random = this.random.bind(this);
  }

  /**
   * The seed for the random number generator.
   * @returns The seed as a 3-tuple.
   *
   * @example Usage
   * ```ts
   * import { SeededPrng } from "@std/random";
   * import { assertEquals } from "@std/assert";
   *
   * const prng = new SeededPrng(1722685125225);
   * assertEquals(prng.seed, [5489, 15597, 5057]);
   * ```
   */
  get seed(): Seed {
    return [
      this.#x,
      this.#y,
      this.#z,
    ];
  }

  set seed(seed: Seed | number) {
    const [x, y, z] = this.#normalizeSeed(seed);
    this.#x = x;
    this.#y = y;
    this.#z = z;
  }

  /**
   * Generates a random number using the current state of the prng.
   * @returns A random number between 0 and 1
   *
   * @example Usage
   * ```ts
   * import { SeededPrng } from "@std/random";
   * import { assertEquals } from "@std/assert";
   *
   * const prng = new SeededPrng([5489, 15597, 5057]);
   *
   * assertEquals(prng.random(), 0.8773132982020172);
   * assertEquals(prng.random(), 0.18646363474450567);
   * assertEquals(prng.random(), 0.12047326745398279);
   * ```
   */
  random(): number {
    // https://en.wikipedia.org/wiki/Wichmann–Hill#Implementation
    this.#x = (this.#x * 171) % A;
    this.#y = (this.#y * 172) % B;
    this.#z = (this.#z * 170) % C;

    return (this.#x / A + this.#y / B + this.#z / C) % 1;
  }

  /**
   * Generates a new seed from the current prng that can be used to create a new prng.
   * @returns The new seed
   *
   * @example Usage
   * ```ts no-assert
   * import { SeededPrng } from "@std/random";
   * import { assertEquals } from "@std/assert";
   *
   * const prng = new SeededPrng([5489, 15597, 5057]);
   * assertEquals(prng.randomSeed(), [26556, 5652, 3654]);
   * ```
   */
  randomSeed(): Seed {
    const { random } = this;

    return [
      randomIntegerBetween(1, A, { random }),
      randomIntegerBetween(1, B, { random }),
      randomIntegerBetween(1, C, { random }),
    ];
  }

  #normalizeSeed(seed: Seed | number): Seed {
    this.#assertValidSeed(seed);

    const s: Seed = typeof seed === "number" ? [seed, seed, seed] : seed;

    return [
      (s[0] - 1) % (A - 1) + 1,
      (s[1] - 1) % (B - 1) + 1,
      (s[2] - 1) % (C - 1) + 1,
    ];
  }

  #assertValidSeed(seed: Seed | number) {
    const toCheck = typeof seed === "number"
      ? [seed]
      : [seed[0], seed[1], seed[2]];

    for (const x of toCheck) {
      assert(
        Number.isSafeInteger(x) && x >= 1,
        `Invalid seed value: ${x}. Must be a positive safe integer.`,
      );
    }
  }
}
