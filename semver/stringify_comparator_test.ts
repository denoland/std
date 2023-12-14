// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { parseComparator } from "./parse_comparator.ts";
import { stringifyComparator } from "./stringify_comparator.ts";

Deno.test("stringifyComparator()", () => {
  assertEquals(
    stringifyComparator(parseComparator(">= v1.2.3")),
    ">=1.2.3",
  );
  assertEquals(
    stringifyComparator(parseComparator(">= v1.2.3-pre.1+b.2")),
    ">=1.2.3-pre.1+b.2",
  );
});
