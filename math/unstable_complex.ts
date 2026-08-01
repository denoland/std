// Copyright 2018-2026 the Deno authors. MIT license.

// This library is in compliance with ISO/IEC 9899:2024 (en)

import { simpleSpecialValues } from "./unstable_complex_values.ts";

function isInfinite(num: number): boolean {
  return num === Infinity || num === -Infinity;
}

function isPositiveSigned(num: number): boolean {
  return Object.is(num, 0) || 0 < num;
}

function isNegativeSigned(num: number): boolean {
  return Object.is(num, -0) || num < 0;
}

function strictEqualsComplex(z0: Complex, z1: Complex): boolean {
  return Object.is(z0.real, z1.real) && Object.is(z0.imag, z1.imag);
}

/**
 * A class representing a complex number. Also contains utility functions for complex numbers.
 *
 * @example Usage
 * ```ts
 * import { Complex } from "@std/math/unstable-complex";
 *
 * let z0 = new Complex(1, 2); // Represents 1 + 2i
 * let z1 = new Complex(-3) // Represents -3 + 0i = 3
 * ```
 *
 * @property {number} real The real part of this complex number.
 * @property {number} imag The imaginary part of this complex number.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export class Complex {
  /**
   * The real part of this complex number.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  real: number;
  /**
   * The imaginary part of this complex number.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  imag: number;

  /**
   * Creates a new instance of a Complex.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  constructor(real: number, imag?: number) {
    this.real = real;
    this.imag = imag ?? 0;
  }

  /**
   * Zero as a complex number.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  static zero = new Complex(0);
  /**
   * i, the imaginary unit.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  static i = new Complex(0, 1);
  /**
   * -i, the negative of the imaginary unit
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  static negI = new Complex(0, -1);
  /**
   * One as a complex number
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  static one = new Complex(1);
  /**
   * Negative one as a complex number
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  static negOne = new Complex(-1);
  /**
   * NaN as a complex number
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  // deno-lint-ignore deno-style-guide/naming-convention
  static NaN = new Complex(NaN, NaN);
  /**
   * The complex infinity
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  // deno-lint-ignore deno-style-guide/naming-convention
  static Infinity = new Complex(Infinity);

  /**
   * Checks whether a complex number is real, meaning its imaginary part is equal to zero.
   *
   * @param {number} tolerance? The maximum amount the imaginary part is allowed to differ from zero. Defaults to zero.
   *
   * @returns {boolean} Whether this is real, given a tolerance.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assert, assertFalse } from "@std/assert";
   *
   * assert(new Complex(4, 0).isReal());
   * assertFalse(new Complex(0, 4).isReal());
   * assertFalse(new Complex(1e-15, 4).isReal(1e-16));
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  isReal(tolerance?: number): boolean {
    return Math.abs(this.imag) <= (tolerance ?? 0) &&
      Number.isFinite(this.real);
  }

  /**
   * Checks whether a complex number is imaginary, meaning its real part is equal to zero.
   *
   * @param {number} tolerance? The maximum amount the real part is allowed to differ from zero. Defaults to zero.
   *
   * @returns {boolean} Whether this is imaginary, given a tolerance.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assert, assertFalse } from "@std/assert";
   *
   * assert(new Complex(0, 4).isImaginary());
   * assertFalse(new Complex(4, 0).isImaginary());
   * assertFalse(new Complex(4, 1e-16).isImaginary(1e-15));
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  isImaginary(tolerance?: number): boolean {
    return Math.abs(this.real) <= (tolerance ?? 0) &&
      Number.isFinite(this.imag);
  }

  /**
   * Checks whether this is equal to zero.
   *
   * @param {number} tolerance? The maximum distance this is allowed to have from zero on the complex plane.
   *
   * @returns {boolean} Whether this is equal to zero, given a tolerance.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assert, assertFalse } from "@std/assert";
   *
   * assert(new Complex(0, 0).isZero());
   * assert(new Complex(1e-16, 1.4e-15).isZero(1e-14));
   * assertFalse(new Complex(0, 4).isZero());
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  isZero(tolerance?: number): boolean {
    return this.abs() <= (tolerance ?? 0);
  }

  /**
   * Checks whether a complex number is finite.
   *
   * @returns {boolean} Whether this is finite.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assert, assertFalse } from "@std/assert";
   *
   * assert(new Complex(5, 3).isFinite());
   * assertFalse(new Complex(Infinity, 3).isFinite());
   * assertFalse(new Complex(0, -Infinity).isFinite());
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  isFinite(): boolean {
    return Number.isFinite(this.real) && Number.isFinite(this.imag);
  }

  /**
   * Checks whether a complex number is infinite.
   *
   * @returns {boolean} Whether this is infinite.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assert, assertFalse } from "@std/assert";
   *
   * assert(new Complex(Infinity, 3).isInfinite());
   * assert(new Complex(0, -Infinity).isInfinite());
   * assertFalse(new Complex(5, 3).isInfinite());
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  isInfinite(): boolean {
    return isInfinite(this.real) && isInfinite(this.imag);
  }

  /**
   * Checks whether a complex number is NaN.
   *
   * @returns {boolean} Whether this complex number is NaN.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assert, assertFalse } from "@std/assert";
   *
   * assert(new Complex(NaN, 3).isNaN());
   * assertFalse(new Complex(0, -Infinity).isNaN());
   * assertFalse(new Complex(NaN, Infinity).isNaN());
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  isNaN(): boolean {
    return !this.isInfinite() &&
      (Number.isNaN(this.real) || Number.isNaN(this.imag));
  }

  /**
   * Checks whether two complex numbers are equal.
   *
   * @param {Complex | number} num A complex number.
   * @param {number} tolerance? The maximum distance the supplied complex numbers are allowed to have on the complex plane. Defaults to zero.
   *
   * @returns {Complex} Whether the supplied complex numbers are equal, given a tolerance.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assert, assertFalse } from "@std/assert";
   *
   * assert(new Complex(0, 3).equals(new Complex(0, 3)));
   * assert(new Complex(4, 3).equals(new Complex(4, 3 - 1e-16), 1e-15));
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  equals(num: Complex | number, tolerance?: number): boolean {
    if (typeof num === "number") num = new Complex(num);

    // If both numbers are finite, check whether their cartesian distance is below the tolerance
    if (this.isFinite() && num.isFinite()) {
      return this.sub(num).abs() <= (tolerance ?? 0);
    }

    const isRealEqual =
      // If both real parts are finite, check whether the difference is below the tolerance
      (Number.isFinite(this.real) && Number.isFinite(num.real) &&
        Math.abs(this.real - num.real) <= (tolerance ?? 0)) ||
      // If both real parts are NaN
      (Number.isNaN(this.real) && Number.isNaN(num.real)) ||
      // If both real parts are the same type of infinity
      this.real === num.real;

    const isImagEqual =
      // If both imaginary parts are finite, check whether the difference is below the tolerance
      (Number.isFinite(this.imag) && Number.isFinite(num.imag) &&
        Math.abs(this.imag - num.imag) <= (tolerance ?? 0)) ||
      // If both imaginary parts are NaN
      (Number.isNaN(this.imag) && Number.isNaN(num.imag)) ||
      // If both imaginary parts are the same type of infinity
      this.imag === num.imag;

    return isRealEqual && isImagEqual;
  }

  /**
   * Adds complex numbers.
   *
   * @param {Complex | number} num A complex number.
   *
   * @returns {Complex} The sum of this and the supplied complex numbers.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertEquals } from "@std/assert";
   *
   * assertEquals(new Complex(0, 3).add(new Complex(5, 2)), new Complex(5, 5));
   * assertEquals(new Complex(4, 3).add(new Complex(-2, 4)), new Complex(2, 7));
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  add(num: Complex | number): Complex {
    return typeof num === "number"
      ? new Complex(this.real + num, this.imag)
      : new Complex(this.real + num.real, this.imag + num.imag);
  }

  /**
   * Negates complex numbers.
   *
   * @returns {Complex} The negative of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertEquals } from "@std/assert";
   *
   * assertEquals(new Complex(0, 3).neg(), new Complex(0, -3));
   * assertEquals(new Complex(4, -3).neg(), new Complex(-4, 3));
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  neg(): Complex {
    return new Complex(-this.real, -this.imag);
  }

  /**
   * Returns the difference of two complex numbers.
   *
   * @param {Complex} num A complex number.
   *
   * @returns {Complex} The difference of this and the supplied complex number.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertEquals } from "@std/assert";
   *
   * assertEquals(new Complex(0, 3).sub(new Complex(5, 2)), new Complex(-5, 1));
   * assertEquals(new Complex(4, 3).sub(new Complex(-2, 4)), new Complex(6, -1));
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  sub(num: Complex | number): Complex {
    return typeof num === "number"
      ? new Complex(this.real - num, this.imag)
      : new Complex(this.real - num.real, this.imag - num.imag);
  }

  /**
   * Multiplies complex numbers.
   *
   * @param {Complex | number} num A complex number.
   *
   * @returns {Complex} The product of this and the supplied complex number.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertEquals } from "@std/assert";
   *
   * assertEquals(new Complex(1, 3).mul(new Complex(5, 2)), new Complex(-1, 17));
   * assertEquals(new Complex(4, 3).mul(new Complex(-2, 4)), new Complex(-20, 10));
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  mul(num: Complex | number): Complex {
    return typeof num === "number"
      ? new Complex(this.real * num, this.imag * num)
      : new Complex(
        this.real * num.real - this.imag * num.imag,
        this.real * num.imag + this.imag * num.real,
      );
  }

  /**
   * Divides complex numbers.
   *
   * @param {Complex} num A complex number.
   *
   * @returns {Complex} The ratio of this and the supplied complex number.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertEquals } from "@std/assert";
   *
   * assertEquals(new Complex(-1, 17).div(new Complex(5, 2)), new Complex(1, 3));
   * assertEquals(new Complex(-20, 10).div(new Complex(-2, 4)), new Complex(4, 3));
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  div(num: Complex | number): Complex {
    if (num instanceof Complex && num.isReal()) num = num.real;

    if (typeof num === "number") {
      return new Complex(this.real / num, this.imag / num);
    } else {
      const absSquaredNum = num.absSquared();

      return new Complex(
        (this.real * num.real + this.imag * num.imag) / absSquaredNum,
        (this.imag * num.real - this.real * num.imag) / absSquaredNum,
      );
    }
  }

  /**
   * Takes the reciprocal of a complex number.
   *
   * @returns {Complex} The reciprocal of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertEquals } from "@std/assert";
   *
   * assertEquals(new Complex(0, 3).recip(), new Complex(0, -1 / 3));
   * assertEquals(new Complex(4, -3).recip(), new Complex(.16, .12));
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  recip(): Complex {
    if (this.isInfinite()) return Complex.zero;

    const absSquaredThis = this.absSquared();

    return new Complex(
      this.real / absSquaredThis,
      -this.imag / absSquaredThis,
    );
  }

  /**
   * Returns the square of the absolute value of a complex number.
   *
   * @returns {Complex} The square of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertEquals } from "@std/assert";
   *
   * assertEquals(new Complex(0, 3).absSquared(), 9);
   * assertEquals(new Complex(4, -3).absSquared(), 25);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  absSquared(): number {
    return this.real * this.real + this.imag * this.imag;
  }

  /**
   * Takes the absolute value of a complex number.
   *
   * @returns {Complex} The absolute value of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertEquals } from "@std/assert";
   *
   * assertEquals(new Complex(0, 3).abs(), 3);
   * assertEquals(new Complex(4, -3).abs(), 5);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  abs(): number {
    return Math.hypot(this.real, this.imag);
  }

  /**
   * Takes the argument of a complex number on a range from (-pi, pi], (exclusive negative pi to inclusive positive pi).
   *
   * @returns {Complex} The square of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * assertAlmostEquals(new Complex(0, 3).arg(), Math.PI / 2);
   * assertAlmostEquals(new Complex(4, -3).arg(), -0.6435011088);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  arg(): number {
    return Math.atan2(this.imag, this.real);
  }

  /**
   * Takes the conjugate of a complex number.
   *
   * @returns {Complex} The conjugate of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertEquals } from "@std/assert";
   *
   * assertEquals(new Complex(0, 3).conj(), new Complex(0, -3));
   * assertEquals(new Complex(4, -3).conj(), new Complex(4, 3));
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  conj(): Complex {
    return new Complex(this.real, -this.imag);
  }

  /**
   * Takes the square root of a complex number.
   *
   * @returns {Complex} The square root of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertEquals } from "@std/assert";
   *
   * assertEquals(new Complex(-9).sqrt(), new Complex(0, 3));
   * assertEquals(new Complex(7, -24).sqrt(), new Complex(4, -3));
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  sqrt(): Complex {
    if (this.isReal() && 0 <= this.real) {
      return new Complex(Math.sqrt(this.real));
    }
    if (this.isReal()) {
      return new Complex(0, Math.sqrt(-this.real));
    }

    const absThis = this.abs();

    return new Complex(
      Math.sqrt((absThis + this.real) / 2),
      (this.imag < 0 ? -1 : 1) * Math.sqrt((absThis - this.real) / 2),
    );
  }

  /**
   * Takes the cube root of a complex number.
   *
   * @returns {Complex} The cube root of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals, assertEquals } from "@std/assert";
   *
   * const cbrtNeg27I = new Complex(0, -27).cbrt();
   * assertAlmostEquals(cbrtNeg27I.real, Math.sqrt(27) / 2);
   * assertAlmostEquals(cbrtNeg27I.imag, -1.5);
   * assertEquals(new Complex(-44, -117).cbrt(), new Complex(4, -3));
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  cbrt(): Complex {
    if (this.isReal()) return new Complex(Math.cbrt(this.real));
    if (this.isInfinite()) return Complex.Infinity;

    const argCbrtThis = this.arg() / 3;
    const absCbrt = Math.cbrt(this.abs());

    return new Complex(
      absCbrt * Math.cos(argCbrtThis),
      absCbrt * Math.sin(argCbrtThis),
    );
  }

  /**
   * Takes the natural logarithm of a complex number.
   *
   * @returns {Complex} The natural logarithm of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const lnNegOne = new Complex(-1).log();
   * assertAlmostEquals(lnNegOne.real, 0);
   * assertAlmostEquals(lnNegOne.imag, Math.PI);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  log(): Complex {
    return this.isZero()
      ? Complex.NaN
      : new Complex(Math.log(this.absSquared()) / 2, this.arg());
  }

  /**
   * Takes the base-10 logarithm of a complex number.
   *
   * @returns {Complex} The base-10 logarithm of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z = new Complex(2, 3).log10();
   * assertAlmostEquals(z.real, .55697168);
   * assertAlmostEquals(z.imag, .42682189);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  log10(): Complex {
    return this.log().div(Math.LN10);
  }

  /**
   * Takes the base-n logarithm of a complex number.
   *
   * @returns {Complex} The base-n logarithm of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z = new Complex(4, -2).logn(6);
   * assertAlmostEquals(z.real, .83597501);
   * assertAlmostEquals(z.imag, -.25876666);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  logn(n: number): Complex {
    return this.log().div(Math.log(n));
  }

  /**
   * Raises e (Euler's number) to the power of a complex number.
   *
   * @returns {Complex} E (Euler's number) raised to the power of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const eToTheIPi = new Complex(0, Math.PI).exp();
   * assertAlmostEquals(eToTheIPi.real, -1);
   * assertAlmostEquals(eToTheIPi.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  exp(): Complex {
    if (isNegativeSigned(this.imag)) return this.conj().exp().conj();

    for (
      const [[realInput, imagInput], [realOutput, imagOutput]]
        of simpleSpecialValues.exp
    ) {
      if (
        strictEqualsComplex(this, new Complex(realInput, imagInput))
      ) return new Complex(realOutput, imagOutput);
    }

    return Number.isFinite(this.real) && this.imag === Infinity
      ? Complex.NaN
      : Number.isFinite(this.real) && Number.isNaN(this.imag)
      ? Complex.NaN
      : this.real === -Infinity && Number.isFinite(this.imag)
      ? Complex.cis(this.imag).mul(0)
      : this.real === Infinity && Number.isFinite(this.imag)
      ? Complex.cis(this.imag).mul(Infinity)
      : Number.isNaN(this.real) && this.imag !== 0
      ? Complex.NaN
      : (() => {
        const expReal = Math.exp(this.real);

        return new Complex(
          expReal * Math.cos(this.imag),
          expReal * Math.sin(this.imag),
        );
      })();
  }

  static cis(arg: number): Complex {
    return new Complex(Math.cos(arg), Math.sin(arg));
  }

  /**
   * Raises a complex number to the power of another (complex) number.
   *
   * @param {Complex | number} w A (complex) number.
   *
   * @returns {Complex} This to the power of the supplied number.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const x = new Complex(1, 2);
   * const y = new Complex(3, 4);
   * const z = x.pow(y);
   * assertAlmostEquals(z.real, .12900959);
   * assertAlmostEquals(z.imag, .03392409);
   * ```
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  pow(w: Complex | number): Complex {
    if (w instanceof Complex && w.imag === 0) w = w.real;

    if (typeof w === "number" && Number.isInteger(w)) {
      // If w is an integer, use exponentiation by squaring.
      return w === 0
        ? new Complex(1, 0)
        : w === 1
        ? this
        : w === -1
        ? this.recip()
        : w < 0
        ? this.pow(-w).recip()
        : w % 2 === 0
        ? this.mul(this).pow(w / 2)
        : this.mul(this.mul(this).pow((w - 1) / 2));
    } else if (typeof w === "number") {
      // If w is a real number, use De Moivre's formula.
      const argThisw = this.arg() * w;
      const absPow = Math.pow(this.abs(), w);

      return new Complex(
        absPow * Math.cos(argThisw),
        absPow * Math.sin(argThisw),
      );
    } else {
      // If w is a complex number, use this formula.
      return this.pow(w.real).mul(
        this.log().mul(new Complex(0, w.imag)).exp(),
      );
    }
  }

  // ISO/IEC compliant
  /**
   * Takes the hyperbolic sine of a complex number.
   *
   * @returns {Complex} The hyperbolic sine of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).sinh();
   * const z1 = new Complex(Math.PI / 2).sinh();
   * assertAlmostEquals(z0.real, -3.59056459);
   * assertAlmostEquals(z0.imag, .53092109);
   * assertAlmostEquals(z1.real, 2.30129890231);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  sinh(): Complex {
    // ISO/IEC compliant
    if (isNegativeSigned(this.real) && isNegativeSigned(this.imag)) {
      return this.neg().sinh().neg();
    }
    if (isPositiveSigned(this.real) && isNegativeSigned(this.imag)) {
      return this.conj().sinh().conj();
    }
    if (isNegativeSigned(this.real) && isPositiveSigned(this.imag)) {
      return this.neg().conj().sinh().conj().neg();
    }

    for (
      const [[realInput, imagInput], [realOutput, imagOutput]]
        of simpleSpecialValues.sinh
    ) {
      if (
        strictEqualsComplex(this, new Complex(realInput, imagInput))
      ) return new Complex(realOutput, imagOutput);
    }

    return Number.isFinite(this.real) && 0 < this.real &&
        this.imag === Infinity
      ? new Complex(NaN, NaN)
      : Number.isFinite(this.real) && this.real !== 0 &&
          Number.isNaN(this.imag)
      ? new Complex(NaN, NaN)
      : this.real === Infinity &&
          Number.isFinite(this.imag)
      ? Complex.cis(this.imag).mul(Infinity)
      : Number.isNaN(this.real) && this.imag !== 0
      ? new Complex(NaN, NaN)
      : new Complex(
        Math.sinh(this.real) * Math.cos(this.imag),
        Math.cosh(this.real) * Math.sin(this.imag),
      );
  }

  // ISO/IEC compliant
  /**
   * Takes the hyperbolic cosine of a complex number.
   *
   * @returns {Complex} The hyperbolic cosine of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).cosh();
   * const z1 = new Complex(Math.PI / 2).cosh();
   * assertAlmostEquals(z0.real, -3.7245455);
   * assertAlmostEquals(z0.imag, .51182257);
   * assertAlmostEquals(z1.real, 2.50917847866);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  cosh(): Complex {
    // ISO/IEC compliant
    if (isNegativeSigned(this.real) && isNegativeSigned(this.imag)) {
      return this.neg().cosh();
    }
    if (isPositiveSigned(this.real) && isNegativeSigned(this.imag)) {
      return this.conj().cosh().conj();
    }
    if (isNegativeSigned(this.real) && isPositiveSigned(this.imag)) {
      return this.neg().conj().cosh().conj();
    }

    for (
      const [[realInput, imagInput], [realOutput, imagOutput]]
        of simpleSpecialValues.cosh
    ) {
      if (
        strictEqualsComplex(this, new Complex(realInput, imagInput))
      ) return new Complex(realOutput, imagOutput);
    }

    return Number.isFinite(this.real) && this.real !== 0 &&
        this.imag === Infinity
      ? new Complex(NaN, NaN)
      : Number.isFinite(this.real) && this.real !== 0 &&
          Number.isNaN(this.imag)
      ? new Complex(NaN, NaN)
      : this.real === Infinity &&
          Number.isFinite(this.imag) && this.imag !== 0
      ? Complex.cis(this.imag).mul(Infinity)
      : Number.isNaN(this.real) &&
          this.imag !== 0
      ? new Complex(NaN, NaN)
      : new Complex(
        Math.cosh(this.real) * Math.cos(this.imag),
        Math.sinh(this.real) * Math.sin(this.imag),
      );
  }

  // ISO/IEC compliant
  /**
   * Takes the hyperbolic tangent of a complex number.
   *
   * @returns {Complex} The hyperbolic tangent of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).tanh();
   * const z1 = new Complex(Math.PI / 2).tanh();
   * assertAlmostEquals(z0.real, .96538588, 5e-9);
   * assertAlmostEquals(z0.imag, -.00988438, 5e-9);
   * assertAlmostEquals(z1.real, .917152335667, 5e-9);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  tanh(): Complex {
    // ISO/IEC compliant
    if (isNegativeSigned(this.imag)) return this.conj().tanh().conj();

    for (
      const [[realInput, imagInput], [realOutput, imagOutput]]
        of simpleSpecialValues.tanh
    ) {
      if (
        strictEqualsComplex(this, new Complex(realInput, imagInput))
      ) return new Complex(realOutput, imagOutput);
    }

    return Number.isFinite(this.real) && this.real !== 0 &&
        this.imag === Infinity
      ? new Complex(NaN, NaN)
      : Number.isFinite(this.real) && this.real !== 0 &&
          Number.isNaN(this.imag)
      ? new Complex(NaN, NaN)
      : this.real === Infinity &&
          Number.isFinite(this.imag) && isPositiveSigned(this.imag)
      ? new Complex(1, 0 * Math.sin(2 * this.imag))
      : Number.isNaN(this.real) &&
          this.imag !== 0
      ? new Complex(NaN, NaN)
      : this.sinh().div(this.cosh());
  }

  /**
   * Takes the hyperbolic cotangent of a complex number.
   *
   * @returns {Complex} The hyperbolic cotangent of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).coth();
   * const z1 = new Complex(Math.PI / 2).coth();
   * assertAlmostEquals(z0.real, 1.03574664);
   * assertAlmostEquals(z0.imag, .01060478, 5e-9);
   * assertAlmostEquals(z1.real, 1.09033141073);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  coth(): Complex {
    return this.tanh().recip();
  }

  /**
   * Takes the hyperbolic secant of a complex number.
   *
   * @returns {Complex} The hyperbolic secant of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).sech();
   * const z1 = new Complex(Math.PI / 2).sech();
   * assertAlmostEquals(z0.real, -.26351298);
   * assertAlmostEquals(z0.imag, -.03621164);
   * assertAlmostEquals(z1.real, .398536815338);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  sech(): Complex {
    return this.cosh().recip();
  }

  /**
   * Takes the hyperbolic cosecant of a complex number.
   *
   * @returns {Complex} The hyperbolic cosecant of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).csch();
   * const z1 = new Complex(Math.PI / 2).csch();
   * assertAlmostEquals(z0.real, -.27254866);
   * assertAlmostEquals(z0.imag, -.04030058);
   * assertAlmostEquals(z1.real, .434537208095);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  csch(): Complex {
    return this.sinh().recip();
  }

  // ISO/IEC compliant
  /**
   * Takes the hyperbolic arcsine (inverse hyperbolic sine) of a complex number.
   *
   * @returns {Complex} The hyperbolic arcsine of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).asinh();
   * const z1 = new Complex(1).asinh();
   * assertAlmostEquals(z0.real, 1.96863793);
   * assertAlmostEquals(z0.imag, .9646585);
   * assertAlmostEquals(z1.real, .88137358702);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  asinh(): Complex {
    // ISO/IEC compliant
    if (isNegativeSigned(this.real) && isNegativeSigned(this.imag)) {
      return this.neg().asinh().neg();
    }
    if (isPositiveSigned(this.real) && isNegativeSigned(this.imag)) {
      return this.conj().asinh().conj();
    }
    if (isNegativeSigned(this.real) && isPositiveSigned(this.imag)) {
      return this.neg().conj().asinh().conj().neg();
    }

    for (
      const [[realInput, imagInput], [realOutput, imagOutput]]
        of simpleSpecialValues.asinh
    ) {
      if (
        strictEqualsComplex(this, new Complex(realInput, imagInput))
      ) return new Complex(realOutput, imagOutput);
    }

    return Number.isFinite(this.real) && isPositiveSigned(this.real) &&
        this.imag === Infinity
      ? new Complex(Infinity, Math.PI / 2)
      : Number.isFinite(this.real) && this.real !== 0 &&
          Number.isNaN(this.imag)
      ? new Complex(NaN, NaN)
      : this.real === Infinity &&
          isPositiveSigned(this.imag) && Number.isFinite(this.imag)
      ? new Complex(Infinity, 0)
      : Number.isNaN(this.real) &&
          Number.isFinite(this.imag) && this.imag !== 0
      ? new Complex(NaN, NaN)
      : this.pow(2).add(1).sqrt().add(this).log();
  }

  // ISO/IEC compliant
  /**
   * Takes the hyperbolic arccosine (inverse hyperbolic cosine) of a complex number.
   *
   * @returns {Complex} The hyperbolic arccosine of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).acosh();
   * const z1 = new Complex(1).acosh();
   * assertAlmostEquals(z0.real, 1.98338703);
   * assertAlmostEquals(z0.imag, 1.00014354);
   * assertAlmostEquals(z1.real, 0, 1e-15);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  acosh(): Complex {
    // ISO/IEC compliant
    if (isNegativeSigned(this.imag)) return this.conj().acosh().conj();

    for (
      const [[realInput, imagInput], [realOutput, imagOutput]]
        of simpleSpecialValues.acosh
    ) {
      if (
        strictEqualsComplex(this, new Complex(realInput, imagInput))
      ) return new Complex(realOutput, imagOutput);
    }

    return this.real !== 0 && Number.isFinite(this.real) &&
        Number.isNaN(this.imag)
      ? new Complex(NaN, NaN)
      : this.real === -Infinity &&
          Number.isFinite(this.imag) && isPositiveSigned(this.imag)
      ? new Complex(Infinity, Math.PI)
      : this.real === Infinity &&
          Number.isFinite(this.imag) && isPositiveSigned(this.imag)
      ? new Complex(Infinity)
      : Number.isNaN(this.real) &&
          Number.isFinite(this.imag)
      ? new Complex(NaN, NaN)
      : this.sub(1).sqrt().mul(this.add(1).sqrt()).add(this).log();
  }

  // ISO/IEC compliant
  /**
   * Takes the hyperbolic arctangent (inverse hyperbolic tangent) of a complex number.
   *
   * @returns {Complex} The hyperbolic arctangent of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).atanh();
   * const z1 = new Complex(2).atanh();
   * assertAlmostEquals(z0.real, .14694667);
   * assertAlmostEquals(z0.imag, 1.33897252);
   * assertAlmostEquals(z1.real, .54930614);
   * assertAlmostEquals(z1.imag, -1.57079633);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  atanh(): Complex {
    // ISO/IEC compliant
    if (isNegativeSigned(this.real) && isNegativeSigned(this.imag)) {
      return this.neg().atanh().neg();
    }
    if (isPositiveSigned(this.real) && isNegativeSigned(this.imag)) {
      return this.conj().atanh().conj();
    }
    if (isNegativeSigned(this.real) && isPositiveSigned(this.imag)) {
      return this.neg().conj().atanh().conj().neg();
    }

    for (
      const [[realInput, imagInput], [realOutput, imagOutput]]
        of simpleSpecialValues.atanh
    ) {
      if (
        strictEqualsComplex(this, new Complex(realInput, imagInput))
      ) return new Complex(realOutput, imagOutput);
    }

    return Number.isFinite(this.real) && isPositiveSigned(this.real) &&
        this.imag === Infinity
      ? new Complex(0, Math.PI / 2)
      : Number.isFinite(this.real) && this.real !== 0 &&
          Number.isNaN(this.imag)
      ? new Complex(NaN, NaN)
      : this.real === Infinity &&
          isPositiveSigned(this.imag)
      ? new Complex(0, Math.PI / 2)
      : Number.isNaN(this.real) &&
          Number.isFinite(this.imag)
      ? new Complex(NaN, NaN)
      : this.add(1).log().sub(Complex.one.sub(this).log()).div(2);
  }

  // ISO/IEC compliant
  /**
   * Takes the sine of a complex number.
   *
   * @returns {Complex} The sine of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).sin();
   * const z1 = new Complex(2 * Math.PI).sin();
   * assertAlmostEquals(z0.real, 9.15449915);
   * assertAlmostEquals(z0.imag, -4.16890696);
   * assertAlmostEquals(z1.real, 0, 1e-15);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  sin(): Complex {
    // ISO/IEC specified
    return this.mul(new Complex(0, 1)).sinh().mul(new Complex(0, -1));
  }

  // ISO/IEC compliant
  /**
   * Takes the cosine of a complex number.
   *
   * @returns {Complex} The cosine of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).cos();
   * const z1 = new Complex(2 * Math.PI).cos();
   * assertAlmostEquals(z0.real, -4.18962569);
   * assertAlmostEquals(z0.imag, -9.10922789);
   * assertAlmostEquals(z1.real, 1);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  cos(): Complex {
    // ISO/IEC specified
    return this.mul(new Complex(0, 1)).cosh();
  }

  // ISO/IEC compliant
  /**
   * Takes the tangent of a complex number.
   *
   * @returns {Complex} The tangent of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).tan();
   * const z1 = new Complex(2 * Math.PI).tan();
   * assertAlmostEquals(z0.real, -.00376403, 5e-9);
   * assertAlmostEquals(z0.imag, 1.00323863);
   * assertAlmostEquals(z1.real, 0, 1e-15);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  tan(): Complex {
    // ISO/IEC specified
    return this.mul(new Complex(0, 1)).tanh().mul(new Complex(0, -1));
  }

  /**
   * Takes the cotangent of a complex number.
   *
   * @returns {Complex} The cotangent of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).cot();
   * const z1 = new Complex(Math.PI / 2).cot();
   * assertAlmostEquals(z0.real, -.00373971, 4e-10);
   * assertAlmostEquals(z0.imag, -.9967578);
   * assertAlmostEquals(z1.real, 0, 1e-15);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  cot(): Complex {
    return this.tan().recip();
  }

  /**
   * Takes the secant of a complex number.
   *
   * @returns {Complex} The secant of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).sec();
   * const z1 = new Complex(2 * Math.PI).sec();
   * assertAlmostEquals(z0.real, -.04167496, 5e-9);
   * assertAlmostEquals(z0.imag, .09061114);
   * assertAlmostEquals(z1.real, 1);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  sec(): Complex {
    return this.cos().recip();
  }

  /**
   * Takes the cosecant of a complex number.
   *
   * @returns {Complex} The cosecant of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).csc();
   * const z1 = new Complex(Math.PI / 2).csc();
   * assertAlmostEquals(z0.real, .09047321);
   * assertAlmostEquals(z0.imag, .04120099, 5e-9);
   * assertAlmostEquals(z1.real, 1);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  csc(): Complex {
    return this.sin().recip();
  }

  // ISO/IEC compliant
  /**
   * Takes the arcsine (inverse sine) of a complex number.
   *
   * @returns {Complex} The arcsine of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).asin();
   * const z1 = new Complex(1).asin();
   * assertAlmostEquals(z0.real, .57065278);
   * assertAlmostEquals(z0.imag, 1.98338703);
   * assertAlmostEquals(z1.real, Math.PI / 2);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  asin(): Complex {
    // ISO/IEC specified
    return this.mul(new Complex(0, 1)).asinh().mul(new Complex(0, -1));
  }

  // ISO/IEC compliant
  /**
   * Takes the arccosine (inverse cosine) of a complex number.
   *
   * @returns {Complex} The arccosine of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).acos();
   * const z1 = new Complex(1).acos();
   * assertAlmostEquals(z0.real, 1.00014354);
   * assertAlmostEquals(z0.imag, -1.98338703);
   * assertAlmostEquals(z1.real, 0, 1e-15);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  acos(): Complex {
    // ISO/IEC compliant
    if (isNegativeSigned(this.imag)) return this.conj().acos().conj();

    for (
      const [[realInput, imagInput], [realOutput, imagOutput]]
        of simpleSpecialValues.acos
    ) {
      if (
        strictEqualsComplex(this, new Complex(realInput, imagInput))
      ) return new Complex(realOutput, imagOutput);
    }

    return Number.isFinite(this.real) &&
        this.imag === Infinity
      ? new Complex(Math.PI / 2, -Infinity)
      : Number.isFinite(this.real) && this.real !== 0 &&
          Number.isNaN(this.imag)
      ? new Complex(NaN, NaN)
      : this.real === -Infinity &&
          isPositiveSigned(this.imag) && Number.isFinite(this.imag)
      ? new Complex(Math.PI, -Infinity)
      : this.real === Infinity &&
          isPositiveSigned(this.imag) && Number.isFinite(this.imag)
      ? new Complex(0, -Infinity)
      : Number.isNaN(this.real)
      ? new Complex(NaN, NaN)
      : new Complex(Math.PI / 2).sub(this.asin());
  }

  // ISO/IEC compliant
  /**
   * Takes the arctangent (inverse tangent) of a complex number.
   *
   * @returns {Complex} The arctangent of this.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assertAlmostEquals } from "@std/assert";
   *
   * const z0 = new Complex(2, 3).atan();
   * const z1 = new Complex(1).atan();
   * assertAlmostEquals(z0.real, 1.40992105);
   * assertAlmostEquals(z0.imag, .22907268);
   * assertAlmostEquals(z1.real, Math.PI / 4);
   * assertAlmostEquals(z1.imag, 0, 1e-15);
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  atan(): Complex {
    // ISO/IEC specified
    return this.mul(new Complex(0, 1)).atanh().mul(new Complex(0, -1));
  }
}
