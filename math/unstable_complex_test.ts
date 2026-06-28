// Copyright 2018-2026 the Deno authors. MIT license.
import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertFalse,
} from "@std/assert";
import { Complex } from "./unstable_complex.ts";

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

  await t.step("Utility functions", async (t) => {
    await t.step("isReal()", () => {
      assertFalse(new Complex(4, 4).isReal());
      assert(new Complex(4).isReal());
      assertFalse(complexInfinity.isReal());
      assertFalse(complexNaN.isReal());
    });

    await t.step("isImaginary()", () => {
      assertFalse(new Complex(4, 4).isImaginary());
      assert(new Complex(0, 4).isImaginary());
      assertFalse(complexInfinity.isImaginary());
      assertFalse(complexNaN.isImaginary());
    });

    await t.step("isZero()", () => {
      assert(new Complex(0, 0).isReal());
      assertFalse(new Complex(0, 4).isReal());
      assertFalse(new Complex(-1, 4).isReal());
    });

    await t.step("isFinite()", () => {
      assert(new Complex(0, 0).isFinite());
      assert(new Complex(0, 4).isFinite());
      assertFalse(new Complex(NaN, 4).isFinite());
      assertFalse(new Complex(NaN, Infinity).isFinite());
      assertFalse(new Complex(8, Infinity).isFinite());
    });

    await t.step("isInfinite()", () => {
      assertFalse(new Complex(0, 0).isInfinite());
      assertFalse(new Complex(0, 4).isInfinite());
      assertFalse(new Complex(NaN, 4).isInfinite());
      assert(new Complex(NaN, Infinity).isInfinite());
      assert(new Complex(8, Infinity).isInfinite());
    });

    await t.step("isNaN()", () => {
      assertFalse(new Complex(0, 0).isNaN());
      assertFalse(new Complex(0, 4).isNaN());
      assert(new Complex(NaN, 4).isNaN());
      assertFalse(new Complex(NaN, Infinity).isNaN());
      assertFalse(new Complex(8, Infinity).isNaN());
    });
  });

  await t.step("Basic arithmetic", async (t) => {
    await t.step("add()", () => {
      assertEquals(
        new Complex(3, 2).add(0).add(new Complex(4, 4)),
        new Complex(7, 6),
      );
      assertEquals(
        new Complex(5, 4).add(new Complex(Infinity, 2)),
        complexInfinity,
      );
      assertEquals(
        new Complex(NaN, 4).add(new Complex(Infinity, 2)),
        complexInfinity,
      );
      assertEquals(
        new Complex(NaN, 4).add(new Complex(3, 2)),
        complexNaN,
      );
    });

    await t.step("neg()", () => {
      assertEquals(new Complex(-1, -2).neg(), new Complex(1, 2));
      assertEquals(new Complex(0, -2).neg(), new Complex(0, 2));
      assertEquals(complexZero.neg(), complexZero);
      assertEquals(complexNaN.neg(), complexNaN);
      assertEquals(complexInfinity.neg(), complexInfinity);
    });

    await t.step("sub()", () => {
      assertEquals(
        complexZero.sub(new Complex(3, 2)),
        new Complex(-3, -2),
      );
      assertEquals(
        new Complex(5, 4).sub(new Complex(Infinity, 2)),
        complexInfinity,
      );
      assertEquals(
        new Complex(NaN, 4).sub(new Complex(Infinity, 2)),
        complexNaN,
      );
      assertEquals(
        new Complex(NaN, 4).sub(new Complex(3, 2)),
        complexNaN,
      );
    });

    await t.step("mul()", () => {
      assertEquals(
        new Complex(3, 2).mul(new Complex(4, 4)),
        new Complex(4, 20),
      );
      assertEquals(
        new Complex(Infinity).sub(new Complex(4, 2)),
        complexInfinity,
      );
      assertEquals(
        complexInfinity.mul(complexZero),
        complexNaN,
      );
      assertEquals(
        new Complex(NaN, 4).sub(new Complex(Infinity, 2)),
        complexNaN,
      );
      assertEquals(
        new Complex(NaN, 4).sub(new Complex(3, 2)),
        complexNaN,
      );
    });

    await t.step("div()", () => {
      assertEquals(
        new Complex(4, 20).div(new Complex(4, 4)),
        new Complex(3, 2),
      );
      assertEquals(
        complexInfinity.div(new Complex(4, 2)),
        complexInfinity,
      );
      assertEquals(
        new Complex(4, 2).div(complexZero),
        complexInfinity,
      );
      assertEquals(
        complexNaN.div(Infinity),
        complexNaN,
      );
      assertEquals(
        complexNaN.div(new Complex(3, 2)),
        complexNaN,
      );
    });
  });

  await t.step("Basic complex functions", async (t) => {
    await t.step("recip()", () => {
      assertEquals(new Complex(1, 2).recip(), new Complex(.2, -.4));
      assertEquals(new Complex(0, -2).recip(), new Complex(0, .5));
      assertEquals(complexZero.recip(), complexInfinity);
      assertEquals(complexNaN.recip(), complexNaN);
      assertEquals(complexInfinity.recip(), complexZero);
    });

    await t.step("absSquared()", () => {
      assertEquals(new Complex(1, 2).absSquared(), 5);
      assertEquals(new Complex(0, -2).absSquared(), 4);
      assertEquals(complexZero.absSquared(), 0);
      assertEquals(complexNaN.absSquared(), NaN);
      assertEquals(complexInfinity.absSquared(), Infinity);
    });

    await t.step("abs()", () => {
      assertEquals(new Complex(1, 2).abs(), Math.sqrt(5));
      assertEquals(new Complex(0, -2).abs(), 2);
      assertEquals(complexZero.abs(), 0);
      assertEquals(complexNaN.abs(), NaN);
      assertEquals(complexInfinity.abs(), Infinity);
    });

    await t.step("arg()", () => {
      assertAlmostEquals(new Complex(1, 2).arg(), 1.107148718);
      assertEquals(new Complex(0, -2).arg(), -Math.PI / 2);
      assertEquals(complexZero.arg(), 0);
      assertEquals(complexNaN.arg(), NaN);
      assertEquals(complexInfinity.arg(), NaN);
    });

    await t.step("conj()", () => {
      assertEquals(new Complex(1, 2).conj(), new Complex(1, -2));
      assertEquals(new Complex(0, -2).conj(), new Complex(0, 2));
      assertEquals(complexZero.conj(), complexZero);
      assertEquals(complexNaN.conj(), complexNaN);
      assertEquals(complexInfinity.conj(), complexInfinity);
    });
  });

  await t.step("Nonbasic arithmetic", async (t) => {
    await t.step("sqrt()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).sqrt(),
        new Complex(1.27201965, 0.78615138),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).sqrt(),
        new Complex(.78615138, 1.27201965),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).sqrt(),
        new Complex(1.27201965, -.78615138),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).sqrt(),
        new Complex(.78615138, -1.27201965),
      );
      assertEquals(complexZero.sqrt(), complexZero);
      assertEquals(complexNaN.sqrt(), complexNaN);
      assertEquals(complexInfinity.sqrt(), complexInfinity);
    });

    await t.step("cbrt()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).cbrt(),
        new Complex(1.21961651, .47171127),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).cbrt(),
        new Complex(1.0183222, .82036324),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).cbrt(),
        new Complex(1.21961651, -.47171127),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).cbrt(),
        new Complex(1.0183222, -.82036324),
      );
      assertEquals(complexZero.cbrt(), complexZero);
      assertEquals(complexNaN.cbrt(), complexNaN);
      assertEquals(complexInfinity.cbrt(), complexInfinity);
    });

    await t.step("ln()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).ln(),
        new Complex(.80471896, 1.10714872),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).ln(),
        new Complex(.80471896, 2.03444394),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).ln(),
        new Complex(.80471896, -1.10714872),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).ln(),
        new Complex(.80471896, -2.03444394),
      );
      assertEquals(complexZero.ln(), complexNaN);
      assertEquals(complexNaN.ln(), complexNaN);
      assertEquals(complexInfinity.ln(), complexInfinity);
    });

    await t.step("log()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).log(),
        new Complex(.349485, .48082858),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).log(),
        new Complex(.349485, .88354778),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).log(),
        new Complex(.349485, -.48082858),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).log(),
        new Complex(.349485, -.88354778),
      );
      assertEquals(complexZero.log(), complexNaN);
      assertEquals(complexNaN.log(), complexNaN);
      assertEquals(complexInfinity.log(), complexInfinity);
    });

    await t.step("logn()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).logn(2),
        new Complex(1.16096405, 1.59727796),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).logn(3),
        new Complex(.73248676, 1.85183067),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).logn(4),
        new Complex(.58048202, -.79863898),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).logn(5),
        new Complex(.5, -1.26407109),
      );
      for (const base of [2, 3, 4, 5, 6]) {
        assertEquals(complexZero.logn(base), complexNaN);
        assertEquals(complexNaN.logn(base), complexNaN);
        assertEquals(complexInfinity.logn(base), complexInfinity);
      }
    });

    await t.step("exp()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).exp(),
        new Complex(-1.13120438, 2.47172667),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).exp(),
        new Complex(-.15309187, .33451183),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).exp(),
        new Complex(-1.13120438, -2.47172667),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).exp(),
        new Complex(-.15309187, -.33451183),
      );
      assertEquals(complexZero.exp(), complexOne);
      assertEquals(complexNaN.exp(), complexNaN);
      assertEquals(complexInfinity.exp(), complexNaN);
    });

    await t.step("pow()", () => {
      const w = new Complex(3, 4);
      assertAlmostEqualComplex(
        new Complex(1, 2).pow(w),
        new Complex(.12900959, .03392409),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).pow(w),
        new Complex(-.0032506884, .0003345984),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).pow(w),
        new Complex(932.139195, -95.9465337),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).pow(w),
        new Complex(-36993.6705, -9727.77819),
      );
      assertEquals(complexZero.pow(complexZero), complexOne);
      assertEquals(complexNaN.pow(new Complex(2, 3)), complexNaN);
      assertEquals(complexInfinity.pow(new Complex(4, 5)), complexNaN);
    });
  });

  await t.step("Trigonometric functions", async (t) => {
    await t.step("sin()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).sin(),
        new Complex(3.16577851, 1.95960104),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).sin(),
        new Complex(-3.16577851, 1.95960104),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).sin(),
        new Complex(3.16577851, -1.95960104),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).sin(),
        new Complex(-3.16577851, -1.95960104),
      );
      assertEquals(complexZero.sin(), complexZero);
      assertEquals(complexNaN.sin(), complexNaN);
      assertEquals(complexInfinity.sin(), complexNaN);
    });

    await t.step("cos()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).cos(),
        new Complex(2.03272301, -3.0518978),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).cos(),
        new Complex(2.03272301, 3.0518978),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).cos(),
        new Complex(2.03272301, 3.0518978),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).cos(),
        new Complex(2.03272301, -3.0518978),
      );
      assertEquals(complexZero.cos(), complexOne);
      assertEquals(complexNaN.cos(), complexNaN);
      assertEquals(complexInfinity.cos(), complexNaN);
    });

    await t.step("tan()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).tan(),
        new Complex(.0338128260, 1.0147936161),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).tan(),
        new Complex(-.0338128260, 1.0147936161),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).tan(),
        new Complex(.0338128260, -1.0147936161),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).tan(),
        new Complex(-.0338128260, -1.0147936161),
      );
      assertEquals(complexZero.tan(), complexZero);
      assertEquals(complexNaN.tan(), complexNaN);
      assertEquals(complexInfinity.tan(), complexNaN);
    });

    await t.step("cot()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).cot(),
        new Complex(0.0327977555, -0.984329226),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).cot(),
        new Complex(-0.0327977555, -0.984329226),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).cot(),
        new Complex(0.0327977555, 0.984329226),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).cot(),
        new Complex(-0.0327977555, 0.984329226),
      );
      assertEquals(complexZero.cot(), complexInfinity);
      assertEquals(complexNaN.cot(), complexNaN);
      assertEquals(complexInfinity.cot(), complexNaN);
    });

    await t.step("sec()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).sec(),
        new Complex(.1511762982, .2269736753),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).sec(),
        new Complex(.1511762982, -.2269736753),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).sec(),
        new Complex(.1511762982, -.2269736753),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).sec(),
        new Complex(.1511762982, .2269736753),
      );
      assertEquals(complexZero.sec(), complexOne);
      assertEquals(complexNaN.sec(), complexNaN);
      assertEquals(complexInfinity.sec(), complexNaN);
    });

    await t.step("csc()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).csc(),
        new Complex(.2283750655, -.1413630216),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).csc(),
        new Complex(-.2283750655, -.1413630216),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).csc(),
        new Complex(.2283750655, .1413630216),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).csc(),
        new Complex(-.2283750655, .1413630216),
      );
      assertEquals(complexZero.csc(), complexInfinity);
      assertEquals(complexNaN.csc(), complexNaN);
      assertEquals(complexInfinity.csc(), complexNaN);
    });
  });

  await t.step("Hyperbolic trigonometric functions", async (t) => {
    await t.step("sinh()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).sinh(),
        new Complex(-.48905626, 1.40311925),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).sinh(),
        new Complex(0.48905626, 1.40311925),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).sinh(),
        new Complex(-.48905626, -1.40311925),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).sinh(),
        new Complex(.48905626, -1.40311925),
      );
      assertEquals(complexZero.sinh(), complexZero);
      assertEquals(complexNaN.sinh(), complexNaN);
      assertEquals(complexInfinity.sinh(), complexNaN);
    });

    await t.step("cosh()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).cosh(),
        new Complex(-.64214812, 1.06860742),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).cosh(),
        new Complex(-.64214812, -1.06860742),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).cosh(),
        new Complex(-.64214812, -1.06860742),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).cosh(),
        new Complex(-.64214812, 1.06860742),
      );
      assertEquals(complexZero.cosh(), complexOne);
      assertEquals(complexNaN.cosh(), complexNaN);
      assertEquals(complexInfinity.cosh(), complexNaN);
    });

    await t.step("tanh()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).tanh(),
        new Complex(1.1667362572, -.2434582011),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).tanh(),
        new Complex(-1.1667362572, -.2434582011),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).tanh(),
        new Complex(1.1667362572, .2434582011),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).tanh(),
        new Complex(-1.1667362572, .2434582011),
      );
      assertEquals(complexZero.tanh(), complexZero);
      assertEquals(complexNaN.tanh(), complexNaN);
      assertEquals(complexInfinity.tanh(), complexNaN);
    });

    await t.step("coth()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).coth(),
        new Complex(.8213297974, .1713836129),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).coth(),
        new Complex(-.8213297974, .1713836129),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).coth(),
        new Complex(.8213297974, -.1713836129),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).coth(),
        new Complex(-.8213297974, -.1713836129),
      );
      assertEquals(complexZero.coth(), complexInfinity);
      assertEquals(complexNaN.coth(), complexNaN);
      assertEquals(complexInfinity.coth(), complexNaN);
    });

    await t.step("sech()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).sech(),
        new Complex(-.4131493442, -.6875274386),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).sech(),
        new Complex(-.4131493442, .6875274386),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).sech(),
        new Complex(-.4131493442, .6875274386),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).sech(),
        new Complex(-.4131493442, -.6875274386),
      );
      assertEquals(complexZero.sech(), complexOne);
      assertEquals(complexNaN.sech(), complexNaN);
      assertEquals(complexInfinity.sech(), complexNaN);
    });

    await t.step("csch()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).csch(),
        new Complex(-.2215009308, -.6354937992),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).csch(),
        new Complex(.2215009308, -.6354937992),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).csch(),
        new Complex(-.2215009308, .6354937992),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).csch(),
        new Complex(.2215009308, .6354937992),
      );
      assertEquals(complexZero.csch(), complexInfinity);
      assertEquals(complexNaN.csch(), complexNaN);
      assertEquals(complexInfinity.csch(), complexNaN);
    });
  });

  await t.step("Inverse trigonometric functions", async (t) => {
    await t.step("asin()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).asin(),
        new Complex(.42707859, 1.52857092),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).asin(),
        new Complex(-.42707859, 1.52857092),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).asin(),
        new Complex(.42707859, -1.52857092),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).asin(),
        new Complex(-.42707859, -1.52857092),
      );
      assertEquals(complexZero.asin(), complexZero);
      assertEquals(complexNaN.asin(), complexNaN);
      assertEquals(complexInfinity.asin(), complexNaN);
    });

    await t.step("acos()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).acos(),
        new Complex(1.14371774, -1.52857092),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).acos(),
        new Complex(1.99787491, -1.52857092),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).acos(),
        new Complex(1.14371774, 1.52857092),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).acos(),
        new Complex(1.99787491, 1.52857092),
      );
      assertEquals(complexZero.acos(), new Complex(Math.PI / 2));
      assertEquals(complexNaN.acos(), complexNaN);
      assertEquals(complexInfinity.acos(), complexNaN);
    });

    await t.step("atan()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).atan(),
        new Complex(1.3389725222, .4023594781),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).atan(),
        new Complex(-1.33897252, .40235948),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).atan(),
        new Complex(1.33897252, -.40235948),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).atan(),
        new Complex(-1.33897252, -.40235948),
      );
      assertEquals(complexZero.atan(), complexZero);
      assertEquals(complexNaN.atan(), complexNaN);
      assertEquals(complexInfinity.atan(), complexNaN);
    });
  });

  await t.step("Inverse hyperbolic trigonometric functions", async (t) => {
    await t.step("asinh()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).asinh(),
        new Complex(1.46935174, 1.06344002),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).asinh(),
        new Complex(-1.46935174, 1.06344002),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).asinh(),
        new Complex(1.46935174, -1.06344002),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).asinh(),
        new Complex(-1.46935174, -1.06344002),
      );
      assertEquals(complexZero.asinh(), complexZero);
      assertEquals(complexNaN.asinh(), complexNaN);
      assertEquals(complexInfinity.asinh(), complexInfinity);
    });

    await t.step("acosh()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).acosh(),
        new Complex(1.5285709194, 1.14371774),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).acosh(),
        new Complex(1.5285709194, 1.9978749131),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).acosh(),
        new Complex(1.5285709194, -1.14371774),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).acosh(),
        new Complex(1.5285709194, -1.9978749131),
      );
      assertEquals(complexZero.acosh(), new Complex(0, Math.PI / 2));
      assertEquals(complexNaN.acosh(), complexNaN);
      assertEquals(complexInfinity.acosh(), complexNaN);
    });

    await t.step("atanh()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).atanh(),
        new Complex(.1732867951, 1.1780972450),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).atanh(),
        new Complex(-.1732867951, 1.1780972450),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).atanh(),
        new Complex(.1732867951, -1.1780972450),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).atanh(),
        new Complex(-.1732867951, -1.1780972450),
      );
      assertEquals(complexZero.atanh(), complexZero);
      assertEquals(complexNaN.atanh(), complexNaN);
      assertEquals(complexInfinity.atanh(), complexNaN);
    });
  });
});
