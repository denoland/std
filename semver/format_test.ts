// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { format } from "./format.ts";
import { parse } from "./parse.ts";
import { INVALID, MAX, MIN } from "./_constants.ts";
import type { SemVer } from "./types.ts";

Deno.test("format()", async (t) => {
  const versions: [string, string][] = [
    ["1.2.3", "1.2.3"],
    ["1.2.3-pre", "1.2.3-pre"],
    ["1.2.3-pre.0", "1.2.3-pre.0"],
    ["1.2.3+b", "1.2.3+b"],
    ["1.2.3+b.0", "1.2.3+b.0"],
    ["1.2.3-pre.0+b.0", "1.2.3-pre.0+b.0"],
  ];

  for (const [version, expected] of versions) {
    await t.step({
      name: version,
      fn: () => {
        const v = parse(version)!;
        const actual = format(v);
        assertEquals(actual, expected);
      },
    });
  }

  const constantSemVers: [SemVer, string][] = [
    [MAX, "∞.∞.∞"],
    [MIN, "0.0.0"],
    [INVALID, "⧞.∞.∞"],
  ];
  for (const [version, expected] of constantSemVers) {
    await t.step({
      name: format(version),
      fn: () => {
        const actual = format(version);
        assertEquals(actual, expected);
      },
    });
  }
});
