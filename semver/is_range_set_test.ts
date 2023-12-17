// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert } from "../assert/mod.ts";
import { ALL } from "./constants.ts";
import { isRangeSet } from "./is_range_set.ts";

Deno.test({
  name: "valid_range",
  fn: async (t) => {
    let i = 0;
    const ranges: unknown[] = [
      [
        [ALL],
      ],
    ];
    for (const r of ranges) {
      await t.step(`valid_range_${(i++).toString().padStart(2, "0")}`, () => {
        const actual = isRangeSet(r);
        assert(actual);
      });
    }
  },
});
