// Copyright 2018-2025 the Deno authors. MIT license.
// Copyright Isaac Z. Schlueter and npm contributors. All rights reserved. ISC license.

import { assert, assertEquals, assertFalse } from "@std/assert";
import {
  format,
  formatRange,
  greaterThanRange,
  parse,
  parseRange,
} from "./mod.ts";
import type { Operator } from "./types.ts";

Deno.test("greaterThanRange() checks if the semver is greater than the range", async (t) => {
  // from https://github.com/npm/node-semver/blob/692451bd6f75b38a71a99f39da405c94a5954a22/test/fixtures/version-gt-range.js
  const versionGtRange = [
    ["~1.2.2", "1.3.0"],
    ["~0.6.1-1", "0.7.1-1"],
    ["1.0.0 - 2.0.0", "2.0.1"],
    ["1.0.0", "1.0.1-beta1"],
    ["1.0.0", "2.0.0"],
    ["<=2.0.0", "2.1.1"],
    ["<=2.0.0", "3.2.9"],
    ["<2.0.0", "2.0.0"],
    ["0.1.20 || 1.2.4", "1.2.5"],
    ["2.x.x", "3.0.0"],
    ["1.2.x", "1.3.0"],
    ["1.2.x || 2.x", "3.0.0"],
    ["2.*.*", "5.0.1"],
    ["1.2.*", "1.3.3"],
    ["1.2.* || 2.*", "4.0.0"],
    ["2", "3.0.0"],
    ["2.3", "2.4.2"],
    ["~2.4", "2.5.0"], // >=2.4.0 <2.5.0
    ["~2.4", "2.5.5"],
    ["~>3.2.1", "3.3.0"], // >=3.2.1 <3.3.0
    ["~1", "2.2.3"], // >=1.0.0 <2.0.0
    ["~>1", "2.2.4"],
    ["~> 1", "3.2.3"],
    ["~1.0", "1.1.2"], // >=1.0.0 <1.1.0
    ["~ 1.0", "1.1.0"],
    ["<1.2", "1.2.0"],
    ["< 1.2", "1.2.1"],
    ["~v0.5.4-pre", "0.6.0"],
    ["~v0.5.4-pre", "0.6.1-pre"],
    ["=0.7.x", "0.8.0"],
    ["<0.7.x", "0.7.0"],
    ["1.0.0 - 2.0.0", "2.2.3"],
    ["1.0.0", "1.0.1"],
    ["<=2.0.0", "3.0.0"],
    ["<=2.0.0", "2.9999.9999"],
    ["<=2.0.0", "2.2.9"],
    ["<2.0.0", "2.9999.9999"],
    ["<2.0.0", "2.2.9"],
    ["2.x.x", "3.1.3"],
    ["1.2.x", "1.3.3"],
    ["1.2.x || 2.x", "3.1.3"],
    ["2.*.*", "3.1.3"],
    ["1.2.* || 2.*", "3.1.3"],
    ["2", "3.1.2"],
    ["2.3", "2.4.1"],
    ["~>3.2.1", "3.3.2"], // >=3.2.1 <3.3.0
    ["~>1", "2.2.3"],
    ["~1.0", "1.1.0"], // >=1.0.0 <1.1.0
    ["<1", "1.0.0"],
    ["=0.7.x", "0.8.2"],
    ["<0.7.x", "0.7.2"],
  ] as const;

  for (const [range, version] of versionGtRange) {
    const v = parse(version);
    const r = parseRange(range);
    const testName = `${format(v)} should be greater than ${formatRange(r)}`;
    await t.step(testName, () => {
      assert(greaterThanRange(v, r), testName);
    });
  }

  // from https://github.com/npm/node-semver/blob/692451bd6f75b38a71a99f39da405c94a5954a22/test/fixtures/version-not-gt-range.js
  const versionNotGtRange = [
    ["~0.6.1-1", "0.6.1-1"],
    ["1.0.0 - 2.0.0", "1.2.3"],
    ["1.0.0 - 2.0.0", "0.9.9"],
    ["1.0.0", "1.0.0"],
    [">=*", "0.2.4"],
    ["", "1.0.0", true],
    ["*", "1.2.3"],
    ["*", "1.2.3-foo"],
    [">=1.0.0", "1.0.0"],
    [">=1.0.0", "1.0.1"],
    [">=1.0.0", "1.1.0"],
    [">1.0.0", "1.0.1"],
    [">1.0.0", "1.1.0"],
    ["<=2.0.0", "2.0.0"],
    ["<=2.0.0", "1.9999.9999"],
    ["<=2.0.0", "0.2.9"],
    ["<2.0.0", "1.9999.9999"],
    ["<2.0.0", "0.2.9"],
    [">= 1.0.0", "1.0.0"],
    [">=  1.0.0", "1.0.1"],
    [">=   1.0.0", "1.1.0"],
    ["> 1.0.0", "1.0.1"],
    [">  1.0.0", "1.1.0"],
    ["<=   2.0.0", "2.0.0"],
    ["<= 2.0.0", "1.9999.9999"],
    ["<=  2.0.0", "0.2.9"],
    ["<    2.0.0", "1.9999.9999"],
    ["<\t2.0.0", "0.2.9"],
    [">=0.1.97", "v0.1.97"],
    [">=0.1.97", "0.1.97"],
    ["0.1.20 || 1.2.4", "1.2.4"],
    ["0.1.20 || >1.2.4", "1.2.4"],
    ["0.1.20 || 1.2.4", "1.2.3"],
    ["0.1.20 || 1.2.4", "0.1.20"],
    [">=0.2.3 || <0.0.1", "0.0.0"],
    [">=0.2.3 || <0.0.1", "0.2.3"],
    [">=0.2.3 || <0.0.1", "0.2.4"],
    ["||", "1.3.4"],
    ["2.x.x", "2.1.3"],
    ["1.2.x", "1.2.3"],
    ["1.2.x || 2.x", "2.1.3"],
    ["1.2.x || 2.x", "1.2.3"],
    ["x", "1.2.3"],
    ["2.*.*", "2.1.3"],
    ["1.2.*", "1.2.3"],
    ["1.2.* || 2.*", "2.1.3"],
    ["1.2.* || 2.*", "1.2.3"],
    ["2", "2.1.2"],
    ["2.3", "2.3.1"],
    ["~2.4", "2.4.0"], // >=2.4.0 <2.5.0
    ["~2.4", "2.4.5"],
    ["~>3.2.1", "3.2.2"], // >=3.2.1 <3.3.0
    ["~1", "1.2.3"], // >=1.0.0 <2.0.0
    ["~>1", "1.2.3"],
    ["~> 1", "1.2.3"],
    ["~1.0", "1.0.2"], // >=1.0.0 <1.1.0
    ["~ 1.0", "1.0.2"],
    [">=1", "1.0.0"],
    [">= 1", "1.0.0"],
    ["<1.2", "1.1.1"],
    ["< 1.2", "1.1.1"],
    ["~v0.5.4-pre", "0.5.5"],
    ["~v0.5.4-pre", "0.5.4"],
    ["=0.7.x", "0.7.2"],
    [">=0.7.x", "0.7.2"],
    ["=0.7.x", "0.7.0-asdf"],
    [">=0.7.x", "0.7.0-asdf"],
    ["<=0.7.x", "0.6.2"],
    [">0.2.3 >0.2.4 <=0.2.5", "0.2.5"],
    [">=0.2.3 <=0.2.4", "0.2.4"],
    ["1.0.0 - 2.0.0", "2.0.0"],
    ["^1", "0.0.0-0"],
    ["^3.0.0", "2.0.0"],
    ["^1.0.0 || ~2.0.1", "2.0.0"],
    ["^0.1.0 || ~3.0.1 || 5.0.0", "3.2.0"],
    ["^0.1.0 || ~3.0.1 || 5.0.0", "5.0.0-0", true],
    ["^0.1.0 || ~3.0.1 || >4 <=5.0.0", "3.5.0"],
  ] as const;

  for (const [range, version] of versionNotGtRange) {
    const v = parse(version);
    const r = parseRange(range);
    const testName = `${format(v)} should not be greater than ${
      formatRange(r)
    }`;
    await t.step(testName, () => {
      assertFalse(greaterThanRange(v, r), testName);
    });
  }
});

Deno.test("greaterThanRange() handles equals operator", () => {
  const version = {
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: [],
    build: [],
  };
  const range = [[{
    operator: "=" as unknown as Operator,
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: [],
    build: [],
  }]];
  assertEquals(greaterThanRange(version, range), false);
});

Deno.test("greaterThanRange() handles not equals operator", () => {
  const version = {
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: [],
    build: [],
  };
  const range = [[{
    operator: "!=" as const,
    major: 1,
    minor: 0,
    patch: 0,
    prerelease: [],
    build: [],
  }]];
  // FIXME(kt3k): This demonstrates a bug. This should be false
  assertEquals(greaterThanRange(version, range), true);
});
