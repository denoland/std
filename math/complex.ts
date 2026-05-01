// Copyright 2018-2026 the Deno authors. MIT license.

export class Complex {
  real: number;
  imag: number;

  constructor(real: number, imag?: number) {
    this.real = real;
    this.imag = imag ?? 0;
  }
}

export function add(...nums: Complex[]): Complex {
  let sum = new Complex(0);

  for (const num of nums) {
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

export function sqrt(z: Complex): Complex {
  return new Complex(
    Math.sqrt((z.real + abs(z)) / 2),
    Math.sign(z.imag) * Math.sqrt((-z.real + abs(z)) / 2),
  );
}
