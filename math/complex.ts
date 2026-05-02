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

export function add(...nums: (Complex | number)[]): Complex {
  let sum = new Complex(0);

  for (let num of nums) {
    if (typeof num === "number") num = new Complex(num)
    sum = new Complex(sum.real + num.real, sum.imag + num.real);
  }

  return sum;
}

export function sub(x: Complex, y: Complex): Complex {
  return new Complex(x.real - y.real, x.imag - y.imag);
}

export function mul(...nums: Complex[]): Complex {
  let prod = new Complex(1);

  for (const num of nums) {
    prod = new Complex(
      prod.real * num.real - prod.imag * num.imag,
      prod.real * num.imag + prod.imag * num.real,
    );
  }

  return prod;
}

export function div(x: Complex, y: Complex): Complex {
  const absSquaredY = absSquared(y);

  return new Complex(
    (x.real * y.real + x.imag * y.imag) / absSquaredY,
    (x.imag * y.real - x.real * y.imag) / absSquaredY,
  );
}

export function recip(z: Complex): Complex {
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

export function ln(z: Complex): Complex {
  return new Complex(Math.log(absSquared(z)) / 2, arg(z));
}

export function exp(z: Complex): Complex {
  const expReal = Math.exp(z.real);
  return new Complex(expReal * Math.cos(z.imag), expReal * Math.sin(z.imag));
}

export function pow(z: Complex | number, w: Complex | number): Complex {
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
