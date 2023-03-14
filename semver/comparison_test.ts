// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../testing/asserts.ts";
import * as semver from "./mod.ts";

// Deno.test("comparison", function () {
//   // [version1, version2]
//   // version1 should be greater than version2
//   const versions: [string, string][] = [
//     ["0.0.0", "0.0.0-foo"],
//     ["0.0.1", "0.0.0"],
//     ["1.0.0", "0.9.9"],
//     ["0.10.0", "0.9.0"],
//     ["0.99.0", "0.10.0"],
//     ["2.0.0", "1.2.3"],
//     ["1.2.3", "1.2.3-asdf"],
//     ["1.2.3", "1.2.3-4"],
//     ["1.2.3", "1.2.3-4-foo"],
//     ["1.2.3-5-foo", "1.2.3-5"],
//     ["1.2.3-5", "1.2.3-4"],
//     ["1.2.3-5-foo", "1.2.3-5-Foo"],
//     ["3.0.0", "2.7.2+asdf"],
//     ["1.2.3-a.10", "1.2.3-a.5"],
//     ["1.2.3-a.b", "1.2.3-a.5"],
//     ["1.2.3-a.b", "1.2.3-a"],
//     ["1.2.3-a.b.c.10.d.5", "1.2.3-a.b.c.5.d.100"],
//     ["1.2.3-r2", "1.2.3-r100"],
//     ["1.2.3-r100", "1.2.3-R2"],
//   ];

//   versions.forEach(function (v) {
//     const v0 = v[0];
//     const v1 = v[1];
//     assert(semver.gt(v0, v1), "gt('" + v0 + "', '" + v1 + "')");
//     assert(semver.lt(v1, v0), "lt('" + v1 + "', '" + v0 + "')");
//     assert(!semver.gt(v1, v0), "!gt('" + v1 + "', '" + v0 + "')");
//     assert(!semver.lt(v0, v1), "!lt('" + v0 + "', '" + v1 + "')");
//     assert(semver.eq(v0, v0), "eq('" + v0 + "', '" + v0 + "')");
//     assert(semver.eq(v1, v1), "eq('" + v1 + "', '" + v1 + "')");
//     assert(semver.neq(v0, v1), "neq('" + v0 + "', '" + v1 + "')");
//     assert(
//       semver.cmp(v1, "==", v1),
//       "cmp('" + v1 + "' == '" + v1 + "')",
//     );
//     assert(
//       semver.cmp(v0, ">=", v1),
//       "cmp('" + v0 + "' >= '" + v1 + "')",
//     );
//     assert(
//       semver.cmp(v1, "<=", v0),
//       "cmp('" + v1 + "' <= '" + v0 + "')",
//     );
//     assert(
//       semver.cmp(v0, "!=", v1),
//       "cmp('" + v0 + "' != '" + v1 + "')",
//     );
//   });
// });

// Deno.test("compareBuild", function () {
//   const noBuild = new semver.SemVer("1.0.0");
//   const build0 = new semver.SemVer("1.0.0+0");
//   const build1 = new semver.SemVer("1.0.0+1");
//   const build10 = new semver.SemVer("1.0.0+1.0");
//   assertEquals(noBuild.compareBuild(build0), -1);
//   assertEquals(build0.compareBuild(build0), 0);
//   assertEquals(build0.compareBuild(noBuild), 1);

//   assertEquals(build0.compareBuild("1.0.0+0.0"), -1);
//   assertEquals(build0.compareBuild(build1), -1);
//   assertEquals(build1.compareBuild(build0), 1);
//   assertEquals(build10.compareBuild(build1), 1);
// });

// Deno.test("rcompare", function () {
//   assertEquals(semver.rcompare("1.0.0", "1.0.1"), 1);
//   assertEquals(semver.rcompare("1.0.0", "1.0.0"), 0);
//   assertEquals(semver.rcompare("1.0.0+0", "1.0.0"), 0);
//   assertEquals(semver.rcompare("1.0.1", "1.0.0"), -1);
// });

Deno.test("compareMainVsPre", async (t) => {
  const cases: [string, string, number][] = [
    ["1.2.3", "1.2.3", 0],
    ["1.2.3", "2.3.4", -1],
    ["1.2.3", "0.1.2", 1],
    ["1.2.3", "1.2.2", 1],
    ["1.2.3", "1.2.3-pre", 1],

    ["1.2.3-alpha.0.pr.1", "1.2.3-alpha.0.pr.1", 0],
    ["1.2.3-alpha.0.pr.1", "9.9.9-alpha.0.pr.1", -1],
    ["1.2.3-alpha.0.pr.1", "1.2.3", -1],
    ["1.2.3-alpha.0.pr.1", "1.2.3-alpha.0.pr.2", -1],
    ["1.2.3-alpha.0.pr.1", "1.2.3-alpha.0.2", -1],
    ["1.2.3-alpha.0.pr.1", "1.2.3-alpha.pr.0", 1],
  ];
  for (const [v0, v1, expected] of cases) {
    const s0 = semver.parse(v0);
    const s1 = semver.parse(v1);
    await t.step(`${v0} <=> ${v1}`, () => {
      const actual = semver.compare(s0, s1);
      if (actual != expected) {
        console.log({ v0, v1, s0, s1, actual, expected });
      }
      assertEquals(actual, expected);
    });
  }
});

Deno.test("compareIdentifierst", async (t) => {
  const set = [
    ["0", "0", 0],
    ["1", "2", -1],
    ["2", "1", 1],

    ["alpha", "beta", -1],
    ["0", "beta", -1],

    [0, 0, 0],
    [1, 0, 1],
    [1, "1", 1],
    [0, "1", 1],
    [1, 2, -1],
  ];
  for (const [a, b, expected] of set) {
    await t.step(`${JSON.stringify(a)} <=> ${JSON.stringify(b)}`, () => {
      assertEquals(semver.compareIdentifier([a], [b]), expected);
    });
  }
});

Deno.test("invalidCmpUsage", function () {
  assertThrows(
    () =>
      semver.cmp(
        semver.parse("1.2.3"),
        "a frog" as semver.Operator,
        semver.parse("4.5.6"),
      ),
    TypeError,
    "Invalid operator: a frog",
  );
});
