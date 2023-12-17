// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { parse } from "./parse.ts";
import { parseRangeSet } from "./parse_range_set.ts";
import { minForRangeSet } from "./min_for_range_set.ts";
import { MAX, MIN } from "./constants.ts";

Deno.test("minForRangeSet", async (t) => {
  const versions: [string[], string, string][] = [
    [["1.2.3", "1.2.4"], "1.2", "1.2.3"],
    [["1.2.4", "1.2.3"], "1.2", "1.2.3"],
    [["1.2.3", "1.2.4", "1.2.5", "1.2.6"], "~1.2.3", "1.2.3"],
  ];

  for (const [v, r, e] of versions) {
    await t.step(`[${v}] ${r} : ${e}`, () => {
      const s = v.map((v) => parse(v));
      const range = parseRangeSet(r);
      const expected = parse(e);
      const actual = minForRangeSet(s, range);
      assertEquals(actual, expected);
    });
  }
});

Deno.test("badRangesInMaxOrMinFor", function () {
  const r = parseRangeSet("some frogs and sneks-v2.5.6");
  assertEquals(minForRangeSet([MIN, MAX], r), undefined);
});
