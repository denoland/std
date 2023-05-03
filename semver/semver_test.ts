// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { rsort, sort } from "./sort.ts";
import { parse, parseRange } from "./parse.ts";
import { maxSatisfying, minSatisfying } from "./range.ts";
import { MAX, MIN } from "./semver.ts";

Deno.test("invalidVersion", async (t) => {
  const versions = ["1.2.3.4", "NOT VALID", 1.2, null, "Infinity.NaN.Infinity"];

  for (const v of versions) {
    await t.step(`invalid ${v}`, () => {
      assertThrows(
        function () {
          parse(v as string);
        },
        TypeError,
      );
    });
  }
});

Deno.test({
  name: "maxSatisfying",
  fn: async (t) => {
    const versions: [string[], string, string][] = [
      [["1.2.3", "1.2.4"], "1.2", "1.2.4"],
      [["1.2.4", "1.2.3"], "1.2", "1.2.4"],
      [["1.2.3", "1.2.4", "1.2.5", "1.2.6"], "~1.2.3", "1.2.6"],
    ];

    for (const [v, r, e] of versions) {
      await t.step(`[${v}] ${r} : ${e}`, () => {
        const versions = v.map((v) => parse(v));
        const range = parseRange(r);
        const expect = parse(e);
        const actual = maxSatisfying(versions, range);
        assertEquals(actual, expect);
      });
    }
  },
});

Deno.test("minSatisfying", async (t) => {
  const versions: [string[], string, string][] = [
    [["1.2.3", "1.2.4"], "1.2", "1.2.3"],
    [["1.2.4", "1.2.3"], "1.2", "1.2.3"],
    [["1.2.3", "1.2.4", "1.2.5", "1.2.6"], "~1.2.3", "1.2.3"],
  ];

  for (const [v, r, e] of versions) {
    await t.step(`[${v}] ${r} : ${e}`, () => {
      const s = v.map((v) => parse(v));
      const range = parseRange(r);
      const expected = parse(e);
      const actual = minSatisfying(s, range);
      assertEquals(actual, expected);
    });
  }
});

Deno.test("sorting", function () {
  const list = ["1.2.3+1", "1.2.3+0", "1.2.3", "5.9.6", "0.1.2"];
  const sorted = ["0.1.2", "1.2.3", "1.2.3+0", "1.2.3+1", "5.9.6"];
  const rsorted = ["5.9.6", "1.2.3+1", "1.2.3+0", "1.2.3", "0.1.2"];
  assertEquals(sort(list.map((v) => parse(v))), sorted.map((v) => parse(v)));
  assertEquals(rsort(list.map((v) => parse(v))), rsorted.map((v) => parse(v)));
});

Deno.test("badRangesInMaxOrMinSatisfying", function () {
  const r = parseRange("some frogs and sneks-v2.5.6");
  assertEquals(maxSatisfying([MIN, MAX], r), undefined);
  assertEquals(minSatisfying([MIN, MAX], r), undefined);
});

Deno.test("bigNumericPrerelease", function () {
  const r = parse("1.2.3-beta." + Number.MAX_SAFE_INTEGER + "0");
  assertEquals(r.prerelease, ["beta", "90071992547409910"]);
});
