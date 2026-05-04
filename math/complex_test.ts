// Copyright 2018-2026 the Deno authors. MIT license.
import { Complex } from "./complex.ts";
import { assertEquals } from "@std/assert";

Deno.test("Complex", async (t) => {
  const complexZero = new Complex(0);
  const complexNaN = new Complex(NaN);
  const complexInfinity = new Complex(Infinity, Infinity);
  const complexNegInfinity = new Complex(-Infinity, -Infinity);

  await t.step("constructor", () => {
    assertEquals(new Complex(5, 1).imag, 1);
    assertEquals(new Complex(5, 1).real, 5);

    assertEquals(new Complex(NaN, 1), complexNaN);
    assertEquals(new Complex(1, NaN), complexNaN);
    assertEquals(new Complex(NaN, NaN), complexNaN);

    assertEquals(new Complex(Infinity, 1), complexInfinity);
    assertEquals(new Complex(1, Infinity), complexInfinity);
    assertEquals(new Complex(Infinity, Infinity), complexInfinity);

    assertEquals(new Complex(-Infinity, 1), complexNegInfinity);
    assertEquals(new Complex(1, -Infinity), complexNegInfinity);
    assertEquals(new Complex(-Infinity, -Infinity), complexNegInfinity);
  });

  await t.step("add()", () => {
    assertEquals(
      Complex.add(new Complex(0, 0), new Complex(1, 2), new Complex(4, 2)),
      new Complex(5, 4),
    );
    assertEquals(
      Complex.add(new Complex(0, 0), new Complex(1, 2), new Complex(4, 2)),
      new Complex(5, 4),
    );

    assertEquals(
      Complex.add(new Complex(2, 3), new Complex(2, Infinity)),
      new Complex(0),
    );
  });
});
