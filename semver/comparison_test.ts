// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals, assertThrows } from "../testing/asserts.ts";
import * as semver from "./mod.ts";

Deno.test("comparison", function () {
  // [version1, version2]
  // version1 should be greater than version2
  const versions: [string, string][] = [
    ["0.0.0", "0.0.0-foo"],
    ["0.0.1", "0.0.0"],
    ["1.0.0", "0.9.9"],
    ["0.10.0", "0.9.0"],
    ["0.99.0", "0.10.0"],
    ["2.0.0", "1.2.3"],
    ["1.2.3", "1.2.3-asdf"],
    ["1.2.3", "1.2.3-4"],
    ["1.2.3", "1.2.3-4-foo"],
    ["1.2.3-5-foo", "1.2.3-5"],
    ["1.2.3-5", "1.2.3-4"],
    ["1.2.3-5-foo", "1.2.3-5-Foo"],
    ["3.0.0", "2.7.2+asdf"],
    ["1.2.3-a.10", "1.2.3-a.5"],
    ["1.2.3-a.b", "1.2.3-a.5"],
    ["1.2.3-a.b", "1.2.3-a"],
    ["1.2.3-a.b.c.10.d.5", "1.2.3-a.b.c.5.d.100"],
    ["1.2.3-r2", "1.2.3-r100"],
    ["1.2.3-r100", "1.2.3-R2"],
  ];

  versions.forEach(function (v) {
    const v0 = v[0];
    const v1 = v[1];
    assert(semver.gt(v0, v1), "gt('" + v0 + "', '" + v1 + "')");
    assert(semver.lt(v1, v0), "lt('" + v1 + "', '" + v0 + "')");
    assert(!semver.gt(v1, v0), "!gt('" + v1 + "', '" + v0 + "')");
    assert(!semver.lt(v0, v1), "!lt('" + v0 + "', '" + v1 + "')");
    assert(semver.eq(v0, v0), "eq('" + v0 + "', '" + v0 + "')");
    assert(semver.eq(v1, v1), "eq('" + v1 + "', '" + v1 + "')");
    assert(semver.neq(v0, v1), "neq('" + v0 + "', '" + v1 + "')");
    assert(
      semver.cmp(v1, "==", v1),
      "cmp('" + v1 + "' == '" + v1 + "')",
    );
    assert(
      semver.cmp(v0, ">=", v1),
      "cmp('" + v0 + "' >= '" + v1 + "')",
    );
    assert(
      semver.cmp(v1, "<=", v0),
      "cmp('" + v1 + "' <= '" + v0 + "')",
    );
    assert(
      semver.cmp(v0, "!=", v1),
      "cmp('" + v0 + "' != '" + v1 + "')",
    );
  });
});

Deno.test("compareBuild", function () {
  const noBuild = new semver.SemVer("1.0.0");
  const build0 = new semver.SemVer("1.0.0+0");
  const build1 = new semver.SemVer("1.0.0+1");
  const build10 = new semver.SemVer("1.0.0+1.0");
  assertEquals(noBuild.compareBuild(build0), -1);
  assertEquals(build0.compareBuild(build0), 0);
  assertEquals(build0.compareBuild(noBuild), 1);

  assertEquals(build0.compareBuild("1.0.0+0.0"), -1);
  assertEquals(build0.compareBuild(build1), -1);
  assertEquals(build1.compareBuild(build0), 1);
  assertEquals(build10.compareBuild(build1), 1);
});

Deno.test("rcompare", function () {
  assertEquals(semver.rcompare("1.0.0", "1.0.1"), 1);
  assertEquals(semver.rcompare("1.0.0", "1.0.0"), 0);
  assertEquals(semver.rcompare("1.0.0+0", "1.0.0"), 0);
  assertEquals(semver.rcompare("1.0.1", "1.0.0"), -1);
});

Deno.test("compareMainVsPre", function () {
  const s = new semver.SemVer("1.2.3");
  assertEquals(s.compareMain("2.3.4"), -1);
  assertEquals(s.compareMain("1.2.4"), -1);
  assertEquals(s.compareMain("0.1.2"), 1);
  assertEquals(s.compareMain("1.2.2"), 1);
  assertEquals(s.compareMain("1.2.3-pre"), 0);

  const p = new semver.SemVer("1.2.3-alpha.0.pr.1");
  assertEquals(p.comparePre("9.9.9-alpha.0.pr.1"), 0);
  assertEquals(p.comparePre("1.2.3"), -1);
  assertEquals(p.comparePre("1.2.3-alpha.0.pr.2"), -1);
  assertEquals(p.comparePre("1.2.3-alpha.0.2"), 1);
});

Deno.test("compareIdentifierst", function () {
  const set = [
    ["1", "2"],
    ["alpha", "beta"],
    ["0", "beta"],
  ];
  set.forEach(function (ab) {
    const a = ab[0];
    const b = ab[1];
    assertEquals(semver.compareIdentifiers(a, b), -1);
    assertEquals(semver.rcompareIdentifiers(a, b), 1);
  });
  assertEquals(semver.compareIdentifiers("0", "0"), 0);
  assertEquals(semver.rcompareIdentifiers("0", "0"), 0);
});

Deno.test("invalidCmpUsage", function () {
  assertThrows(
    function () {
      semver.cmp("1.2.3", "a frog" as semver.Operator, "4.5.6");
    },
    TypeError,
    "Invalid operator: a frog",
  );
});
