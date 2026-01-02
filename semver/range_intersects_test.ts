// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { parseRange } from "./parse_range.ts";
import { rangeIntersects } from "./range_intersects.ts";

Deno.test({
  name: "rangesIntersects()",
  fn: async (t) => {
    const versions: [string, string, boolean][] = [
      ["1.3.0 || <1.0.0 >2.0.0", "1.3.0 || <1.0.0 >2.0.0", true],
      [">0.0.0", "<1.0.0 >2.0.0", false],
      ["<1.0.0 >2.0.0", ">1.4.0 <1.6.0", false],
      ["<1.0.0 >2.0.0", ">1.4.0 <1.6.0 || 2.0.0", false],
      [">1.0.0 <=2.0.0", "2.0.0", true],
      ["<1.0.0 >=2.0.0", "2.1.0", false],
      ["<1.0.0 >=2.0.0", ">1.4.0 <1.6.0 || 2.0.0", false],
      ["1.5.x", "<1.5.0 || >=1.6.0", false],
      ["<1.5.0 || >=1.6.0", "1.5.x", false],
      [
        "<1.6.16 || >=1.7.0 <1.7.11 || >=1.8.0 <1.8.2",
        ">=1.6.16 <1.7.0 || >=1.7.11 <1.8.0 || >=1.8.2",
        false,
      ],
      [
        "<=1.6.16 || >=1.7.0 <1.7.11 || >=1.8.0 <1.8.2",
        ">=1.6.16 <1.7.0 || >=1.7.11 <1.8.0 || >=1.8.2",
        true,
      ],
      [">=1.0.0", "<=1.0.0", true],
      [">1.0.0 <1.0.0", "<=0.0.0", false],
      // Pre-release ranges
      ["<1.0.0", ">1.0.0-5", true],
      [">1.0.0", "<1.0.0-5", false],
      [">1.0.0-2", "<=1.0.0-5", true],
      [">=1.0.0-2", "<1.0.0-5", true],
      ["<7.0.0-beta.20", ">7.0.0-beta.0", true],
      ["<7.0.0-beta.beta", ">7.0.0-beta.alpha", true],
      // Wildcards
      ["*", "0.0.1", true],
      ["*", ">=1.0.0", true],
      ["*", ">1.0.0", true],
      ["*", "~1.0.0", true],
      ["*", "<1.6.0", true],
      ["*", "<=1.6.0", true],
      ["1.*", "0.0.1", false],
      ["1.*", "2.0.0", false],
      ["1.*", "1.0.0", true],
      ["1.*", "<2.0.0", true],
      ["1.*", ">1.0.0", true],
      ["1.*", "<=1.0.0", true],
      ["1.*", "^1.0.0", true],
      ["1.0.*", "0.0.1", false],
      ["1.0.*", "<0.0.1", false],
      ["1.0.*", ">0.0.1", true],
      ["*", "1.3.0 || <1.0.0 >2.0.0", true],
      ["1.3.0 || <1.0.0 >2.0.0", "*", true],
      ["1.*", "1.3.0 || <1.0.0 >2.0.0", true],
      ["x", "0.0.1", true],
      ["x", ">=1.0.0", true],
      ["x", ">1.0.0", true],
      ["x", "~1.0.0", true],
      ["x", "<1.6.0", true],
      ["x", "<=1.6.0", true],
      ["1.x", "0.0.1", false],
      ["1.x", "2.0.0", false],
      ["1.x", "1.0.0", true],
      ["1.x", "<2.0.0", true],
      ["1.x", ">1.0.0", true],
      ["1.x", "<=1.0.0", true],
      ["1.x", "^1.0.0", true],
      ["1.0.x", "0.0.1", false],
      ["1.0.x", "<0.0.1", false],
      ["1.0.x", ">0.0.1", true],
      ["x", "1.3.0 || <1.0.0 >2.0.0", true],
      ["1.3.0 || <1.0.0 >2.0.0", "x", true],
      ["1.x", "1.3.0 || <1.0.0 >2.0.0", true],
      ["*", "*", true],
      ["x", "", true],

      // One is a Version
      ["1.3.0", ">=1.3.0", true],
      ["1.3.0", ">1.3.0", false],
      [">=1.3.0", "1.3.0", true],
      [">1.3.0", "1.3.0", false],

      // Same direction increasing
      [">1.3.0", ">1.2.0", true],
      [">1.2.0", ">1.3.0", true],
      [">=1.2.0", ">1.3.0", true],
      [">1.2.0", ">=1.3.0", true],

      // Same direction decreasing
      ["<1.3.0", "<1.2.0", true],
      ["<1.2.0", "<1.3.0", true],
      ["<=1.2.0", "<1.3.0", true],
      ["<1.2.0", "<=1.3.0", true],

      // Different directions, same SemVer and inclusive operator
      [">=1.3.0", "<=1.3.0", true],
      [">=v1.3.0", "<=1.3.0", true],
      [">=1.3.0", ">=1.3.0", true],
      ["<=1.3.0", "<=1.3.0", true],
      ["<=1.3.0", "<=v1.3.0", true],
      [">1.3.0", "<=1.3.0", false],
      [">=1.3.0", "<1.3.0", false],

      // Opposite matching directions
      [">1.0.0", "<2.0.0", true],
      [">=1.0.0", "<2.0.0", true],
      [">=1.0.0", "<=2.0.0", true],
      [">1.0.0", "<=2.0.0", true],
      ["<=2.0.0", ">1.0.0", true],
      ["<=1.0.0", ">=2.0.0", false],
    ];

    for (const [r1, r2, expected] of versions) {
      await t.step({
        name: `${r1} ∩ ${r2}`,
        fn: () => {
          const range1 = parseRange(r1);
          const range2 = parseRange(r2);
          const actual1 = rangeIntersects(range1, range2);
          const actual2 = rangeIntersects(range2, range1);
          assertEquals(actual1, expected);
          assertEquals(actual2, expected);
        },
      });
    }
  },
});
