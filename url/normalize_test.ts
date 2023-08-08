// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

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
  ["https:/deno.land//", new URL("https://deno.land")],
];

Deno.test("normalize", function () {
  for (const [test_url, expected] of TESTSUITE) {
    assertEquals(url.normalize(test_url), expected);
  }
});
