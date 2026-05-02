// Copyright 2018-2026 the Deno authors. MIT license.

export class Complex {
  real: number;
  imag: number;

  constructor(real: number, imag?: number) {
    this.real = real;
    this.imag = imag ?? 0;
  }
}

export const I = new Complex(0, 1);
export const NEGI = new Complex(0, -1);

type Number = Complex | number;

export function add(...nums: (Number)[]): Complex {
  let sum = new Complex(0);

  for (let num of nums) {
    if (typeof num === "number") num = new Complex(num);
    sum = new Complex(sum.real + num.real, sum.imag + num.real);
  }

  return sum;
}

export function sub(x: Number, y: Number): Complex {
  if (typeof x === "number") x = new Complex(x);
  if (typeof y === "number") y = new Complex(y);

  return new Complex(x.real - y.real, x.imag - y.imag);
}

export function mul(...nums: (Number)[]): Complex {
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

export function div(x: Number, y: Number): Complex {
  if (typeof x === "number") x = new Complex(x);
  if (typeof y === "number") y = new Complex(y);

  const absSquaredY = absSquared(y);

  return new Complex(
    (x.real * y.real + x.imag * y.imag) / absSquaredY,
    (x.imag * y.real - x.real * y.imag) / absSquaredY,
  );
}

export function recip(z: Number): Complex {
  if (typeof z === "number") z = new Complex(z);

  const absSquaredZ = absSquared(z);

  return new Complex(
    z.real / absSquaredZ,
    -z.imag / absSquaredZ,
  );
}

export function absSquared(z: Complex): number {
  return z.real * z.real + z.imag * z.imag;
}

export function abs(z: Complex): number {
  return Math.sqrt(absSquared(z));
}

export function arg(z: Complex): number {
  return z.real && z.imag ? 0 : Math.sign(z.imag) * Math.acos(z.real / abs(z));
}

export function conj(z: Complex): Complex {
  return new Complex(z.real, -z.imag);
}

export function sqrt(z: Complex): Complex {
  return new Complex(
    Math.sqrt((z.real + abs(z)) / 2),
    Math.sign(z.imag) * Math.sqrt((-z.real + abs(z)) / 2),
  );
}

export function cbrt(z: Number): Complex {
  if (typeof z === "number") z = new Complex(z);

  // If w is a real number, use de Moivres formula
  const argZ = arg(z);
  const absCbrt = Math.cbrt(abs(z));

  return new Complex(
    absCbrt * Math.cos(argZ / 3),
    absCbrt * Math.sin(argZ / 3),
  );
}

// I know in the Math namespace the natural logarithm is log and not ln, but fuck that
export function ln(z: Complex): Complex {
  return new Complex(Math.log(absSquared(z)) / 2, arg(z));
}

export function log(z: Complex): Complex {
  return (div(ln(z), Math.LN10));
}

export function logn(z: Complex, n: number): Complex {
  return (div(ln(z), Math.log(n)));
}

export function exp(z: Complex): Complex {
  const expReal = Math.exp(z.real);
  return new Complex(expReal * Math.cos(z.imag), expReal * Math.sin(z.imag));
}

export function pow(z: Number, w: Number): Complex {
  if (typeof z === "number") z = new Complex(z);

  if (typeof w === "number" && w % 1 === 0) {
    // If w is an integer, use exponentiation by squaring
    return w === 0
      ? new Complex(1, 0)
      : w === 1
      ? z
      : w === -1
      ? recip(z)
      : w < 0
      ? recip(pow(z, -w))
      : w % 2 === 0
      ? pow(mul(z, z), w / 2)
      : mul(z, pow(mul(z, z), (w - 1) / 2));
  } else if (typeof w === "number") {
    // If w is a real number, use de Moivres formula
    const argZ = arg(z);
    const absPow = Math.pow(abs(z), w);

    return new Complex(
      absPow * Math.cos(argZ * w),
      absPow * Math.sin(argZ * w),
    );
  } else {
    return mul(pow(z, w.real), exp(mul(ln(z), new Complex(0, w.imag))));
  }
}

// Trig!

export function sin(z: Number): Complex {
  if (typeof z === "number") z = new Complex(z);

  return new Complex(
    Math.sin(z.real) * Math.cosh(z.imag),
    Math.cos(z.real) * Math.sinh(z.imag),
  );
}

export function cos(z: Number): Complex {
  if (typeof z === "number") z = new Complex(z);

  return new Complex(
    Math.cos(z.real) * Math.cosh(z.imag),
    -Math.sin(z.real) * Math.sinh(z.imag),
  );
}

export function tan(z: Number): Complex {
  if (typeof z === "number") z = new Complex(z);

  const w = Math.cos(2 * z.imag) + Math.cosh(2 * z.imag);

  return new Complex(
    Math.sin(2 * z.real) / w,
    Math.sinh(2 * z.real) / w,
  );
}

export function cot(z: Number): Complex {
  return div(1, tan(z));
}

export function sec(z: Number): Complex {
  return div(1, cos(z));
}

export function csc(z: Number): Complex {
  return div(1, sin(z));
}

// Inverse trig!
export function asin(z: Number): Complex {
  return mul(NEGI, ln(add(sqrt(sub(1, pow(z, 2))), mul(I, z))));
}

export function acos(z: Number): Complex {
  return sub(Math.PI / 2, asin(z));
}

export function atan(z: Number): Complex {
  return asin(div(z, sqrt(sub(1, pow(z, 2)))));
}

export function acot(z: Number): Complex {
  return atan(div(1, z));
}

export function asec(z: Number): Complex {
  return acos(div(1, z));
}

export function acsc(z: Number): Complex {
  return asin(div(1, z));
}

// Hypertrig!
export function sinh(z: Number): Complex {
  if (typeof z === "number") z = new Complex(z);

  return new Complex(
    Math.sinh(z.real) * Math.cos(z.imag),
    Math.cosh(z.real) * Math.sin(z.imag),
  );
}

export function cosh(z: Number): Complex {
  if (typeof z === "number") z = new Complex(z);

  return new Complex(
    Math.cosh(z.real) * Math.cos(z.imag),
    Math.sinh(z.real) * Math.sin(z.imag),
  );
}

export function tanh(z: Number): Complex {
  return div(sinh(z), cosh(z));
}

export function coth(z: Number): Complex {
  return div(cosh(z), sinh(z));
}

export function sech(z: Number): Complex {
  return recip(cosh(z));
}

export function csch(z: Number): Complex {
  return recip(sinh(z));
}

// Inverse hyprtrig!
export function asinh(z: Number): Complex {
  return ln(add(sqrt(add(pow(z, 2), 1)), z));
}

export function acosh(z: Number): Complex {
  return ln(add(sqrt(sub(pow(z, 2), 1)), z));
}

export function atanh(z: Number): Complex {
  return div(ln(div(add(1, z), sub(1, z))), 2);
}

export function acoth(z: Number): Complex {
  return atanh(recip(z));
}

export function asech(z: Number): Complex {
  return acosh(recip(z));
}

export function acsch(z: Number): Complex {
  return asinh(recip(z));
}
