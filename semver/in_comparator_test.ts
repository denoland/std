// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert } from "../testing/asserts.ts";
import { parse } from "./parse.ts";
import { parseComparator } from "./parse_comparator.ts";
import { inComparator } from "./in_comparator.ts";

Deno.test("test", function () {
  const c = parseComparator(">=1.2.3");
  assert(inComparator(parse("1.2.4"), c));
});
