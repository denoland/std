// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { outside } from "./outside.ts";
import { parse } from "./parse.ts";
import { parseRange } from "./parse_range.ts";

Deno.test({
  name: "outside",
  fn: async (t) => {
    const steps: [string, string, boolean][] = [
      ["1.2.3", "1.0.0 - 1.2.2", true],
      ["1.2.3", "1.0.0 - 1.2.3", false],
      ["0.0.0", "1.0.0 - 1.2.2", true],
      ["1.0.0", "1.0.0 - 1.2.3", false],
      /**
       * This test case is included because it aligns with `npm:semver`
       * behavior. However, this behavior appears to be a bug.
       *
       * @see {@link https://github.com/denoland/deno_std/issues/3948#issuecomment-1876875415}
       */
      ["2.5.0", ">= 1.0.0 < 2.0.0 || >=3.0.0 < 4.0.0", true],
    ];
    for (const [version, range, expected] of steps) {
      await t.step({
        name: `${range} ${expected ? "∋" : "∌"} ${version}`,
        fn: () => {
          const v = parse(version);
          const r = parseRange(range);
          const actual = outside(v, r);
          assertEquals(actual, expected);
        },
      });
    }
  },
});
