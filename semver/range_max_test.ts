// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { parseRange } from "./parse_range.ts";
import { rangeMax } from "./range_max.ts";
import { INVALID } from "./constants.ts";
import type { SemVer } from "./types.ts";
import { assertEquals } from "../assert/assert_equals.ts";

Deno.test({
  name: "rangeMax()",
  fn: async (t) => {
    const versions: [string, SemVer][] = [
      ["=1.0.0", { major: 1, minor: 0, patch: 0, prerelease: [], build: [] }],
      ["1.0.0", { major: 1, minor: 0, patch: 0, prerelease: [], build: [] }],
      ["1.0", {
        major: 1,
        minor: 0,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      ["1", {
        major: 1,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],

      ["1.0.x", {
        major: 1,
        minor: 0,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      ["1.x.x", {
        major: 1,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      ["1.x", {
        major: 1,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],

      ["1.0.*", {
        major: 1,
        minor: 0,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      ["1.*.*", {
        major: 1,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      ["1.*", {
        major: 1,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      ["*", {
        major: Number.POSITIVE_INFINITY,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],

      ["1.*.x", {
        major: 1,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      ["1.x.*", {
        major: 1,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],

      ["~1.1.1", {
        major: 1,
        minor: 1,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      ["~1.1.1-beta", {
        major: 1,
        minor: 1,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],

      ["^1.1.1", {
        major: 1,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      ["^1.1.1-beta", {
        major: 1,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],

      ["1.1.1 - 1.8.0", {
        major: 1,
        minor: 8,
        patch: 0,
        prerelease: [],
        build: [],
      }],
      ["1.1 - 1.8.0", {
        major: 1,
        minor: 8,
        patch: 0,
        prerelease: [],
        build: [],
      }],
      ["1.1.1 - 1.8", {
        major: 1,
        minor: 8,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],

      ["<1.0.0", {
        build: [],
        major: 0,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
      }],
      ["<1.0.0-0", {
        build: [],
        major: 0,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
      }],
      ["<1.0.0-beta", {
        build: [],
        major: 0,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
      }],

      [">1.0.0", {
        major: Number.POSITIVE_INFINITY,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      [">1.0.0-0", {
        major: Number.POSITIVE_INFINITY,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      [">1.0.0-beta", {
        major: Number.POSITIVE_INFINITY,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],

      ["<0.0.0-beta", INVALID],
      [">0.0.0-beta", {
        build: [],
        major: Number.POSITIVE_INFINITY,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
      }],
      ["<0.0.1-beta", {
        major: 0,
        minor: 0,
        patch: 0,
        prerelease: [],
        build: [],
      }],
      [">0.0.1-beta", {
        major: Number.POSITIVE_INFINITY,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],

      ["<2 || >4", {
        major: Number.POSITIVE_INFINITY,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      [">=4 || <=2", {
        major: Number.POSITIVE_INFINITY,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],

      [">=1.1.1 <2 || >=2.2.2 <2", {
        major: 1,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      [">=2.2.2 <2 || >=1.1.1 <2", {
        major: 1,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],

      [">2 || >1.0.0", {
        major: Number.POSITIVE_INFINITY,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      [">2 || >1.0.0-0", {
        major: Number.POSITIVE_INFINITY,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],
      [">2 || >1.0.0-beta", {
        major: Number.POSITIVE_INFINITY,
        minor: Number.POSITIVE_INFINITY,
        patch: Number.POSITIVE_INFINITY,
        prerelease: [],
        build: [],
      }],

      ["<0.0.0-beta >0.0.0-alpha", INVALID],
      [">0.0.0-alpha <0.0.0-beta", INVALID],
      [">4 <3", INVALID],
    ];

    for (const [version, expected] of versions) {
      await t.step(version, () => {
        const actual = rangeMax(parseRange(version));
        assertEquals(actual, expected);
      });
    }
  },
});
