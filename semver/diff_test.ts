// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as semver from "./mod.ts";

Deno.test("diff", function () {
  //  [version1, version2, result]
  //  difference(version1, version2) -> result
  const versions: [string, string, semver.ReleaseType | null][] = [
    ["1.2.3", "0.2.3", "major"],
    ["1.4.5", "0.2.3", "major"],
    ["1.2.3", "2.0.0-pre", "premajor"],
    ["1.2.3", "1.3.3", "minor"],
    ["1.0.1", "1.1.0-pre", "preminor"],
    ["1.2.3", "1.2.4", "patch"],
    ["1.2.3", "1.2.4-pre", "prepatch"],
    ["0.0.1", "0.0.1-pre", "prerelease"],
    ["0.0.1", "0.0.1-pre-2", "prerelease"],
    ["1.1.0", "1.1.0-pre", "prerelease"],
    ["1.1.0-pre-1", "1.1.0-pre-2", "prerelease"],
    ["1.0.0", "1.0.0", null],
  ];

  versions.forEach(function (v) {
    const version1 = v[0];
    const version2 = v[1];
    const wanted = v[2];
    const found = semver.difference(version1, version2);
    const cmd = "difference(" + version1 + ", " + version2 + ")";
    assertEquals(found, wanted, cmd + " === " + wanted);
  });
});
