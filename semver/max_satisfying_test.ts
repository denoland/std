// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { parse } from "./parse.ts";
import { parseRange } from "./parse_range.ts";
import { maxSatisfying } from "./max_satisfying.ts";

Deno.test({
  name: "maxSatisfying()",
  fn: async (t) => {
    const versions: [string[], string, string][] = [
      [["1.2.3", "1.2.4"], "1.2", "1.2.4"],
      [["1.2.4", "1.2.3"], "1.2", "1.2.4"],
      [["1.2.3", "1.2.4", "1.2.5", "1.2.6"], "~1.2.3", "1.2.6"],
    ];

    for (const [v, r, e] of versions) {
      await t.step(r, () => {
        const versions = v.map((v) => parse(v));
        const range = parseRange(r);
        const expect = parse(e);
        const actual = maxSatisfying(versions, range);
        assertEquals(actual, expect);
      });
    }
  },
});
