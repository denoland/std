// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as semver from "./mod.ts";

Deno.test("equality", async (t) => {
  // [version1, version2]
  // version1 should be equivalent to version2
  const versions: [string, string, boolean][] = [
    ["1.2.3", "1.2.3", true],
    ["1.2.3-pr.1", "1.2.3-pr.1", true],
    ["1.2.3+abc123", "1.2.3+abc123", true],
    ["1.2.3-alpha", "1.2.3-beta", false],
    ["1.2.3-beta+build", "1.2.3-beta+otherbuild", false],
    ["1.2.3+build", "1.2.3+otherbuild", false],
  ];

  for (const [v0, v1, expected] of versions) {
    const s0 = semver.parse(v0);
    const s1 = semver.parse(v1);
    await t.step(`${v0} <=> ${v1}`, () => {
      assertEquals(semver.eq(s0, s1), expected, `eq(${v0},${v1})`);
      assertEquals(!semver.neq(s0, s1), expected, `neq(${v0},${v1})`);
      assertEquals(semver.cmp(s0, "", s1), expected, `${v0} ${v1}`);
      assertEquals(semver.cmp(s0, "=", s1), expected, `${v0} = ${v1}`);
      assertEquals(semver.cmp(s0, "==", s1), expected, `${v0} == ${v1}`);
      assertEquals(semver.cmp(s0, "===", s1), expected, `${v0} === ${v1}`);
      assertEquals(!semver.cmp(s0, "!=", s1), expected, `!(${v0} != ${v1})`);
      assertEquals(!semver.cmp(s0, "!==", s1), expected, `${v0} !== ${v1}`);
    });
  }
});
