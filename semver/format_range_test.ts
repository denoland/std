// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { formatRange } from "./format_range.ts";
import { parseRange } from "./parse_range.ts";

Deno.test({
  name: "formatRange()",
  fn: async (t) => {
    const versions: [string, string][] = [
      ["1.0.0 - 2.0.0", ">=1.0.0 <=2.0.0"],
      ["1.0.0", "1.0.0"],
      [">=*", "*"],
      ["", "*"],
      ["*", "*"],
      [">=1.0.0", ">=1.0.0"],
      [">1.0.0", ">1.0.0"],
      ["<=2.0.0", "<=2.0.0"],
      ["1", ">=1.0.0 <2.0.0"],
      ["<=2.0.0", "<=2.0.0"],
      ["<=2.0.0", "<=2.0.0"],
      ["<2.0.0", "<2.0.0"],
      ["<2.0.0", "<2.0.0"],
      [">=0.1.97", ">=0.1.97"],
      [">=0.1.97", ">=0.1.97"],
      ["0.1.20 || 1.2.4", "0.1.20||1.2.4"],
      [">=0.2.3 || <0.0.1", ">=0.2.3||<0.0.1"],
      [">=0.2.3 || <0.0.1", ">=0.2.3||<0.0.1"],
      [">=0.2.3 || <0.0.1", ">=0.2.3||<0.0.1"],
      ["||", "*||*"],
      ["2.x.x", ">=2.0.0 <3.0.0"],
      ["1.2.x", ">=1.2.0 <1.3.0"],
      ["1.2.x || 2.x", ">=1.2.0 <1.3.0||>=2.0.0 <3.0.0"],
      ["1.2.x || 2.x", ">=1.2.0 <1.3.0||>=2.0.0 <3.0.0"],
      ["x", "*"],
      ["2.*.*", ">=2.0.0 <3.0.0"],
      ["1.2.*", ">=1.2.0 <1.3.0"],
      ["1.2.* || 2.*", ">=1.2.0 <1.3.0||>=2.0.0 <3.0.0"],
      ["2", ">=2.0.0 <3.0.0"],
      ["2.3", ">=2.3.0 <2.4.0"],
      ["~2.4", ">=2.4.0 <2.5.0"],
      ["~2.4", ">=2.4.0 <2.5.0"],
      ["~>3.2.1", ">=3.2.1 <3.3.0"],
      ["~1", ">=1.0.0 <2.0.0"],
      ["~>1", ">=1.0.0 <2.0.0"],
      ["~1.0", ">=1.0.0 <1.1.0"],
      ["^0", ">=0.0.0 <1.0.0"],
      ["^0.1", ">=0.1.0 <0.2.0"],
      ["^1.0", ">=1.0.0 <2.0.0"],
      ["^1.2", ">=1.2.0 <2.0.0"],
      ["^0.0.1", ">=0.0.1 <0.0.2"],
      ["^0.0.1-beta", ">=0.0.1-beta <0.0.2"],
      ["^0.1.2", ">=0.1.2 <0.2.0"],
      ["^1.2.3", ">=1.2.3 <2.0.0"],
      ["^1.2.3-beta.4", ">=1.2.3-beta.4 <2.0.0"],
      ["<1", "<1.0.0"],
      [">=1", ">=1.0.0"],
      ["<1.2", "<1.2.0"],
      ["1", ">=1.0.0 <2.0.0"],
    ];

    for (const [r, expected] of versions) {
      await t.step({
        name: r,
        fn: () => {
          const range = parseRange(r);
          const actual = formatRange(range);
          assertEquals(actual, expected);
        },
      });
    }
  },
});
