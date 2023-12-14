// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { INVALID, MAX, MIN } from "./constants.ts";
import { SemVer } from "./types.ts";
import { stringify } from "./stringify.ts";

Deno.test("stringify()", async (t) => {
  const versions: [Partial<SemVer>, string][] = [
    [{}, ""],
    [{ major: 1, minor: 2, patch: 3 }, "1.2.3"],
    [{ major: 1 }, "1"],
    [{ minor: 2 }, "2"],
    [{ patch: 3 }, "3"],

    [{ prerelease: [] }, ""],
    [{ major: 1, minor: 2, patch: 3, prerelease: ["pre"] }, "1.2.3-pre"],
    [{ prerelease: ["pre"] }, "pre"],
    [{ major: 1, minor: 2, patch: 3, prerelease: ["pre", 0] }, "1.2.3-pre.0"],
    [{ prerelease: ["pre", 0] }, "pre.0"],

    [{ build: [] }, ""],
    [{ major: 1, minor: 2, patch: 3, build: ["b"] }, "1.2.3+b"],
    [{ build: ["b"] }, "b"],
    [{ major: 1, minor: 2, patch: 3, build: ["b", "0"] }, "1.2.3+b.0"],
    [{ build: ["b", "0"] }, "b.0"],

    [{ prerelease: [], build: [] }, ""],
    [{
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: ["pre", 0],
      build: ["b", "0"],
    }, "1.2.3-pre.0+b.0"],

    [MAX, "∞.∞.∞"],
    [MIN, "0.0.0"],
    [INVALID, "⧞.∞.∞"],
  ];

  for (const [version, expected] of versions) {
    await t.step({
      name: expected,
      fn: () => {
        const actual = stringify(version);
        assertEquals(actual, expected);
      },
    });
  }
});
