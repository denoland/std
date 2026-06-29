// Copyright 2018-2026 the Deno authors. MIT license.

// Should this class be parameterized to support bigint?

// Annex G https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3886.pdf

function isInfinite(num: number): boolean {
  return num === Infinity || num === -Infinity;
}

/**
 * A class representing a complex number. Also contains utility functions for complex numbers.
 *
 * @example Usage
 * ```ts
 * import { Complex } from "@std/math/unstable-complex";
 *
 * let z0 = new Complex(1, 2); // Represents 1 + 2i
 * let z1 = new Complex(-3) // Represents -3 + 0i
 * ```
 *
 * @property {number} real The real part of this complex number.
 * @property {number} imag The imaginary part of this complex number.
 */
export class Complex {
  real: number;
  imag: number;

  constructor(real: number, imag?: number) {
    if (isInfinite(real) || (imag !== undefined && isInfinite(imag))) {
      this.real = Infinity;
      this.imag = Infinity;
    } else if (
      Number.isNaN(real) || (imag !== undefined && Number.isNaN(imag))
    ) {
      this.real = NaN;
      this.imag = NaN;
    } else {
      this.real = real;
      this.imag = imag ?? 0;
    }
  }

  /** Zero as a complex number */
  static zero = new Complex(0);
  /** i, the imaginary unit */
  static i = new Complex(0, 1);
  /** -i, the negative of the imaginary unit */
  static negI = new Complex(0, -1);
  /** One as a complex number */
  static one = new Complex(1);
  /** Negative one as a complex number */
  static negOne = new Complex(-1);

  static #complexNaN = new Complex(NaN);
  static #complexInfinity = new Complex(Infinity);

  static #isNaN = (num: Complex | number): boolean =>
    (typeof num === "number" && Number.isNaN(num)) ||
    (num instanceof Complex && num.isNaN());

  static #isInfinite = (num: Complex | number): boolean =>
    (typeof num === "number" && isInfinite(num)) ||
    (num instanceof Complex && isInfinite(num.real) && isInfinite(num.imag));

  /**
   * Checks whether a complex number is real, meaning its imaginary part is equal to zero.
   *
   * @returns {boolean} Whether this is real.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assert, assertFalse } from "@std/assert";
   *
   * assert(new Complex(4, 0).isReal());
   * assertFalse(new Complex(0, 4).isReal());
   * ```
   */
  isReal(): boolean {
    return this.imag === 0 && Number.isFinite(this.real);
  }

  /**
   * Checks whether a complex number is imaginary, meaning its real part is equal to zero.
   *
   * @returns {boolean} Whether this is imaginary.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assert, assertFalse } from "@std/assert";
   *
   * assert(new Complex(0, 4).isImaginary());
   * assertFalse(new Complex(4, 0).isImaginary());
   * ```
   */
  isImaginary(): boolean {
    return this.real === 0 && Number.isFinite(this.imag);
  }

  /**
   * Checks whether this is equal to zero.
   *
   * @returns {boolean} Whether this is equal to zero.
   *
   * @example Usage
   * ```ts
   * import { Complex } from "@std/math/unstable-complex";
   * import { assert, assertFalse } from "@std/assert";
   *
   * assert(new Complex(0, 0).isZero());
   * assertFalse(new Complex(0, 4).isZero());
   * ```
   */
  isZero(tolerance?: number): boolean {
    return (this.real === 0 && this.imag === 0) ||
      (tolerance !== undefined && this.abs() < tolerance);
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
   * assert(new Complex(Infinity, 3).isFinite());
   * assert(new Complex(0, -Infinity).isFinite());
   * assertFalse(new Complex(5, 3).isFinite());
   * ```
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
   */
  isNaN(): boolean {
    return (Number.isNaN(this.real) && !isInfinite(this.real)) ||
      (Number.isNaN(this.imag) && !isInfinite(this.real));
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
   */
  add(num: Complex | number): Complex {
    if (typeof num === "number") num = new Complex(num);

    return new Complex(this.real + num.real, this.imag + num.imag);
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
   */
  sub(num: Complex | number): Complex {
    if (typeof num === "number") num = new Complex(num);
    if (Complex.#isNaN(num) || num.isNaN()) return Complex.#complexNaN;

    return new Complex(this.real - num.real, this.imag - num.imag);
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
   */
  div(num: Complex | number): Complex {
    if (num instanceof Complex && num.isReal()) num = num.real;
    if (this.isNaN() || Complex.#isNaN(num)) return Complex.#complexNaN;

    if (typeof num === "number") {
      return Number.isNaN(num) ? Complex.#complexNaN : new Complex(
        this.real / num,
        this.imag / num,
      );
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
   */
  recip(): Complex {
    if (this instanceof Complex && this.isReal()) {
      return new Complex(1 / this.real);
    }

    if (typeof this === "number") {
      return Number.isNaN(this) ? Complex.#complexNaN : new Complex(1 / this);
    } else {
      if (this.isInfinite()) return Complex.zero;
      const absSquaredThis = this.absSquared();

      return new Complex(
        this.real / absSquaredThis,
        -this.imag / absSquaredThis,
      );
    }
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
   */
  abs(): number {
    return Math.sqrt(this.absSquared());
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
   * assertAlmostEquals(new Complex(0, 3).abs(), Math.PI / 2);
   * assertAlmostEquals(new Complex(4, -3).abs(), -0.6435011088);
   * ```
   */
  arg(): number {
    return this.isZero()
      ? 0
      : this.imag === 0 && this.real > 0
      ? 0
      : this.imag === 0 && this.real < 0
      ? Math.PI
      : Math.sign(this.imag) * Math.acos(this.real / this.abs());
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
   */
  sqrt(): Complex {
    if (this.isReal()) {
      return 0 <= this.real
        ? new Complex(Math.sqrt(this.real))
        : new Complex(0, Math.sqrt(-this.real));
    }

    const absThis = this.abs();

    return new Complex(
      Math.sqrt((this.real + absThis) / 2),
      (this.imag < 0 ? -1 : 1) * Math.sqrt((-this.real + absThis) / 2),
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
   * import { assertEquals } from "@std/assert";
   *
   * assertEquals(new Complex(0, -27).cbrt(), new Complex(0, 3));
   * assertEquals(new Complex(-44, -117).cbrt(), new Complex(4, -3));
   * ```
   */
  cbrt(): Complex {
    if (this.isReal()) return new Complex(Math.cbrt(this.real));
    if (this.isInfinite()) return Complex.#complexInfinity;

    const argThisdiv = this.arg() / 3;
    const absCbrt = Math.cbrt(this.abs());

    return new Complex(
      absCbrt * Math.cos(argThisdiv),
      absCbrt * Math.sin(argThisdiv),
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
   * assertAlmostEquals(new Complex(-1).ln(), new Complex(0, Math.PI));
   * ```
   */
  ln(): Complex {
    return this.isZero()
      ? Complex.#complexNaN
      : new Complex(Math.log(this.absSquared()) / 2, this.arg());
  }

  /**
   * Takes the base-10 logarithm of a complex number.
   *
   * @returns {Complex} The base-10 logarithm of this.
   */
  log(): Complex {
    return this.ln().div(Math.LN10);
  }

  /**
   * Takes the base-n logarithm of a complex number.
   *
   * @returns {Complex} The base-n logarithm of this.
   */
  logn(n: number): Complex {
    return this.ln().div(Math.log(n));
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
   * assertAlmostEquals(new Complex(0, Math.PI).exp(), new Complex(-1));
   * ```
   */
  exp(): Complex {
    if (this.isReal()) return new Complex(Math.exp(this.real));

    const expReal = Math.exp(this.real);

    return new Complex(
      expReal * Math.cos(this.imag),
      expReal * Math.sin(this.imag),
    );
  }

  /**
   * Raises a complex number to the power of another complex number.
   *
   * @param {Complex | number} num A complex number.
   *
   * @returns {Complex} This to the power of the supplied complex number.
   */
  pow(num: Complex | number): Complex {
    if (typeof num !== "number" && num.imag === 0) num = num.real;

    if (typeof num === "number" && Number.isInteger(num)) {
      // If w is an integer, use exponentiation by squaring.
      return num === 0
        ? new Complex(1, 0)
        : num === 1
        ? this
        : num === -1
        ? this.recip()
        : num < 0
        ? this.pow(-num).recip()
        : num % 2 === 0
        ? this.mul(this).pow(num / 2)
        : this.mul(this.mul(this).pow((num - 1) / 2));
    } else if (typeof num === "number") {
      // If w is a real number, use De Moivre's formula.
      const argThisw = this.arg() * num;
      const absPow = Math.pow(this.abs(), num);

      return new Complex(
        absPow * Math.cos(argThisw),
        absPow * Math.sin(argThisw),
      );
    } else {
      return this.pow(num.real).mul(
        this.ln().mul(new Complex(0, num.imag)).exp(),
      );
    }
  }

  /**
   * Takes the sine of a complex number.
   *
   * @returns {Complex} The sine of this.
   */
  sin(): Complex {
    if (this.isReal()) return new Complex(Math.sin(this.real));

    return new Complex(
      Math.sin(this.real) * Math.cosh(this.imag),
      Math.cos(this.real) * Math.sinh(this.imag),
    );
  }

  /**
   * Takes the cosine of a complex number.
   *
   * @returns {Complex} The cosine of this.
   */
  cos(): Complex {
    if (this.isReal()) return new Complex(Math.cos(this.real));

    return new Complex(
      Math.cos(this.real) * Math.cosh(this.imag),
      -Math.sin(this.real) * Math.sinh(this.imag),
    );
  }

  /**
   * Takes the tangent of a complex number.
   *
   * @returns {Complex} The tangent of this.
   */
  tan(): Complex {
    return this.sin().div(this.cos());
  }

  /**
   * Takes the cotangent of a complex number.
   *
   * @returns {Complex} The cotangent of this.
   */
  cot(): Complex {
    return this.tan().recip();
  }

  /**
   * Takes the secant of a complex number.
   *
   * @returns {Complex} The secant of this.
   */
  sec(): Complex {
    return this.cos().recip();
  }

  /**
   * Takes the cosecant of a complex number.
   *
   * @returns {Complex} The cosecant of this.
   */
  csc(): Complex {
    return this.sin().recip();
  }

  /**
   * Takes the arcsine (inverse sine) of a complex number.
   *
   * @returns {Complex} The arcsine of this.
   */
  asin(): Complex {
    if (this.isReal()) return new Complex(Math.asin(this.real));

    return Complex.negI.mul(
      (Complex.i.mul(this).add((new Complex(1).sub(this.pow(2))).sqrt())).ln(),
    );
  }

  /**
   * Takes the arccosine (inverse cosine) of a complex number.
   *
   * @returns {Complex} The arccosine of this.
   */
  acos(): Complex {
    return new Complex(Math.PI / 2).sub(this.asin());
  }

  /**
   * Takes the arctangent (inverse tangent) of a complex number.
   *
   * @returns {Complex} The arctangent of this.
   */
  atan(): Complex {
    return (Complex.one.sub(Complex.i.mul(this))).ln().sub(
      (Complex.one.add(Complex.i.mul(this))).ln(),
    ).div(2).mul(Complex.i);
  }

  /**
   * Takes the hyperbolic sine of a complex number.
   *
   * @returns {Complex} The hyperbolic sine of this.
   */
  sinh(): Complex {
    if (this.isReal()) return new Complex(this.real);

    return new Complex(
      Math.sinh(this.real) * Math.cos(this.imag),
      Math.cosh(this.real) * Math.sin(this.imag),
    );
  }

  /**
   * Takes the hyperbolic cosine of a complex number.
   *
   * @returns {Complex} The hyperbolic cosine of this.
   */
  cosh(): Complex {
    if (this.isReal()) return new Complex(Math.cosh(this.real));

    return new Complex(
      Math.cosh(this.real) * Math.cos(this.imag),
      Math.sinh(this.real) * Math.sin(this.imag),
    );
  }

  /**
   * Takes the hyperbolic tangent of a complex number.
   *
   * @returns {Complex} The hyperbolic tangent of this.
   */
  tanh(): Complex {
    return this.sinh().div(this.cosh());
  }

  /**
   * Takes the hyperbolic cotangent of a complex number.
   *
   * @returns {Complex} The hyperbolic cotangent of this.
   */
  coth(): Complex {
    return this.tanh().recip();
  }

  /**
   * Takes the hyperbolic secant of a complex number.
   *
   * @returns {Complex} The hyperbolic secant of this.
   */
  sech(): Complex {
    return this.cosh().recip();
  }

  /**
   * Takes the hyperbolic cosecant of a complex number.
   *
   * @returns {Complex} The hyperbolic cosecant of this.
   */
  csch(): Complex {
    return this.sinh().recip();
  }

  /**
   * Takes the hyperbolic arcsine (inverse hyperbolic sine) of a complex number.
   *
   * @returns {Complex} The hyperbolic arcsine of this.
   */
  asinh(): Complex {
    if (this.isReal()) return new Complex(this.real);
    return this.pow(2).add(1).sqrt().add(this).ln();
  }

  /**
   * Takes the hyperbolic arccosine (inverse hyperbolic cosine) of a complex number.
   *
   * @returns {Complex} The hyperbolic arccosine of this.
   */
  acosh(): Complex {
    if (this.isReal() && 1 <= this.real) {
      return new Complex(Math.acosh(this.real));
    }

    const a = this.sub(1).sqrt();
    const b = this.add(1).sqrt();

    return Complex.#isInfinite(this)
      ? Complex.#complexNaN
      : (a.mul(b).add(this)).ln();
  }

  /**
   * Takes the hyperbolic arctangent (inverse hyperbolic tangent) of a complex number.
   *
   * @returns {Complex} The hyperbolic arctangent of this.
   */
  atanh(): Complex {
    return Complex.one.add(this).ln().sub(Complex.one.sub(this).ln()).div(2);
  }
}
