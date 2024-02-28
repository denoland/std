// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert } from "../assert/mod.ts";
import { ALL, MIN } from "./constants.ts";
import { isRange } from "./is_range.ts";

Deno.test({
  name: "isRange()",
  fn: async (t) => {
    let i = 0;
    const ranges: unknown[] = [[
      [ALL],
      [{
        operator: ">=",
        semver: { major: 0, minor: 0, patch: 0, prerelease: [], build: [] },
      }],
      [{
        operator: "<",
        semver: MIN,
      }],
      [{
        operator: ">=",
        major: 0,
        minor: 0,
        patch: 0,
        prerelease: [],
        build: [],
      }],
      [{ operator: "<", ...MIN }],
    ]];
    for (const r of ranges) {
      await t.step(`${(i++).toString().padStart(2, "0")}`, () => {
        const actual = isRange(r);
        assert(actual);
      });
    }
  },
});
