// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import type { SemVer } from "./types.ts";
import { parse } from "./parse.ts";
import { parseRange } from "./parse_range.ts";
import { minVersion } from "./min_version.ts";

Deno.test("minVersion()", async (t) => {
  const tests: [string, SemVer][] = [
    [">=1.0.0 <2.0.0", parse("1.0.0")],
    [">1.0.0", parse("1.0.1")],
    [">=1.2.3", parse("1.2.3")],
    ["^1.2.3", parse("1.2.3")],
    ["^0.2.3", parse("0.2.3")],
    ["~1.2.3", parse("1.2.3")],
    ["~0.2.3", parse("0.2.3")],
    [">1.0.0-0", parse("1.0.0-0.0")],
    [">=1.0.0-0", parse("1.0.0-0")],
    [">1.0.0-beta", parse("1.0.0-beta.0")],
    [">=0.0.0", { major: 0, minor: 0, patch: 0 }],
    ["*", { major: 0, minor: 0, patch: 0 }],
    ["1.x", parse("1.0.0")],
    ["1.2.x", parse("1.2.0")],
    ["1 || 2 || 3", parse("1.0.0")],
    [">=1.0.0 || >=2.0.0", parse("1.0.0")],
    [">=2.0.0 || >=1.0.0", parse("1.0.0")],
    [">2.0.0 || >=1.0.0", parse("1.0.0")],
    [">=1.0.0", parse("1.0.0")],
    [">1.0.0", parse("1.0.1")],
    [">=2.0.0", parse("2.0.0")],
    [">2.0.0", parse("2.0.1")],
    [">=1.0.0 <1.1.0", parse("1.0.0")],
    [">0.0.0", parse("0.0.1")],
    [">=0.0.0-0", { major: 0, minor: 0, patch: 0 }],
  ];

  for (const [r, expected] of tests) {
    await t.step(`minVersion("${r}")`, () => {
      const range = parseRange(r);
      const actual = minVersion(range);
      assertEquals(actual, expected);
    });
  }
});

Deno.test("minVersion() returns undefined for unsatisfiable range", async (t) => {
  const tests: string[] = [
    "<0.0.0",
  ];

  for (const r of tests) {
    await t.step(`minVersion("${r}") = undefined`, () => {
      const range = parseRange(r);
      const actual = minVersion(range);
      assertEquals(actual, undefined);
    });
  }
});
