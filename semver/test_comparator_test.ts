// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert } from "../assert/mod.ts";
import { parse } from "./parse.ts";
import { parseComparator } from "./parse_comparator.ts";
import { testComparator } from "./test_comparator.ts";
import { Comparator } from "./types.ts";

Deno.test("testComparator()", () => {
  const c = parseComparator(">=1.2.3");
  assert(testComparator(parse("1.2.4"), c));
});

Deno.test("testComparator() handles deprecated Comparator.semver property", () => {
  const c = parseComparator(">=1.2.3");
  assert(
    testComparator(
      parse("1.2.4"),
      { operator: c.operator, semver: c.semver } as Comparator,
    ),
  );
});
