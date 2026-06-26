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

  static #complexNaN = new Complex(NaN);
  static #complexInfinity = new Complex(Infinity);

  static #containsNaN = (nums: (Complex | number)[]): boolean =>
    Boolean(nums.find((num) =>
      (typeof num === "number" && Number.isNaN(num)) ||
      (num instanceof Complex && this.isNaN(num))
    ));

  static #isInfinity = (num: Complex | number): boolean =>
    (typeof num === "number" && isInfinite(num)) ||
    (num instanceof Complex && isInfinite(num.real) && isInfinite(num.imag));

  static #containsInfinity = (nums: (Complex | number)[]): boolean =>
    Boolean(
      nums.find((num) =>
        (typeof num === "number" && isInfinite(num)) ||
        (num instanceof Complex && isInfinite(num.real) && isInfinite(num.imag))
      ),
    );

  /**
   * Checks whether a complex number is real, meaning its imaginary part is equal to zero.
   *
   * @param {Complex} z A complex number.
   *
   * @returns {boolean} Whether the supplied complex number is real.
   */
  static isReal(z: Complex): boolean {
    return z.imag === 0 && Number.isFinite(z.real);
  }

  /**
   * Checks whether a complex number is imaginary, meaning its real part is equal to zero.
   *
   * @param {Complex} z A complex number.
   *
   * @returns {boolean} Whether the supplied complex number is imaginary.
   */
  static isImaginary(z: Complex): boolean {
    return z.real === 0 && Number.isFinite(z.imag);
  }

  /**
   * Checks whether a complex number is equal to zero.
   *
   * @param {Complex} z A complex number.
   *
   * @returns {boolean} Whether the supplied complex number is equal to zero.
   */
  static isZero(z: Complex): boolean {
    return z.real === 0 && z.imag === 0;
  }

  /**
   * Checks whether a complex number is finite.
   *
   * @param {Complex} z A complex number.
   *
   * @returns {boolean} Whether the supplied complex number is finite.
   */
  static isFinite(z: Complex): boolean {
    return Number.isFinite(z.real) && Number.isFinite(z.imag);
  }

  /**
   * Checks whether a complex number is finite.
   *
   * @param {Complex} z A complex number.
   *
   * @returns {boolean} Whether the supplied complex number is finite.
   */
  static isInfinite(z: Complex): boolean {
    return isInfinite(z.real) && isInfinite(z.imag);
  }

  /**
   * Checks whether a complex number is NaN.
   *
   * @param {Complex} z A complex number.
   *
   * @returns {boolean} Whether the supplied complex number is NaN.
   */
  static isNaN(z: Complex): boolean {
    return (Number.isNaN(z.real) && !isInfinite(z.real)) ||
      (Number.isNaN(z.imag) && !isInfinite(z.real));
  }

  /**
   * Returns the sum of the supplied complex numbers.
   *
   * @param {(Complex | number)[]} nums The complex numbers to sum.
   *
   * @returns {Complex} The sum of the supplied complex numbers.
   */
  static add(...nums: (Complex | number)[]): Complex {
    if (this.#containsInfinity(nums)) return this.#complexInfinity;
    if (this.#containsNaN(nums)) return this.#complexNaN;

    let sum = new Complex(0);

    for (let num of nums) {
      if (typeof num === "number") num = new Complex(num);
      sum = new Complex(sum.real + num.real, sum.imag + num.imag);
    }

    return sum;
  }

  /**
   * Returns the negative of a complex number.
   *
   * @param {Complex} z The complex number to negate.
   *
   * @returns {Complex} The negative of the supplied complex number.
   */
  static neg(z: Complex): Complex {
    return new Complex(-z.real, -z.imag);
  }

  /**
   * Returns the difference of two complex numbers.
   *
   * @param {Complex} x A complex number.
   * @param {Complex} y A complex number.
   *
   * @returns {Complex} The difference of the two supplied complex numbers.
   */
  static sub(x: Complex | number, y: Complex | number): Complex {
    if (typeof x === "number") x = new Complex(x);
    if (typeof y === "number") y = new Complex(y);
    if (this.#containsNaN([x, y])) {
      return this.#complexNaN;
    }

    return new Complex(x.real - y.real, x.imag - y.imag);
  }

  /**
   * Returns the product of the supplied complex numbers.
   *
   * @param {(Complex | number)[]} nums The complex numbers to multiply.
   *
   * @returns {Complex} The product of the supplied complex numbers.
   */
  static mul(...nums: (Complex | number)[]): Complex {
    if (this.#containsNaN(nums)) return this.#complexNaN;

    let prod = new Complex(1);

    for (let num of nums) {
      if (num instanceof Complex && this.isReal(num)) num = num.real;
      if (typeof num === "number") {
        prod = new Complex(
          prod.real * num,
          prod.imag * num,
        );
      } else {
        prod = new Complex(
          prod.real * num.real - prod.imag * num.imag,
          prod.real * num.imag + prod.imag * num.real,
        );
      }
    }

    return prod;
  }

  /**
   * Returns the ratio of two complex numbers.
   *
   * @param {Complex} x A complex number.
   * @param {Complex} y A complex number.
   *
   * @returns {Complex} The ratio of the two supplied complex numbers.
   */
  static div(x: Complex | number, y: Complex | number): Complex {
    if (typeof x === "number") x = new Complex(x);
    if (this.isNaN(x)) return this.#complexNaN;
    if (y instanceof Complex && this.isReal(y)) y = y.real;

    if (typeof y === "number") {
      return Number.isNaN(y) ? this.#complexNaN : new Complex(
        x.real / y,
        x.imag / y,
      );
    } else {
      const absSquaredY = this.absSquared(y);

      return new Complex(
        (x.real * y.real + x.imag * y.imag) / absSquaredY,
        (x.imag * y.real - x.real * y.imag) / absSquaredY,
      );
    }
  }

  /**
   * Returns the reciprocal (multiplicative inverse) of a complex number.
   *
   * @param {Complex | number} z A complex number
   *
   * @returns {Complex} The reciprocal of the supplied number.
   */
  static recip(z: Complex | number): Complex {
    if (z instanceof Complex && this.isReal(z)) z = z.real;

    if (typeof z === "number") {
      return Number.isNaN(z) ? this.#complexNaN : new Complex(1 / z);
    } else {
      if (this.isInfinite(z)) return this.zero;
      const absSquaredZ = this.absSquared(z);

      return new Complex(z.real / absSquaredZ, -z.imag / absSquaredZ);
    }
  }

  /**
   * Returns the square of the absolute value of a complex number.
   *
   * @param {Complex | number} z A complex number
   *
   * @returns {Complex} The square of the absolute value of the supplied number.
   */
  static absSquared(z: Complex): number {
    return z.real * z.real + z.imag * z.imag;
  }

  /**
   * Returns the absolute value of a complex number.
   *
   * @param {Complex | number} z A complex number
   *
   * @returns {Complex} The absolute value of the supplied number.
   */
  static abs(z: Complex): number {
    return Math.sqrt(this.absSquared(z));
  }

  /**
   * Returns the argument of a complex number. The range of this function is (-pi, pi].
   *
   * @param {Complex | number} z A complex number
   *
   * @returns {Complex} The square of the absolute value of the supplied number.
   */
  static arg(z: Complex): number {
    return this.isZero(z)
      ? 0
      : z.imag === 0 && z.real > 0
      ? 0
      : z.imag === 0 && z.real < 0
      ? Math.PI
      : Math.sign(z.imag) * Math.acos(z.real / Complex.abs(z));
  }

  /**
   * Returns the conjugate of a complex number.
   *
   * @param {Complex | number} z A complex number
   *
   * @returns {Complex} The conjugate of the supplied number.
   */
  static conj(z: Complex): Complex {
    return new Complex(z.real, -z.imag);
  }

  /**
   * Returns the square root of a complex number.
   *
   * @param {Complex | number} z A complex number
   *
   * @returns {Complex} The square root of the supplied number.
   */
  static sqrt(z: Complex | number): Complex {
    if (typeof z === "number") z = new Complex(z);

    const absZ = this.abs(z);

    return new Complex(
      Math.sqrt((z.real + absZ) / 2),
      (z.imag < 0 ? -1 : 1) * Math.sqrt((-z.real + absZ) / 2),
    );
  }

  /**
   * Returns the cube root of a complex number.
   *
   * @param {Complex | number} z A complex number
   *
   * @returns {Complex} The cube root of the supplied number.
   */
  static cbrt(z: Complex | number): Complex {
    if (typeof z === "number") return new Complex(Math.cbrt(z));
    if (this.isInfinite(z)) return this.#complexInfinity;

    const argZdiv = this.arg(z) / 3;
    const absCbrt = Math.cbrt(this.abs(z));

    return new Complex(
      absCbrt * Math.cos(argZdiv),
      absCbrt * Math.sin(argZdiv),
    );
  }

  /**
   * Returns the natural logarithm of a complex number.
   *
   * @param {Complex | number} z A complex number
   *
   * @returns {Complex} The natural logarithm of the supplied number.
   */
  static ln(z: Complex): Complex {
    return this.isZero(z)
      ? this.#complexNaN
      : new Complex(Math.log(this.absSquared(z)) / 2, this.arg(z));
  }

  /**
   * Returns the base-10 logarithm of a complex number.
   *
   * @param {Complex | number} z A complex number
   *
   * @returns {Complex} The base-10 logarithm of the supplied number.
   */
  static log(z: Complex): Complex {
    return this.div(this.ln(z), Math.LN10);
  }

  /**
   * Returns the base-n logarithm of a complex number.
   *
   * @param {Complex | number} z A complex number
   *
   * @returns {Complex} The base-n logarithm of the supplied number.
   */
  static logn(z: Complex, n: number): Complex {
    return (this.div(this.ln(z), Math.log(n)));
  }

  /**
   * Returns e (Euler's number) raised to the power of a complex number.
   *
   * @param {Complex | number} z A complex number
   *
   * @returns {Complex} E (Euler's number) raised to the power of a complex number.
   */
  static exp(z: Complex | number): Complex {
    if (typeof z === "number") return new Complex(Math.exp(z));

    const expReal = Math.exp(z.real);

    return new Complex(expReal * Math.cos(z.imag), expReal * Math.sin(z.imag));
  }

  /**
   * Returns a complex number raised to the power of another complex number.
   *
   * @param {Complex | number} z A complex number
   *
   * @returns {Complex} The supplied complex number raised to the power the other complex number.
   */
  static pow(z: Complex | number, w: Complex | number): Complex {
    if (typeof z === "number") z = new Complex(z);
    if (typeof w !== "number" && w.imag === 0) w = w.real;

    if (typeof w === "number" && Number.isInteger(w)) {
      // If w is an integer, use exponentiation by squaring.
      return w === 0
        ? new Complex(1, 0)
        : w === 1
        ? z
        : w === -1
        ? this.recip(z)
        : w < 0
        ? this.recip(this.pow(z, -w))
        : w % 2 === 0
        ? this.pow(this.mul(z, z), w / 2)
        : this.mul(z, this.pow(this.mul(z, z), (w - 1) / 2));
    } else if (typeof w === "number") {
      // If w is a real number, use De Moivre's formula.
      const argZw = this.arg(z) * w;
      const absPow = Math.pow(this.abs(z), w);

      return new Complex(
        absPow * Math.cos(argZw),
        absPow * Math.sin(argZw),
      );
    } else {
      return this.mul(
        this.pow(z, w.real),
        this.exp(this.mul(this.ln(z), new Complex(0, w.imag))),
      );
    }
  }

  /**
   * Returns the sine of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The sine of the supplied complex number.
   */
  static sin(z: Complex | number): Complex {
    if (typeof z === "number") return new Complex(Math.sin(z));

    return new Complex(
      Math.sin(z.real) * Math.cosh(z.imag),
      Math.cos(z.real) * Math.sinh(z.imag),
    );
  }

  /**
   * Returns the cosine of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The cosine of the supplied complex number.
   */
  static cos(z: Complex | number): Complex {
    if (typeof z === "number") return new Complex(Math.cos(z));

    return new Complex(
      Math.cos(z.real) * Math.cosh(z.imag),
      -Math.sin(z.real) * Math.sinh(z.imag),
    );
  }

  /**
   * Returns the tangent of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The tangent of the supplied complex number.
   */
  static tan(z: Complex | number): Complex {
    return this.div(this.sin(z), this.cos(z));
  }

  /**
   * Returns the cotangent of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The cotangent of the supplied complex number.
   */
  static cot(z: Complex | number): Complex {
    return this.recip(this.tan(z));
  }

  /**
   * Returns the secant of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The secant of the supplied complex number.
   */
  static sec(z: Complex | number): Complex {
    return this.recip(this.cos(z));
  }

  /**
   * Returns the cosecant of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The cosecant of the supplied complex number.
   */
  static csc(z: Complex | number): Complex {
    return this.recip(this.sin(z));
  }

  /**
   * Returns the arcsine (inverse sine) of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The arcsine of the supplied complex number.
   */
  static asin(z: Complex | number): Complex {
    return this.mul(
      this.negI,
      this.ln(
        this.add(this.sqrt(this.sub(1, this.pow(z, 2))), this.mul(this.i, z)),
      ),
    );
  }

  /**
   * Returns the arccosine (inverse cosine) of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The arccosine of the supplied complex number.
   */
  static acos(z: Complex | number): Complex {
    return this.sub(Math.PI / 2, this.asin(z));
  }

  /**
   * Returns the arctangent (inverse tangent) of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The arctangent of the supplied complex number.
   */
  static atan(z: Complex | number): Complex {
    return this.mul(
      .5,
      this.i,
      this.sub(
        this.ln(this.sub(1, this.mul(this.i, z))),
        this.ln(this.add(1, this.mul(this.i, z))),
      ),
    );
  }

  /**
   * Returns the hyperbolic sine of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The hyperbolic sine of the supplied complex number.
   */
  static sinh(z: Complex | number): Complex {
    if (typeof z === "number") z = new Complex(z);

    return new Complex(
      Math.sinh(z.real) * Math.cos(z.imag),
      Math.cosh(z.real) * Math.sin(z.imag),
    );
  }

  /**
   * Returns the hyperbolic cosine of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The hyperbolic cosine of the supplied complex number.
   */
  static cosh(z: Complex | number): Complex {
    if (typeof z === "number") z = new Complex(z);

    return new Complex(
      Math.cosh(z.real) * Math.cos(z.imag),
      Math.sinh(z.real) * Math.sin(z.imag),
    );
  }

  /**
   * Returns the hyperbolic tangent of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The hyperbolic tangent of the supplied complex number.
   */
  static tanh(z: Complex | number): Complex {
    return this.div(this.sinh(z), this.cosh(z));
  }

  /**
   * Returns the hyperbolic cotangent of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The hyperbolic cotangent of the supplied complex number.
   */
  static coth(z: Complex | number): Complex {
    return this.recip(this.tanh(z));
  }

  /**
   * Returns the hyperbolic secant of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The hyperbolic secant of the supplied complex number.
   */
  static sech(z: Complex | number): Complex {
    return this.recip(this.cosh(z));
  }

  /**
   * Returns the hyperbolic cosecant of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns The hyperbolic cosecant of the supplied complex number.
   */
  static csch(z: Complex | number): Complex {
    return this.recip(this.sinh(z));
  }

  /**
   * Returns the hyperbolic arcsine (inverse hyperbolic sine) of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns {Complex | number} The hyperbolic arcsine (inverse hyperbolic sine) of the supplied complex number.
   */
  static asinh(z: Complex | number): Complex {
    return this.ln(
      this.add(
        this.sqrt(
          this.add(
            this.pow(z, 2),
            1,
          ),
        ),
        z,
      ),
    );
  }

  /**
   * Returns the hyperbolic arccosine (inverse hyperbolic cosine) of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns {Complex | number} The hyperbolic arccosine (inverse hyperbolic cosine) of the supplied complex number.
   */
  static acosh(z: Complex | number): Complex {
    return this.#isInfinity(z) ? this.#complexNaN : this.ln(
      this.add(
        this.mul(
          this.sqrt(this.sub(z, 1)),
          this.sqrt(this.add(z, 1)),
        ),
        z,
      ),
    );
  }

  /**
   * Returns the hyperbolic arctangent (inverse hyperbolic tangent) of a complex number.
   *
   * @param {Complex | number} z A complex number.
   *
   * @returns {Complex | number} The hyperbolic arctangent (inverse hyperbolic tangent) of the supplied complex number.
   */
  static atanh(z: Complex | number): Complex {
    return this.mul(
      .5,
      this.sub(
        this.ln(this.add(1, z)),
        this.ln(this.sub(1, z)),
      ),
    );
  }
}
