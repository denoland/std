// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert } from "../assert/mod.ts";
import { INVALID, MIN } from "./constants.ts";
import { isComparator } from "./_is_comparator.ts";
import { formatComparator } from "./_format_comparator.ts";
import type { Comparator } from "./types.ts";

Deno.test({
  name: "isComparator()",
  fn: async (t) => {
    const comparators: unknown[] = [
      {
        operator: ">=",
        semver: { major: 0, minor: 0, patch: 0, prerelease: [], build: [] },
        min: { major: 0, minor: 0, patch: 0, prerelease: [], build: [] },
        max: { major: 0, minor: 0, patch: 0, prerelease: [], build: [] },
      },
      {
        operator: "<",
        semver: MIN,
        min: INVALID,
        max: INVALID,
      },
    ];
    for (const c of comparators) {
      await t.step(
        `${formatComparator(c as Comparator)}`,
        () => {
          const actual = isComparator(c);
          assert(actual);
        },
      );
    }
  },
});
