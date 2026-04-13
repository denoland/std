// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { tryParseRange } from "./try_parse_range.ts";
import type { Range } from "./types.ts";

Deno.test("tryParseRange()", () => {
  const actual = tryParseRange(">=1.2.3 <1.2.4");
  const expected: Range = [
    [
      {
        operator: ">=",
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: [],
        build: [],
      },
      {
        operator: "<",
        major: 1,
        minor: 2,
        patch: 4,
        prerelease: [],
        build: [],
      },
    ],
  ];
  assertEquals(actual, expected);
});

Deno.test("tryParseRange() handles invalid range", () => {
  assertEquals(tryParseRange("blerg"), undefined);
});
