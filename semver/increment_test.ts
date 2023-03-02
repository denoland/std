// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../testing/asserts.ts";
import * as semver from "./mod.ts";
import type { Options, ReleaseType } from "./mod.ts";

Deno.test("increment", async (t) => {
  //  [version, inc, result, identifier]
  //  increment(version, inc) -> result
  const versions: [
    string,
    ReleaseType,
    string | null,
    Options?,
    string?,
    string?,
  ][] = [
    ["1.2.3", "major", "2.0.0"],
    ["1.2.3", "minor", "1.3.0"],
    ["1.2.3", "patch", "1.2.4"],
    ["1.2.3-tag", "major", "2.0.0"],
    ["1.2.3", "fake" as ReleaseType, null],
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

    ["1.2.3", "major", "2.0.0", undefined, "dev"],
    ["1.2.3", "minor", "1.3.0", undefined, "dev"],
    ["1.2.3", "patch", "1.2.4", undefined, "dev"],
    ["1.2.3-tag", "major", "2.0.0", undefined, "dev"],
    ["1.2.3", "fake" as ReleaseType, null, undefined, "dev"],
    ["1.2.0-0", "patch", "1.2.0", undefined, "dev"],
    ["fake", "major", null, undefined, "dev"],
    ["1.2.3-4", "major", "2.0.0", undefined, "dev"],
    ["1.2.3-4", "minor", "1.3.0", undefined, "dev"],
    ["1.2.3-4", "patch", "1.2.3", undefined, "dev"],
    ["1.2.3-alpha.0.beta", "major", "2.0.0", undefined, "dev"],
    ["1.2.3-alpha.0.beta", "minor", "1.3.0", undefined, "dev"],
    ["1.2.3-alpha.0.beta", "patch", "1.2.3", undefined, "dev"],
    ["1.2.4", "prerelease", "1.2.5-dev.0", undefined, "dev"],
    ["1.2.3-0", "prerelease", "1.2.3-dev.0", undefined, "dev"],
    ["1.2.3-alpha.0", "prerelease", "1.2.3-dev.0", undefined, "dev"],
    ["1.2.3-alpha.0", "prerelease", "1.2.3-alpha.1", undefined, "alpha"],
    ["1.2.3-alpha.0.beta", "prerelease", "1.2.3-dev.0", undefined, "dev"],
    [
      "1.2.3-alpha.0.beta",
      "prerelease",
      "1.2.3-alpha.1.beta",
      undefined,
      "alpha",
    ],
    ["1.2.3-alpha.10.0.beta", "prerelease", "1.2.3-dev.0", undefined, "dev"],
    [
      "1.2.3-alpha.10.0.beta",
      "prerelease",
      "1.2.3-alpha.10.1.beta",
      undefined,
      "alpha",
    ],
    [
      "1.2.3-alpha.10.1.beta",
      "prerelease",
      "1.2.3-alpha.10.2.beta",
      undefined,
      "alpha",
    ],
    [
      "1.2.3-alpha.10.2.beta",
      "prerelease",
      "1.2.3-alpha.10.3.beta",
      undefined,
      "alpha",
    ],
    ["1.2.3-alpha.10.beta.0", "prerelease", "1.2.3-dev.0", undefined, "dev"],
    [
      "1.2.3-alpha.10.beta.0",
      "prerelease",
      "1.2.3-alpha.10.beta.1",
      undefined,
      "alpha",
    ],
    [
      "1.2.3-alpha.10.beta.1",
      "prerelease",
      "1.2.3-alpha.10.beta.2",
      undefined,
      "alpha",
    ],
    [
      "1.2.3-alpha.10.beta.2",
      "prerelease",
      "1.2.3-alpha.10.beta.3",
      undefined,
      "alpha",
    ],
    ["1.2.3-alpha.9.beta", "prerelease", "1.2.3-dev.0", undefined, "dev"],
    [
      "1.2.3-alpha.9.beta",
      "prerelease",
      "1.2.3-alpha.10.beta",
      undefined,
      "alpha",
    ],
    [
      "1.2.3-alpha.10.beta",
      "prerelease",
      "1.2.3-alpha.11.beta",
      undefined,
      "alpha",
    ],
    [
      "1.2.3-alpha.11.beta",
      "prerelease",
      "1.2.3-alpha.12.beta",
      undefined,
      "alpha",
    ],
    ["1.2.0", "prepatch", "1.2.1-dev.0", undefined, "dev"],
    ["1.2.0-1", "prepatch", "1.2.1-dev.0", undefined, "dev"],
    ["1.2.0", "preminor", "1.3.0-dev.0", undefined, "dev"],
    ["1.2.3-1", "preminor", "1.3.0-dev.0", undefined, "dev"],
    ["1.2.0", "premajor", "2.0.0-dev.0", undefined, "dev"],
    ["1.2.3-1", "premajor", "2.0.0-dev.0", undefined, "dev"],
    ["1.2.0-1", "minor", "1.2.0", undefined, "dev"],
    ["1.0.0-1", "major", "1.0.0", "dev" as Options],
    ["1.2.3-dev.bar", "prerelease", "1.2.3-dev.0", undefined, "dev"],

    // Add build metadata
    ["1.2.3", "major", "2.0.0+1", undefined, undefined, "1"],
    ["1.2.3", "minor", "1.3.0+1", undefined, undefined, "1"],
    ["1.2.3", "patch", "1.2.4+1", undefined, undefined, "1"],
    ["1.2.3", "premajor", "2.0.0-dev.0+1", undefined, "dev", "1"],
    ["1.2.3", "preminor", "1.3.0-dev.0+1", undefined, "dev", "1"],
    ["1.2.3", "prepatch", "1.2.4-dev.0+1", undefined, "dev", "1"],
    ["1.2.3", "pre", "1.2.3-dev.0+1", undefined, "dev", "1"],

    // Update build metadata
    ["1.2.3+1", "major", "2.0.0+2", undefined, undefined, "2"],
    ["1.2.3+1", "minor", "1.3.0+2", undefined, undefined, "2"],
    ["1.2.3+1", "patch", "1.2.4+2", undefined, undefined, "2"],
    ["1.2.3+1", "premajor", "2.0.0-dev.0+2", undefined, "dev", "2"],
    ["1.2.3+1", "preminor", "1.3.0-dev.0+2", undefined, "dev", "2"],
    ["1.2.3+1", "prepatch", "1.2.4-dev.0+2", undefined, "dev", "2"],

    // Retain build metadata
    ["1.2.3+1", "major", "2.0.0+1", undefined, undefined, undefined],
    ["1.2.3+1", "minor", "1.3.0+1", undefined, undefined, undefined],
    ["1.2.3+1", "patch", "1.2.4+1", undefined, undefined, undefined],
    ["1.2.3+1", "premajor", "2.0.0-dev.0+1", undefined, "dev", undefined],
    ["1.2.3+1", "preminor", "1.3.0-dev.0+1", undefined, "dev", undefined],
    ["1.2.3+1", "prepatch", "1.2.4-dev.0+1", undefined, "dev", undefined],
    ["1.2.3+1", "pre", "1.2.3-dev.0+1", undefined, "dev", undefined],

    // Remove build metadata
    ["1.2.3+1", "major", "2.0.0", undefined, undefined, ""],
    ["1.2.3+1", "minor", "1.3.0", undefined, undefined, ""],
    ["1.2.3+1", "patch", "1.2.4", undefined, undefined, ""],
    ["1.2.3+1", "premajor", "2.0.0-dev.0", undefined, "dev", ""],
    ["1.2.3+1", "preminor", "1.3.0-dev.0", undefined, "dev", ""],
    ["1.2.3+1", "prepatch", "1.2.4-dev.0", undefined, "dev", ""],
    ["1.2.3+1", "pre", "1.2.3-dev.0", undefined, "dev", ""],
  ];

  for (const [pre, what, wanted, options, id, metadata] of versions) {
    await t.step({
      name: `${pre}, ${what}, ${id}, ${metadata}`,
      fn: () => {
        const found = semver.increment(pre, what, options, id, metadata);
        const cmd = `increment(${pre}, ${what}, ${id}, ${metadata})`;
        assertEquals(found, wanted);

        const parsed = semver.parse(pre, options);
        if (wanted && parsed) {
          parsed.increment(what, id, metadata);
          const w = semver.parse(wanted)!;
          assertEquals(parsed.version, w.version);
          assertEquals(parsed.raw, w.raw);
          if (metadata !== undefined) {
            assertEquals(
              parsed.build,
              metadata.split(".") ?? [],
              cmd + " build updated",
            );
            assertEquals(
              parsed.format({ style: "full" }),
              [parsed.version, metadata].filter((v) => v).join("+"),
              cmd + " full version updated",
            );
          }
        } else if (parsed) {
          assertThrows(function () {
            parsed.increment(what, id, metadata);
          });
        } else {
          assertEquals(parsed, null);
        }
      },
    });
  }
});
