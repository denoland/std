import { assert } from "../testing/asserts.ts";

import * as semver from "./mod.ts";

type Version = string;

Deno.test("equality", function (): void {
  // [version1, version2, loose]
  // version1 should be equivalent to version2
  const versions: [Version, Version, boolean?][] = [
    ["1.2.3", "v1.2.3", true],
    ["1.2.3", "=1.2.3", true],
    ["1.2.3", "v 1.2.3", true],
    ["1.2.3", "= 1.2.3", true],
    ["1.2.3", " v1.2.3", true],
    ["1.2.3", " =1.2.3", true],
    ["1.2.3", " v 1.2.3", true],
    ["1.2.3", " = 1.2.3", true],
    ["1.2.3-0", "v1.2.3-0", true],
    ["1.2.3-0", "=1.2.3-0", true],
    ["1.2.3-0", "v 1.2.3-0", true],
    ["1.2.3-0", "= 1.2.3-0", true],
    ["1.2.3-0", " v1.2.3-0", true],
    ["1.2.3-0", " =1.2.3-0", true],
    ["1.2.3-0", " v 1.2.3-0", true],
    ["1.2.3-0", " = 1.2.3-0", true],
    ["1.2.3-1", "v1.2.3-1", true],
    ["1.2.3-1", "=1.2.3-1", true],
    ["1.2.3-1", "v 1.2.3-1", true],
    ["1.2.3-1", "= 1.2.3-1", true],
    ["1.2.3-1", " v1.2.3-1", true],
    ["1.2.3-1", " =1.2.3-1", true],
    ["1.2.3-1", " v 1.2.3-1", true],
    ["1.2.3-1", " = 1.2.3-1", true],
    ["1.2.3-beta", "v1.2.3-beta", true],
    ["1.2.3-beta", "=1.2.3-beta", true],
    ["1.2.3-beta", "v 1.2.3-beta", true],
    ["1.2.3-beta", "= 1.2.3-beta", true],
    ["1.2.3-beta", " v1.2.3-beta", true],
    ["1.2.3-beta", " =1.2.3-beta", true],
    ["1.2.3-beta", " v 1.2.3-beta", true],
    ["1.2.3-beta", " = 1.2.3-beta", true],
    ["1.2.3-beta+build", " = 1.2.3-beta+otherbuild", true],
    ["1.2.3+build", " = 1.2.3+otherbuild", true],
    ["1.2.3-beta+build", "1.2.3-beta+otherbuild"],
    ["1.2.3+build", "1.2.3+otherbuild"],
    ["  v1.2.3+build", "1.2.3+otherbuild"],
  ];

  versions.forEach(function (v) {
    const v0 = v[0];
    const v1 = v[1];
    const loose: boolean | undefined = v[2];

    assert(semver.eq(v0, v1, loose), "eq('" + v0 + "', '" + v1 + "')");
    assert(!semver.neq(v0, v1, loose), "!neq('" + v0 + "', '" + v1 + "')");
    assert(semver.cmp(v0, "==", v1, loose), "cmp(" + v0 + "==" + v1 + ")");
    assert(!semver.cmp(v0, "!=", v1, loose), "!cmp(" + v0 + "!=" + v1 + ")");
    assert(!semver.cmp(v0, "===", v1, loose), "!cmp(" + v0 + "===" + v1 + ")");

    // also test with an object. they are === because obj.version matches
    assert(
      semver.cmp(
        new semver.SemVer(v0, { loose: loose }),
        "===",
        new semver.SemVer(v1, { loose: loose }),
      ),
      "!cmp(" + v0 + "===" + v1 + ") object",
    );

    assert(semver.cmp(v0, "!==", v1, loose), "cmp(" + v0 + "!==" + v1 + ")");

    assert(
      !semver.cmp(
        new semver.SemVer(v0, loose),
        "!==",
        new semver.SemVer(v1, loose),
      ),
      "cmp(" + v0 + "!==" + v1 + ") object",
    );

    assert(!semver.gt(v0, v1, loose), "!gt('" + v0 + "', '" + v1 + "')");
    assert(semver.gte(v0, v1, loose), "gte('" + v0 + "', '" + v1 + "')");
    assert(!semver.lt(v0, v1, loose), "!lt('" + v0 + "', '" + v1 + "')");
    assert(semver.lte(v0, v1, loose), "lte('" + v0 + "', '" + v1 + "')");
  });
});
