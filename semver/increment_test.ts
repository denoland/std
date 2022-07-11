// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../testing/asserts.ts";
import * as semver from "./mod.ts";

type Inc = semver.ReleaseType;
type Version = string;
type Options = semver.Options | boolean;

Deno.test("increment", function (): void {
  //  [version, inc, result, identifier]
  //  inc(version, inc) -> result
  const versions: [Version, Inc, Version | null, Options?, string?][] = [
    ["1.2.3", "major", "2.0.0"],
    ["1.2.3", "minor", "1.3.0"],
    ["1.2.3", "patch", "1.2.4"],
    ["1.2.3tag", "major", "2.0.0", true],
    ["1.2.3-tag", "major", "2.0.0"],
    ["1.2.3", "fake" as Inc, null],
    ["1.2.0-0", "patch", "1.2.0"],
    ["fake", "major", null],
    ["1.2.3-4", "major", "2.0.0"],
    ["1.2.3-4", "minor", "1.3.0"],
    ["1.2.3-4", "patch", "1.2.3"],
    ["1.2.3-alpha.0.beta", "major", "2.0.0"],
    ["1.2.3-alpha.0.beta", "minor", "1.3.0"],
    ["1.2.3-alpha.0.beta", "patch", "1.2.3"],
    ["1.2.4", "prerelease", "1.2.5-0"],
    ["1.2.3-0", "prerelease", "1.2.3-1"],
    ["1.2.3-alpha.0", "prerelease", "1.2.3-alpha.1"],
    ["1.2.3-alpha.1", "prerelease", "1.2.3-alpha.2"],
    ["1.2.3-alpha.2", "prerelease", "1.2.3-alpha.3"],
    ["1.2.3-alpha.0.beta", "prerelease", "1.2.3-alpha.1.beta"],
    ["1.2.3-alpha.1.beta", "prerelease", "1.2.3-alpha.2.beta"],
    ["1.2.3-alpha.2.beta", "prerelease", "1.2.3-alpha.3.beta"],
    ["1.2.3-alpha.10.0.beta", "prerelease", "1.2.3-alpha.10.1.beta"],
    ["1.2.3-alpha.10.1.beta", "prerelease", "1.2.3-alpha.10.2.beta"],
    ["1.2.3-alpha.10.2.beta", "prerelease", "1.2.3-alpha.10.3.beta"],
    ["1.2.3-alpha.10.beta.0", "prerelease", "1.2.3-alpha.10.beta.1"],
    ["1.2.3-alpha.10.beta.1", "prerelease", "1.2.3-alpha.10.beta.2"],
    ["1.2.3-alpha.10.beta.2", "prerelease", "1.2.3-alpha.10.beta.3"],
    ["1.2.3-alpha.9.beta", "prerelease", "1.2.3-alpha.10.beta"],
    ["1.2.3-alpha.10.beta", "prerelease", "1.2.3-alpha.11.beta"],
    ["1.2.3-alpha.11.beta", "prerelease", "1.2.3-alpha.12.beta"],
    ["1.2.0", "prepatch", "1.2.1-0"],
    ["1.2.0-1", "prepatch", "1.2.1-0"],
    ["1.2.0", "preminor", "1.3.0-0"],
    ["1.2.3-1", "preminor", "1.3.0-0"],
    ["1.2.0", "premajor", "2.0.0-0"],
    ["1.2.3-1", "premajor", "2.0.0-0"],
    ["1.2.0-1", "minor", "1.2.0"],
    ["1.0.0-1", "major", "1.0.0"],

    ["1.2.3", "major", "2.0.0", false, "dev"],
    ["1.2.3", "minor", "1.3.0", false, "dev"],
    ["1.2.3", "patch", "1.2.4", false, "dev"],
    ["1.2.3tag", "major", "2.0.0", true, "dev"],
    ["1.2.3-tag", "major", "2.0.0", false, "dev"],
    ["1.2.3", "fake" as Inc, null, false, "dev"],
    ["1.2.0-0", "patch", "1.2.0", false, "dev"],
    ["fake", "major", null, false, "dev"],
    ["1.2.3-4", "major", "2.0.0", false, "dev"],
    ["1.2.3-4", "minor", "1.3.0", false, "dev"],
    ["1.2.3-4", "patch", "1.2.3", false, "dev"],
    ["1.2.3-alpha.0.beta", "major", "2.0.0", false, "dev"],
    ["1.2.3-alpha.0.beta", "minor", "1.3.0", false, "dev"],
    ["1.2.3-alpha.0.beta", "patch", "1.2.3", false, "dev"],
    ["1.2.4", "prerelease", "1.2.5-dev.0", false, "dev"],
    ["1.2.3-0", "prerelease", "1.2.3-dev.0", false, "dev"],
    ["1.2.3-alpha.0", "prerelease", "1.2.3-dev.0", false, "dev"],
    ["1.2.3-alpha.0", "prerelease", "1.2.3-alpha.1", false, "alpha"],
    ["1.2.3-alpha.0.beta", "prerelease", "1.2.3-dev.0", false, "dev"],
    ["1.2.3-alpha.0.beta", "prerelease", "1.2.3-alpha.1.beta", false, "alpha"],
    ["1.2.3-alpha.10.0.beta", "prerelease", "1.2.3-dev.0", false, "dev"],
    [
      "1.2.3-alpha.10.0.beta",
      "prerelease",
      "1.2.3-alpha.10.1.beta",
      false,
      "alpha",
    ],
    [
      "1.2.3-alpha.10.1.beta",
      "prerelease",
      "1.2.3-alpha.10.2.beta",
      false,
      "alpha",
    ],
    [
      "1.2.3-alpha.10.2.beta",
      "prerelease",
      "1.2.3-alpha.10.3.beta",
      false,
      "alpha",
    ],
    ["1.2.3-alpha.10.beta.0", "prerelease", "1.2.3-dev.0", false, "dev"],
    [
      "1.2.3-alpha.10.beta.0",
      "prerelease",
      "1.2.3-alpha.10.beta.1",
      false,
      "alpha",
    ],
    [
      "1.2.3-alpha.10.beta.1",
      "prerelease",
      "1.2.3-alpha.10.beta.2",
      false,
      "alpha",
    ],
    [
      "1.2.3-alpha.10.beta.2",
      "prerelease",
      "1.2.3-alpha.10.beta.3",
      false,
      "alpha",
    ],
    ["1.2.3-alpha.9.beta", "prerelease", "1.2.3-dev.0", false, "dev"],
    ["1.2.3-alpha.9.beta", "prerelease", "1.2.3-alpha.10.beta", false, "alpha"],
    [
      "1.2.3-alpha.10.beta",
      "prerelease",
      "1.2.3-alpha.11.beta",
      false,
      "alpha",
    ],
    [
      "1.2.3-alpha.11.beta",
      "prerelease",
      "1.2.3-alpha.12.beta",
      false,
      "alpha",
    ],
    ["1.2.0", "prepatch", "1.2.1-dev.0", false, "dev"],
    ["1.2.0-1", "prepatch", "1.2.1-dev.0", false, "dev"],
    ["1.2.0", "preminor", "1.3.0-dev.0", false, "dev"],
    ["1.2.3-1", "preminor", "1.3.0-dev.0", false, "dev"],
    ["1.2.0", "premajor", "2.0.0-dev.0", false, "dev"],
    ["1.2.3-1", "premajor", "2.0.0-dev.0", false, "dev"],
    ["1.2.0-1", "minor", "1.2.0", false, "dev"],
    ["1.0.0-1", "major", "1.0.0", "dev" as unknown as boolean],
    ["1.2.3-dev.bar", "prerelease", "1.2.3-dev.0", false, "dev"],
  ];

  versions.forEach(function (v) {
    const pre = v[0];
    const what = v[1];
    const wanted = v[2];
    const loose = v[3];
    const id = v[4];
    const found = semver.inc(pre, what, loose, id);
    const cmd = "inc(" + pre + ", " + what + ", " + id + ")";
    assertEquals(found, wanted, cmd + " === " + wanted);

    const parsed = semver.parse(pre, loose);
    if (wanted && parsed) {
      //todo ?
      parsed.inc(what, id);
      assertEquals(parsed.version, wanted, cmd + " object version updated");
      assertEquals(parsed.raw, wanted, cmd + " object raw field updated");
    } else if (parsed) {
      assertThrows(function () {
        parsed.inc(what, id);
      });
    } else {
      assertEquals(parsed, null);
    }
  });
});
