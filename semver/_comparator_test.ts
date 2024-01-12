// Copyright Isaac Z. Schlueter and Contributors. All rights reserved. ISC license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert } from "../assert/mod.ts";
import { parse } from "./parse.ts";
import { comparatorIncludes, parseComparator } from "./_comparator.ts";

Deno.test("comparatorIncludes()", function () {
  const c = parseComparator(">=1.2.3");
  assert(comparatorIncludes(c, parse("1.2.4")));
});
