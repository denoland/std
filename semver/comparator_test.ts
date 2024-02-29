// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { parseRange } from "./parse_range.ts";
import { parse } from "./parse.ts";
import { testRange } from "./test_range.ts";
import { parseComparator } from "./_parse_comparator.ts";
import { formatComparator } from "./_format_comparator.ts";
import type { Comparator } from "./types.ts";

Deno.test({
  name: "parseComparator() and formatComparator()",
  fn: async (t) => {
    const versions: [string, string[], string[]][] = [
      [
        "1.0.0 - 2.0.0",
        ["1.0.0", "1.2.3", "2.0.0"],
        ["0.0.0", "2.0.1"],
      ],
      ["1.0.0", ["1.0.0"], ["0.0.0", "1.0.1"]],
      [">=*", ["0.0.0", "9999.9999.9999"], []],
      ["", ["0.0.0"], []],
      ["*", ["0.0.0", "9999.9999.9999"], []],
      [">=1.0.0", ["1.0.0", "9999.9999.9999"], ["0.1.2", "0.0.0"]],
      [">1.0.0", ["1.0.1", "9999.9999.9999"], ["0.1.2", "0.0.0", "1.0.0"]],
      ["<=2.0.0", ["0.0.0", "1.0.1", "2.0.0"], ["2.0.1", "9999.9999.9999"]],
      ["<2.0.0", ["0.0.0", "1.0.1", "1.2.3"], ["2.0.0", "9999.9999.9999"]],
      ["1", ["1.0.0", "1.0.1", "1.2.3"], ["0.0.0", "2.0.0", "9999.9999.9999"]],
      [">=0.1.97", ["0.1.97", "1.0.0", "9999.9999.9999"], ["0.0.0", "0.1.96"]],
      ["0.1.20", ["0.1.20"], ["0.0.0", "0.1.19", "0.1.21", "9999.9999.9999"]],
      [">=0.2.3", ["0.2.3", "0.2.4", "1.0.0"], ["0.0.0", "0.2.2", "0.1.0"]],
      ["||", ["0.0.0", "9999.9999.9999"], []],
      ["2.x.x", ["2.0.0", "2.9999.9999"], ["1.9999.9999", "3.0.0"]],
      ["1.2.x", ["1.2.0", "1.2.9999"], ["1.1.9999", "1.3.0"]],
      [
        "1.2.x || 2.x",
        ["1.2.0", "1.2.9999", "2.0.0", "2.9999.9999"],
        ["1.1.9999", "1.3.0", "3.0.0"],
      ],
      ["x", ["0.0.0", "9999.9999.9999"], []],
      ["2.*.*", ["2.0.0", "2.9999.9999"], ["1.9999.9999", "3.0.0"]],
      ["1.2.*", ["1.2.0", "1.2.9999"], ["1.1.9999", "1.3.0"]],
      [
        "1.2.* || 2.*",
        ["1.2.0", "1.2.9999", "2.0.0", "2.9999.9999"],
        ["1.1.9999", "1.3.0", "3.0.0"],
      ],
      ["*", ["0.0.0", "9999.9999.9999"], []],
      ["2", ["2.0.0", "2.0.1", "2.2.3"], [
        "0.0.0",
        "1.9999.9999",
        "3.0.0",
        "9999.9999.9999",
      ]],
      ["2.3", ["2.3.0", "2.3.1", "2.3.9999"], [
        "0.0.0",
        "2.2.9999",
        "2.4.0",
        "9999.9999.9999",
      ]],
      ["~2.4", ["2.4.0", "2.4.9999"], [
        "0.0.0",
        "2.3.9999",
        "2.5.0",
        "9999.9999.9999",
      ]],
      ["~>3.2.1", ["3.2.1", "3.2.9999"], [
        "0.0.0",
        "3.2.0",
        "3.3.0",
        "9999.9999.9999",
      ]],
      ["~1", ["1.0.0", "1.9999.9999"], [
        "0.0.0",
        "0.9999.9999",
        "2.0.0",
        "9999.9999.9999",
      ]],
      ["~>1", ["1.0.0", "1.9999.9999"], [
        "0.0.0",
        "0.9999.9999",
        "2.0.0",
        "9999.9999.9999",
      ]],
      ["~1.0", ["1.0.0", "1.0.9999"], [
        "0.0.0",
        "0.9999.9999",
        "1.1.0",
        "9999.9999.9999",
      ]],
      ["<1", ["0.0.0", "0.9999.9999"], ["1.0.0", "9999.9999.9999"]],
      [">=1", ["1.0.0", "9999.9999.9999"], ["0.0.0", "0.9999.9999"]],
      ["<1.2", ["0.0.0", "1.1.0"], ["1.2.0", "9999.9999.9999"]],

      // This is effectively 1 & 2, which matches nothing.
      ["1 2", [], [
        "1.0.0",
        "1.9999.9999",
        "2.0.0",
        "2.9999.9999",
        "0.0.0",
        "0.9999.9999",
        "3.0.0",
        "9999.9999.9999",
      ]],
      ["1.2 - 3.4.5", ["1.2.0", "1.2.3", "3.4.5"], [
        "0.0.0",
        "1.1.9999",
        "3.4.6",
        "9999.9999.9999",
      ]],
      ["1.2.3 - 3.4", ["1.2.3", "2.0.0", "3.4.9999"], [
        "0.0.0",
        "1.2.2",
        "3.5.0",
        "9999.9999.9999",
      ]],
      ["1.2.3 - 3", ["1.2.3", "2.0.0", "3.0.0", "3.9999.9999"], [
        "0.0.0",
        "1.2.2",
        "4.0.0",
        "9999.9999.9999",
      ]],

      // handle spaces between comparators and versions
      [">= 1", ["1.0.0", "2.0.0", "3.0.0"], ["0.9999.9999"]],
      ["< 2", ["1.9999.9999"], ["2.0.0"]],
      ["= 1.0.0 || = 1.0.5", ["1.0.0", "1.0.5"], ["1.0.1", "1.1.1"]],

      // Nothing can match...
      [">*", [], ["0.0.0", "9999.9999.9999"]],
      ["<*", [], ["0.0.0", "9999.9999.9999"]],
    ];

    for (const [range, validVersions, invalidVersions] of versions) {
      await t.step({
        name: range,
        fn: async (t) => {
          const r = parseRange(range);
          for (const valid of validVersions) {
            await t.step({
              name: valid,
              fn: () => {
                const version = parse(valid);
                const actual = testRange(version, r);
                assertEquals(true, actual);
              },
            });
          }
          for (const invalid of invalidVersions) {
            await t.step({
              name: invalid,
              fn: () => {
                const actual = testRange(parse(invalid), r);
                assertEquals(false, actual);
              },
            });
          }
        },
      });
    }
  },
});

Deno.test("comparatorFormat() handles semver inheritance", function () {
  assertEquals(
    formatComparator(parseComparator(">= v1.2.3")),
    ">=1.2.3",
  );
  assertEquals(
    formatComparator(parseComparator(">= v1.2.3-pre.1+b.2")),
    ">=1.2.3-pre.1+b.2",
  );
});

Deno.test("comparatorFormat() handles deprecated Comparator.semver property", function () {
  const c1 = parseComparator(">= v1.2.3");
  assertEquals(
    formatComparator(
      { operator: c1.operator, semver: c1.semver } as Comparator,
    ),
    ">=1.2.3",
  );
  const c2 = parseComparator(">= v1.2.3-pre.1+b.2");

  assertEquals(
    formatComparator(
      { operator: c2.operator, semver: c2.semver } as Comparator,
    ),
    ">=1.2.3-pre.1+b.2",
  );
});
