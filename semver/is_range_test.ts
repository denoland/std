// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert } from "../assert/mod.ts";
import { ALL } from "./constants.ts";
import { isRange } from "./is_range.ts";

Deno.test({
  name: "isRange()",
  fn: async (t) => {
    let i = 0;
    const ranges: unknown[] = [[
      [ALL],
    ]];
    for (const r of ranges) {
      await t.step(`${(i++).toString().padStart(2, "0")}`, () => {
        const actual = isRange(r);
        assert(actual);
      });
    }
  },
});
