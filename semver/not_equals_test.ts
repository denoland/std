// Copyright 2018-2025 the Deno authors. MIT license.
import { assert, assertEquals } from "@std/assert";
import { parse } from "./parse.ts";
import { notEquals } from "./not_equals.ts";

Deno.test({
  name: "notEquals()",
  fn: async (t) => {
    // [version1, version2]
    // version1 should be greater than version2
    const versions: [string, string, boolean][] = [
      ["0.0.0", "0.0.0", false],
      ["1.2.3", "1.2.3", false],
      ["1.2.3-pre.0", "1.2.3-pre.0", false],
      ["1.2.3-pre.0+abc", "1.2.3-pre.0+abc", false],
      ["0.0.0", "0.0.0-foo", true],
      ["0.0.1", "0.0.0", true],
      ["1.0.0", "0.9.9", true],
      ["0.10.0", "0.9.0", true],
      ["0.99.0", "0.10.0", true],
      ["2.0.0", "1.2.3", true],
      ["1.2.3", "1.2.3-asdf", true],
      ["1.2.3", "1.2.3-4", true],
      ["1.2.3", "1.2.3-4-foo", true],
      ["1.2.3-5", "1.2.3-5-foo", true], // numbers > strings, `5-foo` is a string not a number
      ["1.2.3-5", "1.2.3-4", true],
      ["1.2.3-5-foo", "1.2.3-5-Foo", true],
      ["3.0.0", "2.7.2+asdf", true],
      ["1.2.3-a.10", "1.2.3-a.5", true],
      ["1.2.3-a.5", "1.2.3-a.b", true],
      ["1.2.3-a.b", "1.2.3-a", true],
      ["1.2.3-a.b.c.10.d.5", "1.2.3-a.b.c.5.d.100", true],
      ["1.2.3-r2", "1.2.3-r100", true],
      ["1.2.3-r100", "1.2.3-R2", true],
    ];

    for (const [v0, v1, expected] of versions) {
      await t.step(`${v0} != ${v1}`, () => {
        const s0 = parse(v0);
        const s1 = parse(v1);

        const eq0 = notEquals(s0, s0);
        const eq1 = notEquals(s1, s1);
        const eq2 = notEquals(s0, s1);
        const eq3 = notEquals(s1, s0);

        assert(!eq0, `${s0} == ${s0}`);
        assert(!eq1, `${s1} == ${s1}`);
        assertEquals(eq2, expected);
        assertEquals(eq3, expected);
      });
    }
  },
});
