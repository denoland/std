// Copyright 2018-2026 the Deno authors. MIT license.
import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertFalse,
} from "@std/assert";
import { Complex } from "./complex.ts";

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
    assertEquals(
      Complex.sqrt(new Complex(1, 2)),
      new Complex(
        Math.sqrt((1 + Math.sqrt(5)) / 2),
        Math.sqrt((-1 + Math.sqrt(5)) / 2),
      ),
    );
    assertEquals(Complex.sqrt(new Complex(0, -2)), new Complex(1, -1));
    assertEquals(Complex.sqrt(complexZero), complexZero);
    assertEquals(Complex.sqrt(complexNaN), complexNaN);
    assertEquals(Complex.sqrt(complexInfinity), complexInfinity);
  });

  await t.step("cbrt()", () => {
    const cbrt1 = Complex.cbrt(new Complex(1, 2));
    assertAlmostEquals(cbrt1.real, 1.21961651);
    assertAlmostEquals(cbrt1.imag, .47171127);
    const cbrt2 = Complex.cbrt(new Complex(0, -2));
    assertAlmostEquals(cbrt2.real, 1.09112364);
    assertAlmostEquals(cbrt2.imag, -.62996052);
    assertEquals(Complex.cbrt(complexZero), complexZero);
    assertEquals(Complex.cbrt(complexNaN), complexNaN);
    assertEquals(Complex.cbrt(complexInfinity), complexInfinity);
  });

  await t.step("ln()", () => {
    const ln1 = Complex.ln(new Complex(1, 2));
    assertAlmostEquals(ln1.real, .80471896);
    assertAlmostEquals(ln1.imag, 1.10714872);
    const ln2 = Complex.ln(new Complex(0, -2));
    assertAlmostEquals(ln2.real, Math.log(2));
    assertAlmostEquals(ln2.imag, -Math.PI / 2);
    assertEquals(Complex.ln(complexZero), complexNaN);
    assertEquals(Complex.ln(complexNaN), complexNaN);
    assertEquals(Complex.ln(complexInfinity), complexInfinity);
  });

  await t.step("log()", () => {
    const log1 = Complex.log(new Complex(1, 2));
    assertAlmostEquals(log1.real, .349485);
    assertAlmostEquals(log1.imag, .48082858);
    const log2 = Complex.log(new Complex(0, -2));
    assertAlmostEquals(log2.real, .30103);
    assertAlmostEquals(log2.imag, -.68218818);
    assertEquals(Complex.log(complexZero), complexNaN);
    assertEquals(Complex.log(complexNaN), complexNaN);
    assertEquals(Complex.log(complexInfinity), complexInfinity);
  });

  await t.step("logn()", () => {
    const log1 = Complex.logn(new Complex(1, 2), 3);
    assertAlmostEquals(log1.real, .73248676);
    assertAlmostEquals(log1.imag, 1.00777019);
    const log2 = Complex.logn(new Complex(0, -2), 6);
    assertAlmostEquals(log2.real, .38685281);
    assertAlmostEquals(log2.imag, -.87667812);
    for (const base of [2, 3, 4, 5, 6]) {
      assertEquals(Complex.logn(complexZero, base), complexNaN);
      assertEquals(Complex.logn(complexNaN, base), complexNaN);
      assertEquals(Complex.logn(complexInfinity, base), complexInfinity);
    }
  });

  await t.step("exp()", () => {
    const exp1 = Complex.exp(new Complex(1, 2));
    assertAlmostEquals(exp1.real, -1.13120438);
    assertAlmostEquals(exp1.imag, 2.47172667);
    const exp2 = Complex.exp(new Complex(0, -2));
    assertAlmostEquals(exp2.real, -.41614684);
    assertAlmostEquals(exp2.imag, -0.90929743);
    assertEquals(Complex.exp(complexZero), complexOne);
    assertEquals(Complex.exp(complexNaN), complexNaN);
    assertEquals(Complex.exp(complexInfinity), complexNaN);
  });

  await t.step("pow()", () => {
    const pow1 = Complex.pow(new Complex(1, 2), new Complex(3, 4));
    assertAlmostEquals(pow1.real, .12900959);
    assertAlmostEquals(pow1.imag, .03392409);
    const pow2 = Complex.pow(new Complex(0, -2), 4);
    assertAlmostEquals(pow2.real, 16);
    assertAlmostEquals(pow2.imag, 0);
    const pow3 = Complex.pow(new Complex(-4, -2), new Complex(6, 2));
    assertAlmostEquals(pow3.real, 1482797.452);
    assertAlmostEquals(pow3.imag, -820807.812);
    assertEquals(Complex.pow(complexZero, complexZero), complexOne);
    assertEquals(Complex.pow(complexNaN, new Complex(2, 3)), complexNaN);
    assertEquals(Complex.pow(complexInfinity, new Complex(4, 5)), complexNaN);
  });

  await t.step("sin()", () => {
    const sin1 = Complex.sin(new Complex(1, 2));
    assertAlmostEquals(sin1.real, 3.16577851);
    assertAlmostEquals(sin1.imag, 1.95960104);
    const sin2 = Complex.sin(new Complex(0, -2));
    assertAlmostEquals(sin2.real, 0);
    assertAlmostEquals(sin2.imag, -3.62686041);
    assertEquals(Complex.sin(complexZero), complexZero);
    assertEquals(Complex.sin(complexNaN), complexNaN);
    assertEquals(Complex.sin(complexInfinity), complexNaN);
  });

  await t.step("cos()", () => {
    const cos1 = Complex.cos(new Complex(1, 2));
    assertAlmostEquals(cos1.real, 2.03272301);
    assertAlmostEquals(cos1.imag, -3.0518978);
    const cos2 = Complex.cos(new Complex(0, -2));
    assertAlmostEquals(cos2.real, 3.76219569);
    assertAlmostEquals(cos2.imag, 0);
    assertEquals(Complex.cos(complexZero), complexOne);
    assertEquals(Complex.cos(complexNaN), complexNaN);
    assertEquals(Complex.cos(complexInfinity), complexNaN);
  });
});
