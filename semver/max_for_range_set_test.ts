// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { parse } from "./parse.ts";
import { parseRangeSet } from "./parse_range_set.ts";
import { maxForRangeSet } from "./max_for_range_set.ts";
import { MAX, MIN } from "./constants.ts";

Deno.test({
  name: "maxForRangeSet",
  fn: async (t) => {
    const versions: [string[], string, string][] = [
      [["1.2.3", "1.2.4"], "1.2", "1.2.4"],
      [["1.2.4", "1.2.3"], "1.2", "1.2.4"],
      [["1.2.3", "1.2.4", "1.2.5", "1.2.6"], "~1.2.3", "1.2.6"],
    ];

    for (const [v, r, e] of versions) {
      await t.step(`[${v}] ${r} : ${e}`, () => {
        const versions = v.map((v) => parse(v));
        const range = parseRangeSet(r);
        const expect = parse(e);
        const actual = maxForRangeSet(versions, range);
        assertEquals(actual, expect);
      });
    }
  },
});

Deno.test("badRangesInMaxOrMinFor", function () {
  const r = parseRangeSet("some frogs and sneks-v2.5.6");
  assertEquals(maxForRangeSet([MIN, MAX], r), undefined);
});
