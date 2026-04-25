// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { parse } from "./parse.ts";
import { coerce } from "./coerce.ts";

Deno.test("coerce() basic coercion", async (t) => {
  const tests: [string | number, string][] = [
    ["1", "1.0.0"],
    ["1.2", "1.2.0"],
    ["1.2.3", "1.2.3"],
    ["v1", "1.0.0"],
    ["v1.2", "1.2.0"],
    ["v1.2.3", "1.2.3"],
    [42, "42.0.0"],
    ["42.6.7.9.3-alpha", "42.6.7"],
    ["1.2.3.4", "1.2.3"],
    ["  1.2.3  ", "1.2.3"],
    ["hello 1.2.3 world", "1.2.3"],
    ["v1.0.0-alpha", "1.0.0"],
  ];

  for (const [input, expected] of tests) {
    await t.step(`coerce(${JSON.stringify(input)}) = ${expected}`, () => {
      assertEquals(coerce(input), parse(expected));
    });
  }
});

Deno.test("coerce() returns undefined for non-coercible values", async (t) => {
  const tests: string[] = [
    "",
    "invalid",
    "hello world",
  ];

  for (const input of tests) {
    await t.step(`coerce(${JSON.stringify(input)}) = undefined`, () => {
      assertEquals(coerce(input), undefined);
    });
  }
});

Deno.test("coerce() with includePrerelease", async (t) => {
  const tests: [string, string][] = [
    ["1.2.3-alpha.1", "1.2.3-alpha.1"],
    ["1.2.3-alpha+build", "1.2.3-alpha+build"],
    ["1.2.3+build.123", "1.2.3+build.123"],
  ];

  for (const [input, expected] of tests) {
    await t.step(
      `coerce("${input}", { includePrerelease: true }) = ${expected}`,
      () => {
        assertEquals(
          coerce(input, { includePrerelease: true }),
          parse(expected),
        );
      },
    );
  }
});

Deno.test("coerce() with rtl", async (t) => {
  const tests: [string, string][] = [
    ["1.2.3.4", "2.3.4"],
    ["1.2.3.4.5", "3.4.5"],
  ];

  for (const [input, expected] of tests) {
    await t.step(
      `coerce("${input}", { rtl: true }) = ${expected}`,
      () => {
        assertEquals(coerce(input, { rtl: true }), parse(expected));
      },
    );
  }
});
