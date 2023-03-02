// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert } from "../testing/asserts.ts";
import * as semver from "./mod.ts";

Deno.test("equality", function () {
  // [version1, version2]
  // version1 should be equivalent to version2
  const versions: [string, string][] = [
    ["1.2.3-beta+build", "1.2.3-beta+otherbuild"],
    ["1.2.3+build", "1.2.3+otherbuild"],
    ["  v1.2.3+build", "1.2.3+otherbuild"],
  ];

  versions.forEach(function (v) {
    const v0 = v[0];
    const v1 = v[1];

    assert(semver.eq(v0, v1), "eq('" + v0 + "', '" + v1 + "')");
    assert(!semver.neq(v0, v1), "!neq('" + v0 + "', '" + v1 + "')");
    assert(semver.cmp(v0, "==", v1), "cmp(" + v0 + "==" + v1 + ")");
    assert(!semver.cmp(v0, "!=", v1), "!cmp(" + v0 + "!=" + v1 + ")");
    assert(!semver.cmp(v0, "===", v1), "!cmp(" + v0 + "===" + v1 + ")");

    assert(semver.cmp(v0, "!==", v1), "cmp(" + v0 + "!==" + v1 + ")");

    assert(
      !semver.cmp(
        new semver.SemVer(v0),
        "!==",
        new semver.SemVer(v1),
      ),
      "cmp(" + v0 + "!==" + v1 + ") object",
    );

    assert(!semver.gt(v0, v1), "!gt('" + v0 + "', '" + v1 + "')");
    assert(semver.gte(v0, v1), "gte('" + v0 + "', '" + v1 + "')");
    assert(!semver.lt(v0, v1), "!lt('" + v0 + "', '" + v1 + "')");
    assert(semver.lte(v0, v1), "lte('" + v0 + "', '" + v1 + "')");
  });
});
