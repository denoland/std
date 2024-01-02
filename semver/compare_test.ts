// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { parse } from "./parse.ts";
import { compare } from "./compare.ts";

Deno.test("compare() ignores build metadata", async (t) => {
  // v+b > v
  const steps: [string, string, number][] = [
    ["1.0.0", "1.0.0+0", 0],
    ["1.0.0+0", "1.0.0+0", 0],
    ["1.0.0+0", "1.0.0", 0],
    ["1.0.0+0", "1.0.0+0.0", 0],
    ["1.0.0+0.0", "1.0.0+0.0", 0],
    ["1.0.0+0.0", "1.0.0+0", 0],
    ["1.0.0+0", "1.0.0+1", 0],
    ["1.0.0+0", "1.0.0+0", 0],
    ["1.0.0+1", "1.0.0+0", 0],
    ["1.0.0+0001", "1.0.0+2", 0],
  ];
  for (const [v0, v1, expected] of steps) {
    await t.step(`${v0} <=> ${v1}`, () => {
      const s0 = parse(v0);
      const s1 = parse(v1);
      const actual = compare(s0, s1);
      assertEquals(actual, expected);
    });
  }
});

Deno.test({
  name: "compare() handles prerelease",
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
      ["1.2.3-alpha.0.pr.1", "1.2.3-alpha.0.2", 1],
      ["1.2.3-alpha.0.pr.1", "1.2.3-alpha.pr.0", -1],
      ["1.2.3-alpha.0.pr.1", "1.2.3-beta.0.pr.1", -1],
    ];
    for (const [v0, v1, expected] of cases) {
      const s0 = parse(v0);
      const s1 = parse(v1);
      await t.step(`${v0} <=> ${v1}`, () => {
        const actual = compare(s0, s1);
        assertEquals(actual, expected);
      });
    }
  },
});

// taken over from `eq_test.ts`
Deno.test({
  name: "compare()",
  fn: async (t) => {
    // [version1, version2]
    // version1 should be greater than version2
    const versions: [string, string, number][] = [
      ["0.0.0", "0.0.0", 0],
      ["1.2.3", "1.2.3", 0],
      ["1.2.3-pre.0", "1.2.3-pre.0", 0],
      ["1.2.3-pre.0+abc", "1.2.3-pre.0+abc", 0],
      ["0.0.0", "0.0.0-foo", 1],
      ["0.0.1", "0.0.0", 1],
      ["1.0.0", "0.9.9", 1],
      ["0.10.0", "0.9.0", 1],
      ["0.99.0", "0.10.0", 1],
      ["2.0.0", "1.2.3", 1],
      ["1.2.3", "1.2.3-asdf", 1],
      ["1.2.3", "1.2.3-4", 1],
      ["1.2.3", "1.2.3-4-foo", 1],
      ["1.2.3-5", "1.2.3-5-foo", -1], // numbers > strings, `5-foo` is a string not a number
      ["1.2.3-5", "1.2.3-4", 1],
      ["1.2.3-5-foo", "1.2.3-5-Foo", 1],
      ["3.0.0", "2.7.2+asdf", 1],
      ["1.2.3-a.10", "1.2.3-a.5", 1],
      ["1.2.3-a.5", "1.2.3-a.b", -1],
      ["1.2.3-a.b", "1.2.3-a", 1],
      ["1.2.3-a.b.c.10.d.5", "1.2.3-a.b.c.5.d.100", 1],
      ["1.2.3-r2", "1.2.3-r100", 1],
      ["1.2.3-r100", "1.2.3-R2", 1],
    ];

    for (const [v0, v1, expected] of versions) {
      await t.step(`${v0} == ${v1}`, () => {
        const s0 = parse(v0);
        const s1 = parse(v1);

        const eq = compare(s0, s1);
        const op = expected ? "==" : "!=";
        assertEquals(eq, expected, `${s0} ${op} ${s1}`);
      });
    }
  },
});

// taken over from `neq_test.ts`
Deno.test({
  name: "compare()",
  fn: async (t) => {
    // [version1, version2]
    // version1 should be greater than version2
    const versions: [string, string, number][] = [
      ["0.0.0", "0.0.0", 0],
      ["1.2.3", "1.2.3", 0],
      ["1.2.3-pre.0", "1.2.3-pre.0", 0],
      ["1.2.3-pre.0+abc", "1.2.3-pre.0+abc", 0],
      ["0.0.0", "0.0.0-foo", 1],
      ["0.0.1", "0.0.0", 1],
      ["1.0.0", "0.9.9", 1],
      ["0.10.0", "0.9.0", 1],
      ["0.99.0", "0.10.0", 1],
      ["2.0.0", "1.2.3", 1],
      ["1.2.3", "1.2.3-asdf", 1],
      ["1.2.3", "1.2.3-4", 1],
      ["1.2.3", "1.2.3-4-foo", 1],
      ["1.2.3-5", "1.2.3-5-foo", -1], // numbers > strings, `5-foo` is a string not a number
      ["1.2.3-5", "1.2.3-4", 1],
      ["1.2.3-5-foo", "1.2.3-5-Foo", 1],
      ["3.0.0", "2.7.2+asdf", 1],
      ["1.2.3-a.10", "1.2.3-a.5", 1],
      ["1.2.3-a.5", "1.2.3-a.b", -1],
      ["1.2.3-a.b", "1.2.3-a", 1],
      ["1.2.3-a.b.c.10.d.5", "1.2.3-a.b.c.5.d.100", 1],
      ["1.2.3-r2", "1.2.3-r100", 1],
      ["1.2.3-r100", "1.2.3-R2", 1],
    ];

    for (const [v0, v1, expected] of versions) {
      await t.step(`${v0} != ${v1}`, () => {
        const s0 = parse(v0);
        const s1 = parse(v1);

        const op = expected ? "==" : "!=";

        assertEquals(compare(s0, s1), expected, `${s0} ${op} ${s1}`);
      });
    }
  },
});

// taken over from `lt_test.ts`
Deno.test({
  name: "compare()",
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
      ["1.2.3-5-foo", "1.2.3-5"], // numbers < strings, `5-foo` is a string not a number
      ["1.2.3-5", "1.2.3-4"],
      ["1.2.3-5-foo", "1.2.3-5-Foo"],
      ["3.0.0", "2.7.2+asdf"],
      ["1.2.3-a.10", "1.2.3-a.5"],
      ["1.2.3-a.b", "1.2.3-a.5"],
      ["1.2.3-a.b", "1.2.3-a"],
      ["1.2.3-a.b.c.10.d.5", "1.2.3-a.b.c.5.d.100"],
      ["1.2.3-r2", "1.2.3-r100"],
      ["1.2.3-r100", "1.2.3-R2"],
    ];

    for (const [v0, v1] of versions) {
      await t.step(`${v0} <=> ${v1}`, () => {
        const s0 = parse(v0);
        const s1 = parse(v1);
        const actual = compare(s0, s1);
        assertEquals(actual, 1, `${v0} < ${v1} : ${actual}`);
      });
    }
  },
});

// taken over from `gt_test.ts`
Deno.test({
  name: "compare()",
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
      ["1.2.3-5-foo", "1.2.3-5"], // numbers < strings, `5-foo` is a string not a number
      ["1.2.3-5", "1.2.3-4"],
      ["1.2.3-5-foo", "1.2.3-5-Foo"],
      ["3.0.0", "2.7.2+asdf"],
      ["1.2.3-a.10", "1.2.3-a.5"],
      ["1.2.3-a.b", "1.2.3-a.5"],
      ["1.2.3-a.b", "1.2.3-a"],
      ["1.2.3-a.b.c.10.d.5", "1.2.3-a.b.c.5.d.100"],
      ["1.2.3-r2", "1.2.3-r100"],
      ["1.2.3-r100", "1.2.3-R2"],
    ];

    for (const [v0, v1] of versions) {
      await t.step(`${v0} <=> ${v1}`, () => {
        const s0 = parse(v0);
        const s1 = parse(v1);
        const actual = compare(s0, s1);
        assertEquals(actual, 1, `${v0} >= ${v1} : ${actual}`);
      });
    }
  },
});
