// Copyright 2018-2026 the Deno authors. MIT license.

// Should this class be parameterized to support bigint?

// Annex G https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3886.pdf

function isInfinite(num: number): boolean {
  return num === Infinity || num === -Infinity;
}

/**
 * A class representing a complex number. Also contains utility functions for complex numbers.
 *
 * @param {number} real The real part of this complex number.
 * @param {number} imag The imaginary part of this complex number.
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
   * @returns {boolean} Whether the supplied complex number is real.
   */
  isReal(): boolean {
    return this.imag === 0 && Number.isFinite(this.real);
  }

  /**
   * Checks whether a complex number is imaginary, meaning its real part is equal to zero.
   *
   * @returns {boolean} Whether the supplied complex number is imaginary.
   */
  isImaginary(): boolean {
    return this.real === 0 && Number.isFinite(this.imag);
  }

  /**
   * Checks whether a complex number is equal to zero.
   *
   * @returns {boolean} Whether the supplied complex number is equal to zero.
   */
  isZero(): boolean {
    return this.real === 0 && this.imag === 0;
  }

  /**
   * Checks whether a complex number is finite.
   *
   * @returns {boolean} Whether this is finite.
   */
  isFinite(): boolean {
    return Number.isFinite(this.real) && Number.isFinite(this.imag);
  }

  /**
   * Checks whether a complex number is finite.
   *
   * @returns {boolean} Whether the supplied complex number is finite.
   */
  isInfinite(): boolean {
    return isInfinite(this.real) && isInfinite(this.imag);
  }

  /**
   * Checks whether a complex number is NaN.
   *
   * @returns {boolean} Whether the supplied complex number is NaN.
   */
  isNaN(): boolean {
    return (Number.isNaN(this.real) && !isInfinite(this.real)) ||
      (Number.isNaN(this.imag) && !isInfinite(this.real));
  }

  /**
   * Returns the sum of the supplied complex numbers.
   *
   * @param {Complex | number} num The complex numbers to sum.
   *
   * @returns {Complex} The sum of the supplied complex numbers.
   */
  add(num: Complex | number): Complex {
    if (Complex.#isInfinite(num)) return Complex.#complexInfinity;
    if (Complex.#isNaN(num)) return Complex.#complexNaN;
    if (typeof num === "number") num = new Complex(num);

    return new Complex(this.real + num.real, this.imag + num.imag);
  }

  /**
   * Returns the negative of a complex number.
   *
   * @returns {Complex} The negative of the supplied complex number.
   */
  neg(): Complex {
    return new Complex(-this.real, -this.imag);
  }

  /**
   * Returns the difference of two complex numbers.
   *
   * @param {Complex} num A complex number.
   *
   * @returns {Complex} The difference of the two supplied complex numbers.
   */
  sub(num: Complex | number): Complex {
    if (typeof num === "number") num = new Complex(num);
    if (Complex.#isNaN(num) || num.isNaN()) return Complex.#complexNaN;

    return new Complex(this.real - num.real, this.imag - num.imag);
  }

  /**
   * Returns the product of the supplied complex numbers.
   *
   * @param {Complex | number} num The complex numbers to multiply.
   *
   * @returns {Complex} The product of the supplied complex numbers.
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
   * Returns the ratio of two complex numbers.
   *
   * @param {Complex} num A complex number.
   *
   * @returns {Complex} The ratio of the two supplied complex numbers.
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
   * Returns the reciprocal (multiplicative inverse) of a complex number.
   *
   * @returns {Complex} The reciprocal of the supplied number.
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
   * @returns {Complex} The square of the absolute value of the supplied number.
   */
  absSquared(): number {
    return this.real * this.real + this.imag * this.imag;
  }

  /**
   * Returns the absolute value of a complex number.
   *
   * @returns {Complex} The absolute value of the supplied number.
   */
  abs(): number {
    return Math.sqrt(this.absSquared());
  }

  /**
   * Returns the argument of a complex number. The range of this function is (-pi, pi].
   *
   * @returns {Complex} The square of the absolute value of the supplied number.
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
   * Returns the conjugate of a complex number.
   *
   * @returns {Complex} The conjugate of the supplied number.
   */
  conj(): Complex {
    return new Complex(this.real, -this.imag);
  }

  /**
   * Returns the square root of a complex number.
   *
   * @returns {Complex} The square root of the supplied number.
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
   * Returns the cube root of a complex number.
   *
   * @returns {Complex} The cube root of the supplied number.
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
   * Returns the natural logarithm of a complex number.
   *
   * @returns {Complex} The natural logarithm of the supplied number.
   */
  ln(): Complex {
    return this.isZero()
      ? Complex.#complexNaN
      : new Complex(Math.log(this.absSquared()) / 2, this.arg());
  }

  /**
   * Returns the base-10 logarithm of a complex number.
   *
   * @returns {Complex} The base-10 logarithm of the supplied number.
   */
  log(): Complex {
    return this.ln().div(Math.LN10);
  }

  /**
   * Returns the base-n logarithm of a complex number.
   *
   * @returns {Complex} The base-n logarithm of the supplied number.
   */
  logn(n: number): Complex {
    return this.ln().div(Math.log(n));
  }

  /**
   * Returns e (Euler's number) raised to the power of a complex number.
   *
   * @returns {Complex} E (Euler's number) raised to the power of a complex number.
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
   * Returns a complex number raised to the power of another complex number.
   *
   * @returns {Complex} The supplied complex number raised to the power the other complex number.
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
   * Returns the sine of a complex number.
   *
   * @returns The sine of the supplied complex number.
   */
  sin(): Complex {
    if (this.isReal()) return new Complex(Math.sin(this.real));

    return new Complex(
      Math.sin(this.real) * Math.cosh(this.imag),
      Math.cos(this.real) * Math.sinh(this.imag),
    );
  }

  /**
   * Returns the cosine of a complex number.
   *
   * @returns The cosine of the supplied complex number.
   */
  cos(): Complex {
    if (this.isReal()) return new Complex(Math.cos(this.real));

    return new Complex(
      Math.cos(this.real) * Math.cosh(this.imag),
      -Math.sin(this.real) * Math.sinh(this.imag),
    );
  }

  /**
   * Returns the tangent of a complex number.
   *
   * @returns The tangent of the supplied complex number.
   */
  tan(): Complex {
    return this.sin().div(this.cos());
  }

  /**
   * Returns the cotangent of a complex number.
   *
   * @returns The cotangent of the supplied complex number.
   */
  cot(): Complex {
    return this.tan().recip();
  }

  /**
   * Returns the secant of a complex number.
   *
   * @returns The secant of the supplied complex number.
   */
  sec(): Complex {
    return this.cos().recip();
  }

  /**
   * Returns the cosecant of a complex number.
   *
   * @returns The cosecant of the supplied complex number.
   */
  csc(): Complex {
    return this.sin().recip();
  }

  /**
   * Returns the arcsine (inverse sine) of a complex number.
   *
   * @returns The arcsine of the supplied complex number.
   */
  asin(): Complex {
    if (this.isReal()) return new Complex(Math.asin(this.real));

    return Complex.negI.mul(
      (Complex.i.mul(this).add((new Complex(1).sub(this.pow(2))).sqrt())).ln(),
    );
  }

  /**
   * Returns the arccosine (inverse cosine) of a complex number.
   *
   * @returns The arccosine of the supplied complex number.
   */
  acos(): Complex {
    return new Complex(Math.PI / 2).sub(this.asin());
  }

  /**
   * Returns the arctangent (inverse tangent) of a complex number.
   *
   * @returns The arctangent of the supplied complex number.
   */
  atan(): Complex {
    return (Complex.one.sub(Complex.i.mul(this))).ln().sub(
      (Complex.one.add(Complex.i.mul(this))).ln(),
    ).div(2).mul(Complex.i);
  }

  /**
   * Returns the hyperbolic sine of a complex number.
   *
   * @returns The hyperbolic sine of the supplied complex number.
   */
  sinh(): Complex {
    if (this.isReal()) return new Complex(this.real);

    return new Complex(
      Math.sinh(this.real) * Math.cos(this.imag),
      Math.cosh(this.real) * Math.sin(this.imag),
    );
  }

  /**
   * Returns the hyperbolic cosine of a complex number.
   *
   * @returns The hyperbolic cosine of the supplied complex number.
   */
  cosh(): Complex {
    if (this.isReal()) return new Complex(Math.cosh(this.real));

    return new Complex(
      Math.cosh(this.real) * Math.cos(this.imag),
      Math.sinh(this.real) * Math.sin(this.imag),
    );
  }

  /**
   * Returns the hyperbolic tangent of a complex number.
   *
   * @returns The hyperbolic tangent of the supplied complex number.
   */
  tanh(): Complex {
    return this.sinh().div(this.cosh());
  }

  /**
   * Returns the hyperbolic cotangent of a complex number.
   *
   * @returns The hyperbolic cotangent of the supplied complex number.
   */
  coth(): Complex {
    return this.tanh().recip();
  }

  /**
   * Returns the hyperbolic secant of a complex number.
   *
   * @returns The hyperbolic secant of the supplied complex number.
   */
  sech(): Complex {
    return this.cosh().recip();
  }

  /**
   * Returns the hyperbolic cosecant of a complex number.
   *
   * @returns The hyperbolic cosecant of the supplied complex number.
   */
  csch(): Complex {
    return this.sinh().recip();
  }

  /**
   * Returns the hyperbolic arcsine (inverse hyperbolic sine) of a complex number.
   *
   * @returns {Complex | number} The hyperbolic arcsine (inverse hyperbolic sine) of the supplied complex number.
   */
  asinh(): Complex {
    if (this.isReal()) return new Complex(this.real);
    return this.pow(2).add(1).sqrt().add(this).ln();
  }

  /**
   * Returns the hyperbolic arccosine (inverse hyperbolic cosine) of a complex number.
   *
   * @returns {Complex | number} The hyperbolic arccosine (inverse hyperbolic cosine) of the supplied complex number.
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
   * Returns the hyperbolic arctangent (inverse hyperbolic tangent) of a complex number.
   *
   * @returns {Complex | number} The hyperbolic arctangent (inverse hyperbolic tangent) of the supplied complex number.
   */
  atanh(): Complex {
    return Complex.one.add(this).ln().sub(Complex.one.sub(this).ln()).div(2);
  }
}
