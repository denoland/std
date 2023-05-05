// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals } from "../testing/asserts.ts";
import * as semver from "./mod.ts";
import { outside } from "./_outside.ts";

Deno.test({
  name: "comparators",
  fn: async (t) => {
    const versions: [string, string[], string[]][] = [
      [
        "1.0.0 - 2.0.0",
        ["1.0.0", "1.2.3", "2.0.0"],
        ["0.0.0", "2.0.1"],
      ],
      ["1.0.0", ["1.0.0"], ["0.0.0", "1.0.1"]],
      [">=*", ["0.0.0", "9999.9999.9999"], []],
      ["", ["0.0.0"], []],
      ["*", ["0.0.0", "9999.9999.9999"], []],
      [">=1.0.0", ["1.0.0", "9999.9999.9999"], ["0.1.2", "0.0.0"]],
      [">1.0.0", ["1.0.1", "9999.9999.9999"], ["0.1.2", "0.0.0", "1.0.0"]],
      ["<=2.0.0", ["0.0.0", "1.0.1", "2.0.0"], ["2.0.1", "9999.9999.9999"]],
      ["<2.0.0", ["0.0.0", "1.0.1", "1.2.3"], ["2.0.0", "9999.9999.9999"]],
      ["1", ["1.0.0", "1.0.1", "1.2.3"], ["0.0.0", "2.0.0", "9999.9999.9999"]],
      [">=0.1.97", ["0.1.97", "1.0.0", "9999.9999.9999"], ["0.0.0", "0.1.96"]],
      ["0.1.20", ["0.1.20"], ["0.0.0", "0.1.19", "0.1.21", "9999.9999.9999"]],
      [">=0.2.3", ["0.2.3", "0.2.4", "1.0.0"], ["0.0.0", "0.2.2", "0.1.0"]],
      ["||", ["0.0.0", "9999.9999.9999"], []],
      ["2.x.x", ["2.0.0", "2.9999.9999"], ["1.9999.9999", "3.0.0"]],
      ["1.2.x", ["1.2.0", "1.2.9999"], ["1.1.9999", "1.3.0"]],
      [
        "1.2.x || 2.x",
        ["1.2.0", "1.2.9999", "2.0.0", "2.9999.9999"],
        ["1.1.9999", "1.3.0", "3.0.0"],
      ],
      ["x", ["0.0.0", "9999.9999.9999"], []],
      ["2.*.*", ["2.0.0", "2.9999.9999"], ["1.9999.9999", "3.0.0"]],
      ["1.2.*", ["1.2.0", "1.2.9999"], ["1.1.9999", "1.3.0"]],
      [
        "1.2.* || 2.*",
        ["1.2.0", "1.2.9999", "2.0.0", "2.9999.9999"],
        ["1.1.9999", "1.3.0", "3.0.0"],
      ],
      ["*", ["0.0.0", "9999.9999.9999"], []],
      ["2", ["2.0.0", "2.0.1", "2.2.3"], [
        "0.0.0",
        "1.9999.9999",
        "3.0.0",
        "9999.9999.9999",
      ]],
      ["2.3", ["2.3.0", "2.3.1", "2.3.9999"], [
        "0.0.0",
        "2.2.9999",
        "2.4.0",
        "9999.9999.9999",
      ]],
      ["~2.4", ["2.4.0", "2.4.9999"], [
        "0.0.0",
        "2.3.9999",
        "2.5.0",
        "9999.9999.9999",
      ]],
      ["~>3.2.1", ["3.2.1", "3.2.9999"], [
        "0.0.0",
        "3.2.0",
        "3.3.0",
        "9999.9999.9999",
      ]],
      ["~1", ["1.0.0", "1.9999.9999"], [
        "0.0.0",
        "0.9999.9999",
        "2.0.0",
        "9999.9999.9999",
      ]],
      ["~>1", ["1.0.0", "1.9999.9999"], [
        "0.0.0",
        "0.9999.9999",
        "2.0.0",
        "9999.9999.9999",
      ]],
      ["~1.0", ["1.0.0", "1.0.9999"], [
        "0.0.0",
        "0.9999.9999",
        "1.1.0",
        "9999.9999.9999",
      ]],
      ["<1", ["0.0.0", "0.9999.9999"], ["1.0.0", "9999.9999.9999"]],
      [">=1", ["1.0.0", "9999.9999.9999"], ["0.0.0", "0.9999.9999"]],
      ["<1.2", ["0.0.0", "1.1.0"], ["1.2.0", "9999.9999.9999"]],

      // This is effectively 1 & 2, which matches nothing.
      ["1 2", [], [
        "1.0.0",
        "1.9999.9999",
        "2.0.0",
        "2.9999.9999",
        "0.0.0",
        "0.9999.9999",
        "3.0.0",
        "9999.9999.9999",
      ]],
      ["1.2 - 3.4.5", ["1.2.0", "1.2.3", "3.4.5"], [
        "0.0.0",
        "1.1.9999",
        "3.4.6",
        "9999.9999.9999",
      ]],
      ["1.2.3 - 3.4", ["1.2.3", "2.0.0", "3.4.9999"], [
        "0.0.0",
        "1.2.2",
        "3.5.0",
        "9999.9999.9999",
      ]],
      ["1.2.3 - 3", ["1.2.3", "2.0.0", "3.0.0", "3.9999.9999"], [
        "0.0.0",
        "1.2.2",
        "4.0.0",
        "9999.9999.9999",
      ]],

      // Nothing can match...
      [">*", [], ["0.0.0", "9999.9999.9999"]],
      ["<*", [], ["0.0.0", "9999.9999.9999"]],
    ];

    for (const [range, validVersions, invalidVersions] of versions) {
      await t.step({
        name: `${range}`,
        fn: async (t) => {
          const r = semver.parseRange(range);
          for (const valid of validVersions) {
            await t.step({
              name: `${valid} ∋ ${range}`,
              fn: () => {
                const version = semver.parse(valid);
                const actual = semver.rangeTest(version, r);
                assertEquals(true, actual);
              },
            });
          }
          for (const invalid of invalidVersions) {
            await t.step({
              name: `${invalid} ∌ ${range}`,
              fn: () => {
                const actual = semver.rangeTest(semver.parse(invalid), r);
                assertEquals(false, actual);
              },
            });
          }
        },
      });
    }
  },
});

Deno.test("test", function () {
  const c = semver.parseComparator(">=1.2.3");
  assert(semver.comparatorTest(semver.parse("1.2.4"), c));
});

Deno.test("intersect", async (t) => {
  const versions: [string, string, boolean][] = [
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

    // Different directions, same semver and inclusive operator
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
  for (const v of versions) {
    const comparator1 = semver.parseComparator(v[0]);
    const comparator2 = semver.parseComparator(v[1]);
    const expect = v[2];
    await t.step({
      name: `${v[0]} ${expect ? "∩" : "∁"} ${v[1]}`,
      fn: () => {
        const actual1 = semver.comparatorIntersects(comparator1, comparator2);
        const actual2 = semver.comparatorIntersects(comparator2, comparator1);
        const actual3 = semver.rangeIntersects(
          { ranges: [[comparator1]] },
          { ranges: [[comparator2]] },
        );
        const actual4 = semver.rangeIntersects(
          { ranges: [[comparator2]] },
          { ranges: [[comparator1]] },
        );
        assertEquals(actual1, expect);
        assertEquals(actual2, expect);
        assertEquals(actual3, expect);
        assertEquals(actual4, expect);
      },
    });
  }
});

Deno.test({
  name: "outside",
  fn: async (t) => {
    const steps: [string, string, boolean][] = [
      ["1.2.3", "1.0.0 - 1.2.2", true],
      ["1.2.3", "1.0.0 - 1.2.3", false],
      ["0.0.0", "1.0.0 - 1.2.2", true],
      ["1.0.0", "1.0.0 - 1.2.3", false],
    ];
    for (const [version, range, expected] of steps) {
      await t.step({
        name: `${range} ${expected ? "∋" : "∌"} ${version}`,
        fn: () => {
          const v = semver.parse(version);
          const r = semver.parseRange(range);
          const actual = outside(v, r);
          assertEquals(actual, expected);
        },
      });
    }
  },
});

Deno.test("tostrings", function () {
  assertEquals(
    semver.comparatorFormat(semver.parseComparator(">= v1.2.3")),
    ">=1.2.3",
  );
  assertEquals(
    semver.comparatorFormat(semver.parseComparator(">= v1.2.3-pre.1+b.2")),
    ">=1.2.3-pre.1+b.2",
  );
});
