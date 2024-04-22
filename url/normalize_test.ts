// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import * as url from "./mod.ts";

const TESTSUITE = [
  [
    "https:///deno.land///std//assert////mod.ts",
    new URL("https://deno.land/std/assert/mod.ts"),
  ],
  [
    "https://deno.land///std//assert////mod.ts?foo=bar",
    new URL("https://deno.land/std/assert/mod.ts?foo=bar"),
  ],
  [
    "https://deno.land///std//assert////mod.ts#header",
    new URL("https://deno.land/std/assert/mod.ts#header"),
  ],
  [
    "https:///deno.land/std/assert/mod.ts/..",
    new URL("https://deno.land/std/assert/"),
  ],
  [
    new URL("https://deno.land/std/assert/../async/retry.ts/"),
    new URL("https://deno.land/std/async/retry.ts/"),
  ],
  [
    "https:/deno.land//..",
    new URL("https://deno.land"),
  ],
] as const;

Deno.test("normalize()", function () {
  for (const [testUrl, expected] of TESTSUITE) {
    assertEquals(url.normalize(testUrl), expected);
  }
});
