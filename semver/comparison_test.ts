// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals, assertThrows } from "../testing/asserts.ts";
import * as semver from "./mod.ts";

Deno.test({
  name: "comparison",
  fn: async (t) => {
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
      ["1.2.3-5", "1.2.3-5-foo"], // numbers > strings, `5-foo` is a string not a number
      ["1.2.3-5", "1.2.3-4"],
      ["1.2.3-5-foo", "1.2.3-5-Foo"],
      ["3.0.0", "2.7.2+asdf"],
      ["1.2.3-a.10", "1.2.3-a.5"],
      ["1.2.3-a.5", "1.2.3-a.b"],
      ["1.2.3-a.b", "1.2.3-a"],
      ["1.2.3-a.b.c.10.d.5", "1.2.3-a.b.c.5.d.100"],
      ["1.2.3-r2", "1.2.3-r100"],
      ["1.2.3-r100", "1.2.3-R2"],
    ];

    for (const [v0, v1] of versions) {
      await t.step(`${v0} <=> ${v1}`, () => {
        const s0 = semver.parse(v0);
        const s1 = semver.parse(v1);

        const cmp = semver.compare(s0, s1);
        assert(cmp === 1, `${v0} <=> ${v1} > 0 : ${cmp}`);

        const gt = semver.gt(s0, s1);
        assert(gt, `${v0} > ${v1} : ${gt}`);

        const lt = semver.lt(s1, s0);
        assert(lt, `${v1} < ${v0} : ${lt}`);

        const ngt = semver.gt(s1, s0);
        assert(!ngt, `${v1} !> ${v0} : ${ngt}`);

        const nlt = semver.lt(s0, s1);
        assert(!nlt, `${v0} <! ${v1} : ${nlt}`);

        const eq0 = semver.eq(s0, s0);
        const eq1 = semver.eq(s1, s1);
        const neq = semver.neq(s0, s1);
        assert(eq0, `${s0} = ${s0} : ${eq0}`);
        assert(eq1, `${s1} = ${s1} : ${eq1}`);
        assert(neq, `${s0} != ${s1} : ${neq}`);

        const cmp0 = semver.cmp(s0, "==", s0);
        const cmp1 = semver.cmp(s0, ">=", s1);
        const cmp2 = semver.cmp(s1, "<=", s0);
        const cmp3 = semver.cmp(s0, "!=", s1);
        assert(cmp0, `${v0} == ${v0} : ${cmp0}`);
        assert(cmp1, `${v0} >= ${v1} : ${cmp1}`);
        assert(cmp2, `${v1} <= ${v0} : ${cmp2}`);
        assert(cmp3, `${v0} != ${v1} : ${cmp3}`);
      });
    }
  },
});

Deno.test("compareBuild", async (t) => {
  // v+b > v
  const steps: [string, string, number][] = [
    ["1.0.0", "1.0.0+0", -1],
    ["1.0.0+0", "1.0.0+0", 0],
    ["1.0.0+0", "1.0.0", 1],
    ["1.0.0+0", "1.0.0+0.0", -1],
    ["1.0.0+0.0", "1.0.0+0.0", 0],
    ["1.0.0+0.0", "1.0.0+0", 1],
    ["1.0.0+0", "1.0.0+1", -1],
    ["1.0.0+0", "1.0.0+0", 0],
    ["1.0.0+1", "1.0.0+0", 1],

    // Builds are sorted alphabetically, not numerically
    ["1.0.0+0001", "1.0.0+2", -1],
  ];
  for (const [v0, v1, expected] of steps) {
    await t.step(`${v0} <=> ${v1}`, () => {
      const s0 = semver.parse(v0);
      const s1 = semver.parse(v1);
      const actual = semver.compare(s0, s1);
      assertEquals(actual, expected);
    });
  }
});

Deno.test("rcompare", async (t) => {
  const steps: [string, string, number][] = [
    ["1.0.0", "1.0.1", 1],
    ["1.0.0", "1.0.0", 0],
    ["1.0.0+0", "1.0.0", -1],
    ["1.0.0-0", "1.0.0", 1],
    ["1.0.0-1", "1.0.0-0", -1],
    ["1.0.1", "1.0.0", -1],
  ];
  for (const [v0, v1, expected] of steps) {
    await t.step(`${v0} <=> ${v0}`, () => {
      const s0 = semver.parse(v0);
      const s1 = semver.parse(v1);
      const actual = semver.rcompare(s0, s1);
      assertEquals(actual, expected);
    });
  }
});

Deno.test({
  name: "comparePre",
  fn: async (t) => {
    const cases: [string, string, number][] = [
      ["1.2.3", "1.2.3", 0],
      ["1.2.3", "2.3.4", -1],
      ["1.2.3", "0.1.2", 1],
      ["1.2.3", "1.2.2", 1],
      ["1.2.3", "1.2.3-pre", 1],
      ["1.2.3-alpha.0.pr.1", "1.2.3-alpha.0.pr.1", 0],
      ["1.2.3-alpha.0.pr.1", "9.9.9-alpha.0.pr.1", -1],
      ["1.2.3-alpha.0.pr.1", "1.2.3", -1],
      ["1.2.3-alpha.0.pr.1", "1.2.3-alpha.0.pr.2", -1],
      ["1.2.3-alpha.0.pr.1", "1.2.3-alpha.0.2", -1],
      ["1.2.3-alpha.0.pr.1", "1.2.3-alpha.pr.0", 1],
      ["1.2.3-alpha.0.pr.1", "1.2.3-beta.0.pr.1", -1],
    ];
    for (const [v0, v1, expected] of cases) {
      const s0 = semver.parse(v0);
      const s1 = semver.parse(v1);
      await t.step(`${v0} <=> ${v1}`, () => {
        const actual = semver.compare(s0, s1);
        if (actual != expected) {
          console.log({ v0, v1, s0, s1, actual, expected });
        }
        assertEquals(actual, expected);
      });
    }
  },
});

Deno.test("compareIdentifierst", async (t) => {
  const set = [
    ["0", "0", 0],
    ["1", "2", -1],
    ["2", "1", 1],

    ["alpha", "beta", -1],
    ["0", "beta", -1],

    [0, 0, 0],
    [1, 0, 1],
    [1, "1", 1],
    [0, "1", 1],
    [1, 2, -1],
  ];
  for (const [a, b, expected] of set) {
    await t.step(`${JSON.stringify(a)} <=> ${JSON.stringify(b)}`, () => {
      assertEquals(semver.compareIdentifier([a], [b]), expected);
    });
  }
});

Deno.test("invalidCmpUsage", function () {
  assertThrows(
    () =>
      semver.cmp(
        semver.parse("1.2.3"),
        "a frog" as semver.Operator,
        semver.parse("4.5.6"),
      ),
    TypeError,
    "Invalid operator: a frog",
  );
});
