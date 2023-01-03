// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals } from "../testing/asserts.ts";
import * as semver from "./mod.ts";

type Version = string;

Deno.test("comparators", function () {
  // [range, comparators]
  // turn range into a set of individual comparators
  const versions: [Version, string[][]][] = [
    ["1.0.0 - 2.0.0", [[">=1.0.0", "<=2.0.0"]]],
    ["1.0.0", [["1.0.0"]]],
    [">=*", [[""]]],
    ["", [[""]]],
    ["*", [[""]]],
    ["*", [[""]]],
    [">=1.0.0", [[">=1.0.0"]]],
    [">=1.0.0", [[">=1.0.0"]]],
    [">=1.0.0", [[">=1.0.0"]]],
    [">1.0.0", [[">1.0.0"]]],
    [">1.0.0", [[">1.0.0"]]],
    ["<=2.0.0", [["<=2.0.0"]]],
    ["1", [[">=1.0.0", "<2.0.0"]]],
    ["<=2.0.0", [["<=2.0.0"]]],
    ["<=2.0.0", [["<=2.0.0"]]],
    ["<2.0.0", [["<2.0.0"]]],
    ["<2.0.0", [["<2.0.0"]]],
    [">=0.1.97", [[">=0.1.97"]]],
    [">=0.1.97", [[">=0.1.97"]]],
    ["0.1.20 || 1.2.4", [["0.1.20"], ["1.2.4"]]],
    [">=0.2.3 || <0.0.1", [[">=0.2.3"], ["<0.0.1"]]],
    [">=0.2.3 || <0.0.1", [[">=0.2.3"], ["<0.0.1"]]],
    [">=0.2.3 || <0.0.1", [[">=0.2.3"], ["<0.0.1"]]],
    ["||", [[""], [""]]],
    ["2.x.x", [[">=2.0.0", "<3.0.0"]]],
    ["1.2.x", [[">=1.2.0", "<1.3.0"]]],
    [
      "1.2.x || 2.x",
      [
        [">=1.2.0", "<1.3.0"],
        [">=2.0.0", "<3.0.0"],
      ],
    ],
    [
      "1.2.x || 2.x",
      [
        [">=1.2.0", "<1.3.0"],
        [">=2.0.0", "<3.0.0"],
      ],
    ],
    ["x", [[""]]],
    ["2.*.*", [[">=2.0.0", "<3.0.0"]]],
    ["1.2.*", [[">=1.2.0", "<1.3.0"]]],
    [
      "1.2.* || 2.*",
      [
        [">=1.2.0", "<1.3.0"],
        [">=2.0.0", "<3.0.0"],
      ],
    ],
    [
      "1.2.* || 2.*",
      [
        [">=1.2.0", "<1.3.0"],
        [">=2.0.0", "<3.0.0"],
      ],
    ],
    ["*", [[""]]],
    ["2", [[">=2.0.0", "<3.0.0"]]],
    ["2.3", [[">=2.3.0", "<2.4.0"]]],
    ["~2.4", [[">=2.4.0", "<2.5.0"]]],
    ["~2.4", [[">=2.4.0", "<2.5.0"]]],
    ["~>3.2.1", [[">=3.2.1", "<3.3.0"]]],
    ["~1", [[">=1.0.0", "<2.0.0"]]],
    ["~>1", [[">=1.0.0", "<2.0.0"]]],
    ["~1.0", [[">=1.0.0", "<1.1.0"]]],
    ["<1", [["<1.0.0"]]],
    [">=1", [[">=1.0.0"]]],
    ["<1.2", [["<1.2.0"]]],
    ["1", [[">=1.0.0", "<2.0.0"]]],
    ["1 2", [[">=1.0.0", "<2.0.0", ">=2.0.0", "<3.0.0"]]],
    ["1.2 - 3.4.5", [[">=1.2.0", "<=3.4.5"]]],
    ["1.2.3 - 3.4", [[">=1.2.3", "<3.5.0"]]],
    ["1.2.3 - 3", [[">=1.2.3", "<4.0.0"]]],
    [">*", [["<0.0.0"]]],
    ["<*", [["<0.0.0"]]],
  ];

  versions.forEach(function (v) {
    const pre = v[0];
    const wanted = v[1];
    const found = semver.toComparators(v[0]);
    const jw = JSON.stringify(wanted);
    assertEquals(found, wanted, "toComparators(" + pre + ") === " + jw);
  });
});

Deno.test("test", function () {
  const c = new semver.Comparator(">=1.2.3");
  assert(c.test("1.2.4"));
  const c2 = new semver.Comparator(c);
  assert(c2.test("1.2.4"));
});

Deno.test("intersect", function () {
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

  versions.forEach(function (v) {
    const comparator1 = new semver.Comparator(v[0]);
    const comparator2 = new semver.Comparator(v[1]);
    const expect = v[2];

    const actual1 = comparator1.intersects(comparator2);
    const actual2 = comparator2.intersects(comparator1);
    const actual3 = semver.intersects(comparator1, comparator2);
    const actual4 = semver.intersects(comparator2, comparator1);
    const actual5 = semver.intersects(v[0], v[1]);
    const actual6 = semver.intersects(v[1], v[0]);

    assertEquals(actual1, expect);
    assertEquals(actual2, expect);
    assertEquals(actual3, expect);
    assertEquals(actual4, expect);
    assertEquals(actual5, expect);
    assertEquals(actual6, expect);
  });
});

Deno.test("tostrings", function () {
  assertEquals(new semver.Comparator(">= v1.2.3").toString(), ">=1.2.3");
});
