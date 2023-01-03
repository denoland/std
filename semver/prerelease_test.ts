// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as semver from "./mod.ts";

type PrereleaseParts = [string | number, (number | string)?];

Deno.test("prerelease", function () {
  // [prereleaseParts, version]
  const versions: [PrereleaseParts | null, string][] = [
    [["alpha", 1], "1.2.2-alpha.1"],
    [[1], "0.6.1-1"],
    [["beta", 2], "1.0.0-beta.2"],
    [["pre"], "v0.5.4-pre"],
    [["alpha", 1], "1.2.2-alpha.1"],
    [null, "~2.0.0-alpha.1"],
    [null, "invalid version"],
  ];

  versions.forEach(function (tuple) {
    const expected = tuple[0];
    const version = tuple[1];
    const msg = "prerelease(" + version + ")";
    assertEquals(
      semver.prerelease(version),
      expected as unknown as string[],
      msg,
    );
  });
});
