// Copyright 2018-2026 the Deno authors. MIT license.
import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertFalse,
} from "@std/assert";
import { Complex } from "./unstable_complex.ts";
import { simpleSpecialValues } from "./unstable_complex_values.ts";

function assertAlmostEqualComplex(
  actual: Complex,
  expected: Complex,
  tolerance?: number,
) {
  assertAlmostEquals(actual.real, expected.real, tolerance);
  assertAlmostEquals(actual.imag, expected.imag, tolerance);
}

function isPositiveSigned(num: number): boolean {
  return Object.is(num, 0) || 0 < num;
}

const numbers = [
  -Infinity,
  -5,
  -4,
  -3,
  -2,
  -1,
  -0,
  0,
  1,
  2,
  3,
  4,
  5,
  Infinity,
  NaN,
];
const finiteNumbers = numbers.filter((num) => Number.isFinite(num));
const finiteNonZeroNumbers = finiteNumbers.filter((num) => num !== 0);
const nonZeroNumbers = [...finiteNonZeroNumbers, Infinity, -Infinity];
const finitePositiveNumbers = finiteNumbers.filter((num) => 0 < num);
const finitePositiveSignedNumbers = finiteNumbers.filter((num) =>
  isPositiveSigned(num)
);

Deno.test("Complex", async (t) => {
  await t.step("constructor", () => {
    assertEquals(new Complex(1, 0), Complex.one);
    assertEquals(new Complex(5, 1).imag, 1);
    assertEquals(new Complex(5, 1).real, 5);
  });

  await t.step("Utility functions", async (t) => {
    await t.step("isReal()", () => {
      assertFalse(new Complex(4, 4).isReal());
      assert(new Complex(4).isReal());
      assert(new Complex(4, 1e-16).isReal(1e-15));
      assertFalse(Complex.Infinity.isReal());
      assertFalse(Complex.NaN.isReal());
    });

    await t.step("isImaginary()", () => {
      assertFalse(new Complex(4, 4).isImaginary());
      assert(new Complex(0, 4).isImaginary());
      assert(new Complex(1e-16, 4).isImaginary(1e-15));
      assertFalse(Complex.Infinity.isImaginary());
      assertFalse(Complex.NaN.isImaginary());
    });

    await t.step("isZero()", () => {
      assert(Complex.zero.isZero());
      assertFalse(new Complex(0, 4).isZero());
      assertFalse(new Complex(-1, 4).isZero());
      assert(new Complex(0, 1.6e-16).isZero(1e-15));
    });

    await t.step("isFinite()", () => {
      assert(new Complex(0, 0).isFinite());
      assert(new Complex(0, 4).isFinite());
      assertFalse(new Complex(NaN, 4).isFinite());
      assertFalse(new Complex(NaN, Infinity).isFinite());
      assertFalse(new Complex(8, Infinity).isFinite());
    });

    await t.step("isInfinite()", () => {
      assertFalse(new Complex(0).isInfinite());
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

    await t.step("equals()", () => {
      assert(new Complex(0, 3).equals(new Complex(0, 3)));
      assert(new Complex(4, 3).equals(new Complex(4, 3 - 1e-16), 1e-15));
      assert(new Complex(NaN, Infinity).equals(new Complex(NaN, Infinity)));
      assert(new Complex(NaN, 2).equals(new Complex(NaN, 2)));
      assert(new Complex(NaN, 2).equals(new Complex(NaN, 2 + 1e-16), 1e-15));
      assertFalse(new Complex(4, 3).equals(new Complex(4, 3 - 1e-15), 1e-16));
      assertFalse(new Complex(Infinity, 0).equals(new Complex(-Infinity, 0)));
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
        new Complex(Infinity, 6),
      );
      assertEquals(
        new Complex(NaN, 4).add(new Complex(Infinity, 2)),
        new Complex(NaN, 6),
      );
      assertEquals(
        new Complex(NaN, 4).add(new Complex(3, 2)),
        new Complex(NaN, 6),
      );
    });

    await t.step("neg()", () => {
      assertEquals(new Complex(-1, -2).neg(), new Complex(1, 2));
      assertEquals(new Complex(0, -2).neg(), new Complex(-0, 2));
      assertEquals(new Complex(0, 0).neg(), new Complex(-0, -0));
      assertEquals(new Complex(NaN, 2).neg(), new Complex(NaN, -2));
      assertEquals(
        new Complex(Infinity, -Infinity).neg(),
        new Complex(-Infinity, Infinity),
      );
    });

    await t.step("sub()", () => {
      assertEquals(
        new Complex(0, 0).sub(new Complex(3, 2)),
        new Complex(-3, -2),
      );
      assertEquals(
        new Complex(5, 4).sub(new Complex(Infinity, 2)),
        new Complex(-Infinity, 2),
      );
      assertEquals(
        new Complex(NaN, 4).sub(new Complex(Infinity, 2)),
        new Complex(NaN, 2),
      );
      assertEquals(
        new Complex(NaN, 4).sub(new Complex(3, 2)),
        new Complex(NaN, 2),
      );
    });

    await t.step("mul()", () => {
      assertEquals(
        new Complex(3, 2).mul(new Complex(4, 4)),
        new Complex(4, 20),
      );
      assertEquals(
        new Complex(Infinity).sub(new Complex(4, 2)),
        Complex.Infinity,
      );
      assertEquals(
        Complex.Infinity.mul(Complex.zero),
        Complex.NaN,
      );
      assertEquals(
        new Complex(NaN, 4).sub(new Complex(Infinity, 2)),
        Complex.NaN,
      );
      assertEquals(
        new Complex(NaN, 4).sub(new Complex(3, 2)),
        Complex.NaN,
      );
    });

    await t.step("div()", () => {
      assertEquals(
        new Complex(4, 20).div(new Complex(4, 4)),
        new Complex(3, 2),
      );
      assertEquals(
        Complex.Infinity.div(new Complex(4, 2)),
        Complex.Infinity,
      );
      assertEquals(
        new Complex(4, 2).div(Complex.zero),
        Complex.Infinity,
      );
      assertEquals(
        Complex.NaN.div(Infinity),
        Complex.NaN,
      );
      assertEquals(
        Complex.NaN.div(new Complex(3, 2)),
        Complex.NaN,
      );
    });
  });

  await t.step("Basic complex functions", async (t) => {
    await t.step("recip()", () => {
      assertEquals(new Complex(1, 2).recip(), new Complex(.2, -.4));
      assertEquals(new Complex(0, -2).recip(), new Complex(0, .5));
      assertEquals(Complex.zero.recip(), Complex.Infinity);
      assertEquals(Complex.NaN.recip(), Complex.NaN);
      assertEquals(Complex.Infinity.recip(), Complex.zero);
    });

    await t.step("absSquared()", () => {
      assertEquals(new Complex(1, 2).absSquared(), 5);
      assertEquals(new Complex(0, -2).absSquared(), 4);
      assertEquals(Complex.zero.absSquared(), 0);
      assertEquals(Complex.NaN.absSquared(), NaN);
      assertEquals(Complex.Infinity.absSquared(), Infinity);
    });

    await t.step("abs()", () => {
      assertEquals(new Complex(1, 2).abs(), Math.sqrt(5));
      assertEquals(new Complex(0, -2).abs(), 2);
      assertEquals(Complex.zero.abs(), 0);
      assertEquals(Complex.NaN.abs(), NaN);
      assertEquals(Complex.Infinity.abs(), Infinity);
    });

    await t.step("arg()", () => {
      assertAlmostEquals(new Complex(1, 2).arg(), 1.107148718);
      assertEquals(Complex.negOne.arg(), Math.PI);
      assertEquals(new Complex(0, -2).arg(), -Math.PI / 2);
      assertEquals(Complex.zero.arg(), 0);
      assertEquals(Complex.NaN.arg(), NaN);
      assertEquals(Complex.Infinity.arg(), NaN);

      const nums = Array.from(Array(10)).keys(); // [0, 1, 2, ...]
      for (const re of nums) {
        for (const im of nums) {
          const arg = new Complex(re, im).arg();
          assert(-Math.PI < arg && arg <= Math.PI);
        }
      }
    });

    await t.step("conj()", () => {
      assertEquals(new Complex(1, 2).conj(), new Complex(1, -2));
      assertEquals(new Complex(0, -2).conj(), new Complex(0, 2));

      const nums = [0, 1, 2, 3];
      for (const real of nums) {
        for (const imag of nums) {
          assertEquals(
            new Complex(real, imag).conj().conj(),
            new Complex(real, imag),
          );
        }
      }

      assertEquals(Complex.zero.conj(), Complex.zero);
      assertEquals(Complex.NaN.conj(), Complex.NaN);
      assertEquals(Complex.Infinity.conj(), Complex.Infinity);
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

      assertEquals(
        Complex.one.sqrt(),
        Complex.one,
      );
      assertEquals(
        Complex.i.sqrt(),
        new Complex(Math.SQRT1_2, Math.SQRT1_2),
      );
      assertEquals(
        Complex.negOne.sqrt(),
        new Complex(0, 1),
      );
      assertEquals(
        Complex.negI.sqrt(),
        new Complex(Math.SQRT1_2, -Math.SQRT1_2),
      );

      const nums = [0, 1, 2, 3];
      for (const real of nums) {
        for (const imag of nums) {
          assertAlmostEqualComplex(
            new Complex(real, imag).sqrt().pow(2),
            new Complex(real, imag),
            1e-15,
          );
        }
      }

      assertEquals(Complex.zero.sqrt(), Complex.zero);
      assertEquals(Complex.NaN.sqrt(), Complex.NaN);
      assertEquals(Complex.Infinity.sqrt(), Complex.Infinity);
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

      const nums = [0, 1, 2, 3];
      for (const real of nums) {
        for (const imag of nums) {
          assertAlmostEqualComplex(
            new Complex(real, imag).cbrt().pow(3),
            new Complex(real, imag),
            2e-15,
          );
        }
      }

      assertEquals(Complex.zero.cbrt(), Complex.zero);
      assertEquals(Complex.NaN.cbrt(), Complex.NaN);
      assertEquals(Complex.Infinity.cbrt(), Complex.Infinity);
    });

    await t.step("log()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).log(),
        new Complex(.80471896, 1.10714872),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).log(),
        new Complex(.80471896, 2.03444394),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).log(),
        new Complex(.80471896, -1.10714872),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).log(),
        new Complex(.80471896, -2.03444394),
      );
      assertAlmostEqualComplex(
        new Complex(-1).log(),
        new Complex(0, Math.PI),
      );

      assertEquals(Complex.zero.log(), Complex.NaN);
      assertEquals(Complex.NaN.log(), Complex.NaN);
      assertEquals(Complex.Infinity.log(), Complex.Infinity);
    });

    await t.step("log10()", () => {
      assertAlmostEqualComplex(
        new Complex(1, 2).log10(),
        new Complex(.349485, .48082858),
      );
      assertAlmostEqualComplex(
        new Complex(-1, 2).log10(),
        new Complex(.349485, .88354778),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).log10(),
        new Complex(.349485, -.48082858),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).log10(),
        new Complex(.349485, -.88354778),
      );
      assertEquals(Complex.zero.log10(), Complex.NaN);
      assertEquals(Complex.NaN.log10(), Complex.NaN);
      assertEquals(Complex.Infinity.log10(), Complex.Infinity);
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
        assertEquals(Complex.zero.logn(base), Complex.NaN);
        assertEquals(Complex.NaN.logn(base), Complex.NaN);
        assertEquals(Complex.Infinity.logn(base), Complex.Infinity);
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
      assertAlmostEqualComplex(
        new Complex(0, Math.PI).exp(),
        Complex.negOne,
        1e-15,
      );
      assertAlmostEqualComplex(
        new Complex(0, 2 * Math.PI).exp(),
        Complex.one,
        1e-15,
      );

      // ISO/IEC required
      for (
        const [[realInput, imagInput], [realOutput, imagOutput]]
          of simpleSpecialValues.exp
      ) {
        assertEquals(
          new Complex(realInput, imagInput).exp(),
          new Complex(realOutput, imagOutput),
        );
      }

      for (const num of finiteNumbers) {
        assertEquals(new Complex(num, Infinity).exp(), Complex.NaN);
        assertEquals(new Complex(num, NaN).exp(), Complex.NaN);
        assertEquals(new Complex(-Infinity, num).exp(), Complex.cis(num).mul(0));
      }
      for (const num of finiteNonZeroNumbers) {
        assertEquals(
          new Complex(Infinity, num).exp(),
          Complex.cis(num).mul(Infinity),
        );
        assertEquals(new Complex(NaN, num).exp(), Complex.NaN);
      }
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
      assertEquals(Complex.zero.pow(Complex.zero), Complex.one);
      assertEquals(Complex.NaN.pow(new Complex(2, 3)), Complex.NaN);
      assertEquals(Complex.Infinity.pow(new Complex(4, 5)), Complex.NaN);
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
        new Complex(.48905626, 1.40311925),
      );
      assertAlmostEqualComplex(
        new Complex(1, -2).sinh(),
        new Complex(-.48905626, -1.40311925),
      );
      assertAlmostEqualComplex(
        new Complex(-1, -2).sinh(),
        new Complex(.48905626, -1.40311925),
      );

      // ISO/IEC required
      for (
        const [[realInput, imagInput], [realOutput, imagOutput]]
          of simpleSpecialValues.sinh
      ) {
        assertEquals(
          new Complex(realInput, imagInput).sinh(),
          new Complex(realOutput, imagOutput),
        );
      }

      for (const num of finitePositiveNumbers) {
        assertEquals(new Complex(num, Infinity).sinh(), new Complex(NaN, NaN));
        assertEquals(
          new Complex(Infinity, num).sinh(),
          Complex.cis(num).mul(Infinity),
        );
      }
      for (const num of finiteNonZeroNumbers) {
        assertEquals(new Complex(num, NaN).sinh(), new Complex(NaN, NaN));
      }
      for (const num of nonZeroNumbers) {
        assertEquals(new Complex(NaN, num).sinh(), new Complex(NaN, NaN));
      }
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

      // ISO/IEC required
      for (
        const [[realInput, imagInput], [realOutput, imagOutput]]
          of simpleSpecialValues.cosh
      ) {
        assertEquals(
          new Complex(realInput, imagInput).cosh(),
          new Complex(realOutput, imagOutput),
        );
      }

      for (const num of finiteNonZeroNumbers) {
        assertEquals(
          new Complex(num, Infinity).cosh(),
          new Complex(NaN, NaN),
        );
        assertEquals(
          new Complex(num, NaN).cosh(),
          new Complex(NaN, NaN),
        );
        assertEquals(
          new Complex(Infinity, num).cosh(),
          Complex.cis(num).mul(Infinity),
        );
      }
      for (const num of nonZeroNumbers) {
        assertEquals(
          new Complex(NaN, num).cosh(),
          new Complex(NaN, NaN),
        );
      }
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

      // ISO/IEC required
      for (
        const [[realInput, imagInput], [realOutput, imagOutput]]
          of simpleSpecialValues.tanh
      ) {
        assertEquals(
          new Complex(realInput, imagInput).tanh(),
          new Complex(realOutput, imagOutput),
        );
      }

      for (const num of finiteNonZeroNumbers) {
        assertEquals(new Complex(num, Infinity).tanh(), new Complex(NaN, NaN));
        assertEquals(new Complex(num, NaN).tanh(), new Complex(NaN, NaN));
      }
      for (const num of finitePositiveSignedNumbers) {
        assertEquals(
          new Complex(Infinity, num).tanh(),
          new Complex(1, 0 * Math.sin(2 * num)),
        );
      }
      for (const num of nonZeroNumbers) {
        assertEquals(new Complex(NaN, num).tanh(), new Complex(NaN, NaN));
      }
    });

    const hyperTrigFunctions = [
      {
        name: "coth",
        functionBody: (num: Complex) => num.coth(),
        testBody: (num: Complex) => num.tanh().recip(),
      },
      {
        name: "sech",
        functionBody: (num: Complex) => num.sech(),
        testBody: (num: Complex) => num.cosh().recip(),
      },
      {
        name: "csch",
        functionBody: (num: Complex) => num.csch(),
        testBody: (num: Complex) => num.sinh().recip(),
      },
    ];

    for (const { name, functionBody, testBody } of hyperTrigFunctions) {
      await t.step(`${name}()`, () => {
        for (const re of numbers) {
          for (const im of numbers) {
            const num = new Complex(re, im);
            assertEquals(
              functionBody(num),
              testBody(num),
            );
          }
        }
      });
    }
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

      // ISO/IEC required
      for (
        const [[realInput, imagInput], [realOutput, imagOutput]]
          of simpleSpecialValues.asinh
      ) {
        assertEquals(
          new Complex(realInput, imagInput).asinh(),
          new Complex(realOutput, imagOutput),
        );
      }

      for (const num of finitePositiveSignedNumbers) {
        assertEquals(
          new Complex(num, Infinity).asinh(),
          new Complex(Infinity, Math.PI / 2),
        );
        assertEquals(
          new Complex(Infinity, num).asinh(),
          new Complex(Infinity, 0),
        );
      }
      for (const num of finiteNumbers) {
        assertEquals(
          new Complex(num, NaN).asinh(),
          new Complex(NaN, NaN),
        );
      }
      for (const num of finiteNonZeroNumbers) {
        assertEquals(
          new Complex(NaN, num).asinh(),
          new Complex(NaN, NaN),
        );
      }
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

      // ISO/IEC required
      for (
        const [[realInput, imagInput], [realOutput, imagOutput]]
          of simpleSpecialValues.acosh
      ) {
        assertEquals(
          new Complex(realInput, imagInput).acosh(),
          new Complex(realOutput, imagOutput),
        );
      }

      for (const num of finiteNonZeroNumbers) {
        assertEquals(
          new Complex(num, NaN).acosh(),
          new Complex(NaN, NaN),
        );
      }
      for (const num of finitePositiveSignedNumbers) {
        assertEquals(
          new Complex(-Infinity, num).acosh(),
          new Complex(Infinity, Math.PI),
        );
        assertEquals(
          new Complex(Infinity, num).acosh(),
          new Complex(Infinity, 0),
        );
      }
      for (const num of finiteNumbers) {
        assertEquals(
          new Complex(NaN, num).acosh(),
          new Complex(NaN, NaN),
        );
      }
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

      // ISO/IEC required
      for (
        const [[realInput, imagInput], [realOutput, imagOutput]]
          of simpleSpecialValues.atanh
      ) {
        assertEquals(
          new Complex(realInput, imagInput).atanh(),
          new Complex(realOutput, imagOutput),
        );
      }

      for (const num of finitePositiveSignedNumbers) {
        assertEquals(
          new Complex(num, Infinity).atanh(),
          new Complex(0, Math.PI / 2),
        );
        assertEquals(
          new Complex(Infinity, num).atanh(),
          new Complex(0, Math.PI / 2),
        );
      }
      for (const num of finiteNonZeroNumbers) {
        assertEquals(
          new Complex(num, NaN).atanh(),
          new Complex(NaN, NaN),
        );
      }
      for (const num of finiteNumbers) {
        assertEquals(
          new Complex(NaN, num).atanh(),
          new Complex(NaN, NaN),
        );
      }
    });
  });

  await t.step("Trigonometric functions", async (t) => {
    const trigFunctions = [
      {
        name: "sin",
        functionBody: (num: Complex) => num.sin(),
        testBody: (num: Complex) =>
          num.mul(new Complex(0, 1)).sinh().mul(new Complex(0, -1)),
      },
      {
        name: "cos",
        functionBody: (num: Complex) => num.cos(),
        testBody: (num: Complex) => num.mul(new Complex(0, 1)).cosh(),
      },
      {
        name: "tan",
        functionBody: (num: Complex) => num.tan(),
        testBody: (num: Complex) =>
          num.mul(new Complex(0, 1)).tanh().mul(new Complex(0, -1)),
      },
      {
        name: "cot",
        functionBody: (num: Complex) => num.cot(),
        testBody: (num: Complex) => num.tan().recip(),
      },
      {
        name: "sec",
        functionBody: (num: Complex) => num.sec(),
        testBody: (num: Complex) => num.cos().recip(),
      },
      {
        name: "csc",
        functionBody: (num: Complex) => num.csc(),
        testBody: (num: Complex) => num.sin().recip(),
      },
    ];

    for (const { name, functionBody, testBody } of trigFunctions) {
      await t.step(`${name}()`, () => {
        for (const re of numbers) {
          for (const im of numbers) {
            const num = new Complex(re, im);
            assertEquals(
              functionBody(num),
              testBody(num),
            );
          }
        }
      });
    }
  });

  await t.step("Inverse trigonometric functions", async (t) => {
    const inverseTrigFunctions = [
      {
        name: "asin",
        functionBody: (num: Complex) => num.asin(),
        testBody: (num: Complex) =>
          num.mul(new Complex(0, 1)).asinh().mul(new Complex(0, -1)),
      },
      {
        name: "atan",
        functionBody: (num: Complex) => num.atan(),
        testBody: (num: Complex) =>
          num.mul(new Complex(0, 1)).atanh().mul(new Complex(0, -1)),
      },
    ];

    for (const { name, functionBody, testBody } of inverseTrigFunctions) {
      await t.step(`${name}()`, () => {
        for (const re of numbers) {
          for (const im of numbers) {
            const num = new Complex(re, im);
            assertEquals(
              functionBody(num),
              testBody(num),
            );
          }
        }
      });
    }

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

      // ISO/IEC required
      for (
        const [[realInput, imagInput], [realOutput, imagOutput]]
          of simpleSpecialValues.acos
      ) {
        assertEquals(
          new Complex(realInput, imagInput).acos(),
          new Complex(realOutput, imagOutput),
        );
      }

      for (const num of finiteNumbers) {
        assertEquals(
          new Complex(num, Infinity).acos(),
          new Complex(Math.PI / 2, -Infinity),
        );
        assertEquals(
          new Complex(NaN, num).acos(),
          new Complex(NaN, NaN),
        );
      }
      for (const num of finiteNonZeroNumbers) {
        assertEquals(
          new Complex(num, NaN).acos(),
          new Complex(NaN, NaN),
        );
      }
      for (const num of finitePositiveSignedNumbers) {
        assertEquals(
          new Complex(-Infinity, num).acos(),
          new Complex(Math.PI, -Infinity),
        );
        assertEquals(
          new Complex(Infinity, num).acos(),
          new Complex(0, -Infinity),
        );
      }
    });
  });
});
