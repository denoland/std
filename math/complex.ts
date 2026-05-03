// Copyright 2018-2026 the Deno authors. MIT license.

export class Complex {
  real: number;
  imag: number;

  /**
   * Create a new complex number
   */
  constructor(real: number, imag?: number) {
    this.real = real;
    this.imag = imag ?? 0;
  }

  /** i, the imaginary unit */
  static i = new Complex(0, 1);
  /** -i, the negative of the imaginary unit */
  static negI = new Complex(0, -1);

  /**
   * Returns the sum of the supplied complex numbers
   *
   * @param {(Complex | number)[]} nums The complex numbers to sum
   *
   * @returns {Complex} The sum of the supplied complex numbers
   */
  static add(...nums: (Complex | number)[]): Complex {
    let sum = new Complex(0);

    for (let num of nums) {
      if (typeof num === "number") num = new Complex(num);
      sum = new Complex(sum.real + num.real, sum.imag + num.real);
    }

    return sum;
  }

  /**
   * Subtracts one complex number from another
   */
  static sub(x: Complex | number, y: Complex | number): Complex {
    if (typeof x === "number") x = new Complex(x);
    if (typeof y === "number") y = new Complex(y);

    return new Complex(x.real - y.real, x.imag - y.imag);
  }

  /**
   * Returns the product of the supplied complex numbers
   *
   * @param {(Complex | number)[]} nums The complex numbers to sum
   *
   * @returns {Complex} The product of the supplied complex numbers
   */
  static mul(...nums: (Complex | number)[]): Complex {
    let prod = new Complex(1);

    for (let num of nums) {
      if (typeof num === "number") num = new Complex(num);
      prod = new Complex(
        prod.real * num.real - prod.imag * num.imag,
        prod.real * num.imag + prod.imag * num.real,
      );
    }

    return prod;
  }

  /** Returns the ratio of two complex numbers (divides one complex number by another). */
  static div(x: Complex | number, y: Complex | number): Complex {
    if (typeof x === "number") x = new Complex(x);
    if (typeof y === "number") y = new Complex(y);

    const absSquaredY = Complex.absSquared(y);

    return new Complex(
      (x.real * y.real + x.imag * y.imag) / absSquaredY,
      (x.imag * y.real - x.real * y.imag) / absSquaredY,
    );
  }

  /** Returns the reciprocal (multiplicative inverse) of a complex number. */
  static recip(z: Complex | number): Complex {
    if (typeof z === "number") z = new Complex(z);

    const absSquaredZ = this.absSquared(z);

    return new Complex(
      z.real / absSquaredZ,
      -z.imag / absSquaredZ,
    );
  }

  /** Returns the square of the absolute value of a complex number. */
  static absSquared(z: Complex): number {
    return z.real * z.real + z.imag * z.imag;
  }

  /** Returns the absolute value of a complex number (the distance from the complex number to the origin on the complex plane). */
  static abs(z: Complex): number {
    return Math.sqrt(this.absSquared(z));
  }

  /** Returns the argument of a complex number with a domain of [pi, -pi). */
  static arg(z: Complex): number {
    return z.real === 0 && z.imag === 0
      ? 0
      : Math.sign(z.imag) * Math.acos(z.real / Complex.abs(z));
  }

  /** Returns the conjugate of a complex number (the complex number with its imaginary part negated). */
  static conj(z: Complex): Complex {
    return new Complex(z.real, -z.imag);
  }

  /** Returns the square root of a complex number. */
  static sqrt(z: Complex): Complex {
    return new Complex(
      Math.sqrt((z.real + this.abs(z)) / 2),
      Math.sign(z.imag) * Math.sqrt((-z.real + this.abs(z)) / 2),
    );
  }

  /** Returns the cube root of a complex number. */
  static cbrt(z: Complex | number): Complex {
    if (typeof z === "number") z = new Complex(z);

    const argZ = this.arg(z);
    const absCbrt = Math.cbrt(Complex.abs(z));

    return new Complex(
      absCbrt * Math.cos(argZ / 3),
      absCbrt * Math.sin(argZ / 3),
    );
  }

  // I know in the Math namespace the natural logarithm is log and not ln, but fuck that
  /** Returns the natural logarithm of a complex number. */
  static ln(z: Complex): Complex {
    return new Complex(Math.log(this.absSquared(z)) / 2, this.arg(z));
  }

  /** Returns the base-10 logarithm of a complex number. */
  static log(z: Complex): Complex {
    return (this.div(this.ln(z), Math.LN10));
  }

  /** Returns the base-n logarithm of a complex number. */
  static logn(z: Complex, n: number): Complex {
    return (this.div(this.ln(z), Math.log(n)));
  }

  /** Returns the e (Euler's number) raised to the power of a complex number. */
  static exp(z: Complex | number): Complex {
    if (typeof z === "number") z = new Complex(z);

    const expReal = Math.exp(z.real);

    return new Complex(expReal * Math.cos(z.imag), expReal * Math.sin(z.imag));
  }

  /** Returns a complex number raised to the power of another complex number. */
  static pow(z: Complex | number, w: Complex | number): Complex {
    if (typeof z === "number") z = new Complex(z);

    if (typeof w === "number" && w % 1 === 0) {
      // If w is an integer, use exponentiation by squaring
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
      // If w is a real number, use de Moivres formula
      const argZ = Complex.arg(z);
      const absPow = Math.pow(Complex.abs(z), w);

      return new Complex(
        absPow * Math.cos(argZ * w),
        absPow * Math.sin(argZ * w),
      );
    } else {
      return Complex.mul(
        Complex.pow(z, w.real),
        Complex.exp(Complex.mul(Complex.ln(z), new Complex(0, w.imag))),
      );
    }
  }

  /** Returns the sine of a complex number. */
  static sin(z: Complex | number): Complex {
    if (typeof z === "number") z = new Complex(z);

    return new Complex(
      Math.sin(z.real) * Math.cosh(z.imag),
      Math.cos(z.real) * Math.sinh(z.imag),
    );
  }

  /** Returns the cosine of a complex number. */
  static cos(z: Complex | number): Complex {
    if (typeof z === "number") z = new Complex(z);

    return new Complex(
      Math.cos(z.real) * Math.cosh(z.imag),
      -Math.sin(z.real) * Math.sinh(z.imag),
    );
  }

  /** Returns the tangent of a complex number. */
  static tan(z: Complex | number): Complex {
    if (typeof z === "number") z = new Complex(z);

    const w = Math.cos(2 * z.imag) + Math.cosh(2 * z.imag);

    return new Complex(
      Math.sin(2 * z.real) / w,
      Math.sinh(2 * z.real) / w,
    );
  }

  /** Returns the cotangent of a complex number. */
  static cot(z: Complex | number): Complex {
    return this.div(1, this.tan(z));
  }

  /** Returns the secant of a complex number. */
  static sec(z: Complex | number): Complex {
    return this.div(1, this.cos(z));
  }

  /** Returns the cosecant of a complex number. */
  static csc(z: Complex | number): Complex {
    return this.div(1, this.sin(z));
  }

  /** Returns the arcsine (inverse sine) of a complex number. */
  static asin(z: Complex | number): Complex {
    return Complex.mul(
      this.negI,
      this.ln(
        this.add(
          this.sqrt(this.sub(1, this.pow(z, 2))),
          this.mul(this.i, z),
        ),
      ),
    );
  }

  /** Returns the arccosine (inverse cosine) of a complex number. */
  static acos(z: Complex | number): Complex {
    return this.sub(Math.PI / 2, this.asin(z));
  }

  /** Returns the arctangent (inverse tangent) of a complex number. */
  static atan(z: Complex | number): Complex {
    return this.asin(this.div(z, this.sqrt(this.sub(1, this.pow(z, 2)))));
  }

  /** Returns the arccotangent (inverse cotangent) of a complex number. */
  static acot(z: Complex | number): Complex {
    return this.atan(this.recip(z));
  }

  /** Returns the arcsecant (inverse secant) of a complex number. */
  static asec(z: Complex | number): Complex {
    return this.acos(this.recip(z));
  }

  /** Returns the arccosecant (inverse cosecant) of a complex number. */
  static acsc(z: Complex | number): Complex {
    return this.asin(this.recip(z));
  }

  /** Returns the hyperbolic sine of a complex number. */
  static sinh(z: Complex | number): Complex {
    if (typeof z === "number") z = new Complex(z);

    return new Complex(
      Math.sinh(z.real) * Math.cos(z.imag),
      Math.cosh(z.real) * Math.sin(z.imag),
    );
  }

  /** Returns the hyperbolic cosine of a complex number. */
  static cosh(z: Complex | number): Complex {
    if (typeof z === "number") z = new Complex(z);

    return new Complex(
      Math.cosh(z.real) * Math.cos(z.imag),
      Math.sinh(z.real) * Math.sin(z.imag),
    );
  }

  /** Returns the hyperbolic tangent of a complex number. */
  static tanh(z: Complex | number): Complex {
    return this.div(this.sinh(z), this.cosh(z));
  }

  /** Returns the hyperbolic cotangent of a complex number. */
  static coth(z: Complex | number): Complex {
    return this.div(this.cosh(z), this.sinh(z));
  }

  /** Returns the hyperbolic secant of a complex number. */
  static sech(z: Complex | number): Complex {
    return this.recip(this.cosh(z));
  }

  /** Returns the hyperbolic cosecant of a complex number. */
  static csch(z: Complex | number): Complex {
    return this.recip(this.sinh(z));
  }

  /** Returns the hyperbolic arcsine (inverse hyperbolic sine) of a complex number. */
  static asinh(z: Complex | number): Complex {
    return this.ln(this.add(this.sqrt(this.add(this.pow(z, 2), 1)), z));
  }

  /** Returns the hyperbolic arccosine (inverse hyperbolic cosine) of a complex number. */
  static acosh(z: Complex | number): Complex {
    return this.ln(this.add(this.sqrt(this.sub(this.pow(z, 2), 1)), z));
  }

  /** Returns the hyperbolic arctangent (inverse hyperbolic tangent) of a complex number. */
  static atanh(z: Complex | number): Complex {
    return this.div(this.ln(this.div(this.add(1, z), this.sub(1, z))), 2);
  }

  /** Returns the hyperbolic arccotangent (inverse hyperbolic cotangent) of a complex number. */
  static acoth(z: Complex | number): Complex {
    return this.atanh(this.recip(z));
  }

  /** Returns the hyperbolic arcsecant (inverse hyperbolic secant) of a complex number. */
  static asech(z: Complex | number): Complex {
    return this.acosh(this.recip(z));
  }

  /** Returns the hyperbolic arccosecant (inverse hyperbolic cosecant) of a complex number. */
  static acsch(z: Complex | number): Complex {
    return this.asinh(this.recip(z));
  }
}
