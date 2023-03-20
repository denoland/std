// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as semver from "./mod.ts";

Deno.test("format", async (t) => {
  const versions: [
    string,
    "release" | "prerelease" | "build" | "full" | undefined,
    string,
  ][] = [
    ["1.2.3", undefined, "1.2.3"],
    ["1.2.3", "release", "1.2.3"],
    ["1.2.3", "prerelease", "1.2.3"],
    ["1.2.3", "build", "1.2.3"],
    ["1.2.3", "full", "1.2.3"],

    ["1.2.3-pre", undefined, "1.2.3-pre"],
    ["1.2.3-pre", "release", "1.2.3"],
    ["1.2.3-pre", "prerelease", "1.2.3-pre"],
    ["1.2.3-pre", "build", "1.2.3"],
    ["1.2.3-pre", "full", "1.2.3-pre"],

    ["1.2.3-pre.0", undefined, "1.2.3-pre.0"],
    ["1.2.3-pre.0", "release", "1.2.3"],
    ["1.2.3-pre.0", "prerelease", "1.2.3-pre.0"],
    ["1.2.3-pre.0", "build", "1.2.3"],
    ["1.2.3-pre.0", "full", "1.2.3-pre.0"],

    ["1.2.3+b", undefined, "1.2.3"],
    ["1.2.3+b", "release", "1.2.3"],
    ["1.2.3+b", "prerelease", "1.2.3"],
    ["1.2.3+b", "build", "1.2.3+b"],
    ["1.2.3+b", "full", "1.2.3+b"],

    ["1.2.3+b.0", undefined, "1.2.3"],
    ["1.2.3+b.0", "release", "1.2.3"],
    ["1.2.3+b.0", "prerelease", "1.2.3"],
    ["1.2.3+b.0", "build", "1.2.3+b.0"],
    ["1.2.3+b.0", "full", "1.2.3+b.0"],

    ["1.2.3-pre.0+b.1", undefined, "1.2.3-pre.0"],
    ["1.2.3-pre.0+b.1", "release", "1.2.3"],
    ["1.2.3-pre.0+b.1", "prerelease", "1.2.3-pre.0"],
    ["1.2.3-pre.0+b.1", "build", "1.2.3+b.1"],
    ["1.2.3-pre.0+b.1", "full", "1.2.3-pre.0+b.1"],
  ];

  for (const [version, style, expected] of versions) {
    await t.step({
      name: `format(${version} ${style} ${expected})`,
      fn: () => {
        const v = semver.parse(version)!;
        const actual = v.format({ style });
        assertEquals(actual, expected);
      },
    });
  }
});
