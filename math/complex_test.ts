// Copyright 2018-2026 the Deno authors. MIT license.
import { assert, assertEquals, assertFalse } from "@std/assert";
import { Complex } from "./complex.ts";

Deno.test("Complex", async (t) => {
  const complexZero = new Complex(0);
  const complexNaN = new Complex(NaN);
  const complexInfinity = new Complex(Infinity);

  await t.step("constructor", async (t) => {
    await t.step("Basic", () => {
      assertEquals(new Complex(1), new Complex(1, 0));
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
});
