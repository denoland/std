// Copyright 2018-2026 the Deno authors. MIT license.
import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertFalse,
} from "@std/assert";
import { Complex } from "./complex.ts";

function assertAlmostEqualComplex(actual: Complex, expected: Complex) {
  assertAlmostEquals(actual.real, expected.real);
  assertAlmostEquals(actual.imag, expected.imag);
}

Deno.test("Complex", async (t) => {
  const complexZero = new Complex(0);
  const complexOne = new Complex(1);
  const complexNaN = new Complex(NaN);
  const complexInfinity = new Complex(Infinity);

  await t.step("constructor", async (t) => {
    await t.step("Basic", () => {
      assertEquals(complexOne, new Complex(1, 0));
      assertEquals(new Complex(5, 1).imag, 1);
      assertEquals(new Complex(5, 1).real, 5);
    });

    await t.step("NaN", () => {
      assertEquals(new Complex(NaN, 1), complexNaN);
      assertEquals(new Complex(1, NaN), complexNaN);
      assertEquals(new Complex(NaN, NaN), complexNaN);
    });

    await t.step("Infinity", () => {
      assertEquals(new Complex(Infinity, 1), complexInfinity);
      assertEquals(new Complex(1, -Infinity), complexInfinity);
      assertEquals(new Complex(Infinity, -Infinity), complexInfinity);
      assertEquals(new Complex(Infinity, NaN), complexInfinity);
      assertEquals(new Complex(NaN, Infinity), complexInfinity);
    });
  });

  await t.step("isReal()", () => {
    assertFalse(Complex.isReal(new Complex(4, 4)));
    assert(Complex.isReal(new Complex(4)));
    assertFalse(Complex.isReal(new Complex(Infinity)));
    assertFalse(Complex.isReal(new Complex(NaN)));
  });

  await t.step("isImaginary()", () => {
    assertFalse(Complex.isImaginary(new Complex(4, 4)));
    assert(Complex.isImaginary(new Complex(0, 4)));
    assertFalse(Complex.isImaginary(new Complex(0, Infinity)));
    assertFalse(Complex.isImaginary(new Complex(0, NaN)));
  });

  await t.step("isZero()", () => {
    assert(Complex.isZero(new Complex(0, 0)));
    assertFalse(Complex.isZero(new Complex(0, 4)));
    assertFalse(Complex.isZero(new Complex(-1, 4)));
  });

  await t.step("isFinite()", () => {
    assert(Complex.isFinite(new Complex(0, 0)));
    assert(Complex.isFinite(new Complex(0, 4)));
    assertFalse(Complex.isFinite(new Complex(NaN, 4)));
    assertFalse(Complex.isFinite(new Complex(NaN, Infinity)));
    assertFalse(Complex.isFinite(new Complex(8, Infinity)));
  });

  await t.step("isInfinite()", () => {
    assertFalse(Complex.isInfinite(new Complex(0, 0)));
    assertFalse(Complex.isInfinite(new Complex(0, 4)));
    assertFalse(Complex.isInfinite(new Complex(NaN, 4)));
    assert(Complex.isInfinite(new Complex(NaN, Infinity)));
    assert(Complex.isInfinite(new Complex(8, Infinity)));
  });

  await t.step("isNaN()", () => {
    assertFalse(Complex.isNaN(new Complex(0, 0)));
    assertFalse(Complex.isNaN(new Complex(0, 4)));
    assert(Complex.isNaN(new Complex(NaN, 4)));
    assertFalse(Complex.isNaN(new Complex(NaN, Infinity)));
    assertFalse(Complex.isNaN(new Complex(8, Infinity)));
  });

  await t.step("add()", () => {
    assertEquals(
      Complex.add(0, new Complex(3, 2), new Complex(4, 4)),
      new Complex(7, 6),
    );
    assertEquals(
      Complex.add(new Complex(5, 4), new Complex(Infinity, 2)),
      complexInfinity,
    );
    assertEquals(
      Complex.add(new Complex(NaN, 4), new Complex(Infinity, 2)),
      complexInfinity,
    );
    assertEquals(
      Complex.add(new Complex(NaN, 4), new Complex(3, 2)),
      complexNaN,
    );
  });

  await t.step("neg()", () => {
    assertEquals(Complex.neg(new Complex(-1, -2)), new Complex(1, 2));
    assertEquals(Complex.neg(new Complex(0, -2)), new Complex(0, 2));
    assertEquals(Complex.neg(complexZero), complexZero);
    assertEquals(Complex.neg(complexNaN), complexNaN);
    assertEquals(Complex.neg(complexInfinity), complexInfinity);
  });

  await t.step("sub()", () => {
    assertEquals(
      Complex.sub(complexZero, new Complex(3, 2)),
      new Complex(-3, -2),
    );
    assertEquals(
      Complex.sub(new Complex(5, 4), new Complex(Infinity, 2)),
      complexInfinity,
    );
    assertEquals(
      Complex.sub(new Complex(NaN, 4), new Complex(Infinity, 2)),
      complexNaN,
    );
    assertEquals(
      Complex.sub(new Complex(NaN, 4), new Complex(3, 2)),
      complexNaN,
    );
  });

  await t.step("mul()", () => {
    assertEquals(
      Complex.mul(new Complex(3, 2), new Complex(4, 4)),
      new Complex(4, 20),
    );
    assertEquals(
      Complex.mul(Infinity, new Complex(4, 2)),
      complexInfinity,
    );
    assertEquals(
      Complex.mul(complexInfinity, complexZero),
      complexNaN,
    );
    assertEquals(
      Complex.mul(new Complex(NaN, 4), new Complex(Infinity, 2)),
      complexNaN,
    );
    assertEquals(
      Complex.mul(new Complex(NaN, 4), new Complex(3, 2)),
      complexNaN,
    );
  });

  await t.step("div()", () => {
    assertEquals(
      Complex.div(new Complex(4, 20), new Complex(4, 4)),
      new Complex(3, 2),
    );
    assertEquals(
      Complex.div(Infinity, new Complex(4, 2)),
      complexInfinity,
    );
    assertEquals(
      Complex.div(new Complex(4, 2), complexZero),
      complexInfinity,
    );
    assertEquals(
      Complex.div(NaN, Infinity),
      complexNaN,
    );
    assertEquals(
      Complex.div(NaN, new Complex(3, 2)),
      complexNaN,
    );
  });

  await t.step("recip()", () => {
    assertEquals(Complex.recip(new Complex(1, 2)), new Complex(.2, -.4));
    assertEquals(Complex.recip(new Complex(0, -2)), new Complex(0, .5));
    assertEquals(Complex.recip(complexZero), complexInfinity);
    assertEquals(Complex.recip(complexNaN), complexNaN);
    assertEquals(Complex.recip(complexInfinity), complexZero);
  });

  await t.step("absSquared()", () => {
    assertEquals(Complex.absSquared(new Complex(1, 2)), 5);
    assertEquals(Complex.absSquared(new Complex(0, -2)), 4);
    assertEquals(Complex.absSquared(complexZero), 0);
    assertEquals(Complex.absSquared(complexNaN), NaN);
    assertEquals(Complex.absSquared(complexInfinity), Infinity);
  });

  await t.step("abs()", () => {
    assertEquals(Complex.abs(new Complex(1, 2)), Math.sqrt(5));
    assertEquals(Complex.abs(new Complex(0, -2)), 2);
    assertEquals(Complex.abs(complexZero), 0);
    assertEquals(Complex.abs(complexNaN), NaN);
    assertEquals(Complex.abs(complexInfinity), Infinity);
  });

  await t.step("arg()", () => {
    assertAlmostEquals(Complex.arg(new Complex(1, 2)), 1.107148718);
    assertEquals(Complex.arg(new Complex(0, -2)), -Math.PI / 2);
    assertEquals(Complex.arg(complexZero), 0);
    assertEquals(Complex.arg(complexNaN), NaN);
    assertEquals(Complex.arg(complexInfinity), NaN);
  });

  await t.step("conj()", () => {
    assertEquals(Complex.conj(new Complex(1, 2)), new Complex(1, -2));
    assertEquals(Complex.conj(new Complex(0, -2)), new Complex(0, 2));
    assertEquals(Complex.conj(complexZero), complexZero);
    assertEquals(Complex.conj(complexNaN), complexNaN);
    assertEquals(Complex.conj(complexInfinity), complexInfinity);
  });

  await t.step("sqrt()", () => {
    assertAlmostEqualComplex(
      Complex.sqrt(new Complex(1, 2)),
      new Complex(1.27201965, 0.78615138),
    );
    assertEquals(Complex.sqrt(new Complex(0, -2)), new Complex(1, -1));
    assertEquals(Complex.sqrt(complexZero), complexZero);
    assertEquals(Complex.sqrt(complexNaN), complexNaN);
    assertEquals(Complex.sqrt(complexInfinity), complexInfinity);
  });

  await t.step("cbrt()", () => {
    assertAlmostEqualComplex(
      Complex.cbrt(new Complex(1, 2)),
      new Complex(1.21961651, .47171127),
    );
    assertAlmostEqualComplex(
      Complex.cbrt(new Complex(0, -2)),
      new Complex(1.09112364, -.62996052),
    );
    assertEquals(Complex.cbrt(complexZero), complexZero);
    assertEquals(Complex.cbrt(complexNaN), complexNaN);
    assertEquals(Complex.cbrt(complexInfinity), complexInfinity);
  });

  await t.step("ln()", () => {
    assertAlmostEqualComplex(
      Complex.ln(new Complex(1, 2)),
      new Complex(.80471896, 1.10714872),
    );
    assertAlmostEqualComplex(
      Complex.ln(new Complex(0, -2)),
      new Complex(Math.log(2), -Math.PI / 2),
    );
    assertEquals(Complex.ln(complexZero), complexNaN);
    assertEquals(Complex.ln(complexNaN), complexNaN);
    assertEquals(Complex.ln(complexInfinity), complexInfinity);
  });

  await t.step("log()", () => {
    assertAlmostEqualComplex(
      Complex.log(new Complex(1, 2)),
      new Complex(.349485, .48082858),
    );
    assertAlmostEqualComplex(
      Complex.log(new Complex(0, -2)),
      new Complex(.30103, -.68218818),
    );
    assertEquals(Complex.log(complexZero), complexNaN);
    assertEquals(Complex.log(complexNaN), complexNaN);
    assertEquals(Complex.log(complexInfinity), complexInfinity);
  });

  await t.step("logn()", () => {
    assertAlmostEqualComplex(
      Complex.logn(new Complex(1, 2), 3),
      new Complex(.73248676, 1.00777019),
    );
    assertAlmostEqualComplex(
      Complex.logn(new Complex(0, -2), 6),
      new Complex(.38685281, -.87667812),
    );
    for (const base of [2, 3, 4, 5, 6]) {
      assertEquals(Complex.logn(complexZero, base), complexNaN);
      assertEquals(Complex.logn(complexNaN, base), complexNaN);
      assertEquals(Complex.logn(complexInfinity, base), complexInfinity);
    }
  });

  await t.step("exp()", () => {
    assertAlmostEqualComplex(
      Complex.exp(new Complex(1, 2)),
      new Complex(-1.13120438, 2.47172667),
    );
    assertAlmostEqualComplex(
      Complex.exp(new Complex(0, -2)),
      new Complex(-.41614684, -0.90929743),
    );
    assertEquals(Complex.exp(complexZero), complexOne);
    assertEquals(Complex.exp(complexNaN), complexNaN);
    assertEquals(Complex.exp(complexInfinity), complexNaN);
  });

  await t.step("pow()", () => {
    assertAlmostEqualComplex(
      Complex.pow(new Complex(1, 2), new Complex(3, 4)),
      new Complex(.12900959, .03392409),
    );
    assertAlmostEqualComplex(
      Complex.pow(new Complex(0, -2), 4),
      new Complex(16, 0),
    );
    assertAlmostEqualComplex(
      Complex.pow(new Complex(-4, -2), new Complex(6, 2)),
      new Complex(1482797.452, -820807.812),
    );
    assertEquals(Complex.pow(complexZero, complexZero), complexOne);
    assertEquals(Complex.pow(complexNaN, new Complex(2, 3)), complexNaN);
    assertEquals(Complex.pow(complexInfinity, new Complex(4, 5)), complexNaN);
  });

  await t.step("sin()", () => {
    assertAlmostEqualComplex(
      Complex.sin(new Complex(1, 2)),
      new Complex(3.16577851, 1.95960104),
    );
    assertAlmostEqualComplex(
      Complex.sin(new Complex(0, -2)),
      new Complex(0, -3.62686041),
    );
    assertEquals(Complex.sin(complexZero), complexZero);
    assertEquals(Complex.sin(complexNaN), complexNaN);
    assertEquals(Complex.sin(complexInfinity), complexNaN);
  });

  await t.step("cos()", () => {
    assertAlmostEqualComplex(
      Complex.cos(new Complex(1, 2)),
      new Complex(2.03272301, -3.0518978),
    );
    assertAlmostEqualComplex(
      Complex.cos(new Complex(0, -2)),
      new Complex(3.76219569, 0),
    );
    assertEquals(Complex.cos(complexZero), complexOne);
    assertEquals(Complex.cos(complexNaN), complexNaN);
    assertEquals(Complex.cos(complexInfinity), complexNaN);
  });

  await t.step("tan()", () => {
    assertAlmostEqualComplex(
      Complex.tan(new Complex(1, 2)),
      new Complex(0.0338128260, 1.0147936161),
    );
    assertAlmostEqualComplex(
      Complex.tan(new Complex(0, -2)),
      new Complex(0, -0.96402758),
    );
    assertEquals(Complex.tan(complexZero), complexZero);
    assertEquals(Complex.tan(complexNaN), complexNaN);
    assertEquals(Complex.tan(complexInfinity), complexNaN);
  });

  await t.step("cot()", () => {
    assertAlmostEqualComplex(
      Complex.cot(new Complex(1, 2)),
      new Complex(0.0327977555, -0.9843292264),
    );
    assertAlmostEqualComplex(
      Complex.cot(new Complex(0, -2)),
      new Complex(0, 1.03731472),
    );
    assertEquals(Complex.cot(complexZero), complexInfinity);
    assertEquals(Complex.cot(complexNaN), complexNaN);
    assertEquals(Complex.cot(complexInfinity), complexNaN);
  });

  await t.step("sec()", () => {
    assertAlmostEqualComplex(
      Complex.sec(new Complex(1, 2)),
      new Complex(.1511763, .22697368),
    );
    assertAlmostEqualComplex(
      Complex.sec(new Complex(0, -2)),
      new Complex(.26580223),
    );
    assertEquals(Complex.sec(complexZero), complexOne);
    assertEquals(Complex.sec(complexNaN), complexNaN);
    assertEquals(Complex.sec(complexInfinity), complexNaN);
  });

  await t.step("csc()", () => {
    assertAlmostEqualComplex(
      Complex.csc(new Complex(1, 2)),
      new Complex(.2283750655, -.1413630216),
    );
    assertAlmostEqualComplex(
      Complex.csc(new Complex(0, -2)),
      new Complex(0, .2757205647),
    );
    assertEquals(Complex.csc(complexZero), complexInfinity);
    assertEquals(Complex.csc(complexNaN), complexNaN);
    assertEquals(Complex.csc(complexInfinity), complexNaN);
  });

  await t.step("sinh()", () => {
    assertAlmostEqualComplex(
      Complex.sinh(new Complex(1, 2)),
      new Complex(-.48905626, 1.40311925),
    );
    assertAlmostEqualComplex(
      Complex.sinh(new Complex(0, -2)),
      new Complex(0, -.90929743),
    );
    assertEquals(Complex.sinh(complexZero), complexZero);
    assertEquals(Complex.sinh(complexNaN), complexNaN);
    assertEquals(Complex.sinh(complexInfinity), complexNaN);
  });

  await t.step("cosh()", () => {
    assertAlmostEqualComplex(
      Complex.cosh(new Complex(1, 2)),
      new Complex(-.64214812, 1.06860742),
    );
    assertAlmostEqualComplex(
      Complex.cosh(new Complex(0, -2)),
      new Complex(-.41614684, 0),
    );
    assertEquals(Complex.cosh(complexZero), complexOne);
    assertEquals(Complex.cosh(complexNaN), complexNaN);
    assertEquals(Complex.cosh(complexInfinity), complexNaN);
  });

  await t.step("tanh()", () => {
    assertAlmostEqualComplex(
      Complex.tanh(new Complex(1, 2)),
      new Complex(1.16673626, -.2434582),
    );
    assertAlmostEqualComplex(
      Complex.tanh(new Complex(0, -2)),
      new Complex(0, 2.18503986),
    );
    assertEquals(Complex.tanh(complexZero), complexZero);
    assertEquals(Complex.tanh(complexNaN), complexNaN);
    assertEquals(Complex.tanh(complexInfinity), complexNaN);
  });

  await t.step("coth()", () => {
    assertAlmostEqualComplex(
      Complex.coth(new Complex(1, 2)),
      new Complex(.8213298, .17138361),
    );
    assertAlmostEqualComplex(
      Complex.coth(new Complex(0, -2)),
      new Complex(0, -.45765755),
    );
    assertEquals(Complex.coth(complexZero), complexInfinity);
    assertEquals(Complex.coth(complexNaN), complexNaN);
    assertEquals(Complex.coth(complexInfinity), complexNaN);
  });

  await t.step("sech()", () => {
    assertAlmostEqualComplex(
      Complex.sech(new Complex(1, 2)),
      new Complex(-.41314934, -.68752744),
    );
    assertAlmostEqualComplex(
      Complex.sech(new Complex(0, -2)),
      new Complex(-2.40299796),
    );
    assertEquals(Complex.sech(complexZero), complexOne);
    assertEquals(Complex.sech(complexNaN), complexNaN);
    assertEquals(Complex.sech(complexInfinity), complexNaN);
  });

  await t.step("csch()", () => {
    assertAlmostEqualComplex(
      Complex.csch(new Complex(1, 2)),
      new Complex(-.22150093, -.6354938),
    );
    assertAlmostEqualComplex(
      Complex.csch(new Complex(0, -2)),
      new Complex(0, 1.09975017),
    );
    assertEquals(Complex.csch(complexZero), complexInfinity);
    assertEquals(Complex.csch(complexNaN), complexNaN);
    assertEquals(Complex.csch(complexInfinity), complexNaN);
  });
});
