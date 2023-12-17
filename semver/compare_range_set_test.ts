// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { compareRangeSet } from "./compare_range_set.ts";
import { parse } from "./parse.ts";
import { parseRangeSet } from "./parse_range_set.ts";

Deno.test({
  name: "compareRangeSet()",
  fn: async (t) => {
    const steps: [string, string, -1 | 0 | 1][] = [
      ["1.2.3", "1.0.0 - 1.2.2", 1],
      ["1.2.3", "1.0.0 - 1.2.3", 0],
      ["0.0.0", "1.0.0 - 1.2.2", -1],
      ["1.0.0", "1.0.0 - 1.2.3", 0],
    ];
    for (const [version, range, expected] of steps) {
      await t.step({
        name: `${range} ${expected ? "∋" : "∌"} ${version}`,
        fn: () => {
          const v = parse(version);
          const r = parseRangeSet(range);
          const actual = compareRangeSet(v, r);
          assertEquals(actual, expected);
        },
      });
    }
  },
});
