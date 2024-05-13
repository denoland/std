// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This code was vendored from `fmt/colors_test.ts`.

import { assertEquals } from "./assert_equals.ts";
import { stripAnsiCode } from "./_strip_ansi_code.ts";

// https://github.com/chalk/strip-ansi/blob/2b8c961e75760059699373f9a69101065c3ded3a/test.js#L4-L6
Deno.test("stripAnsiCode()", function () {
  assertEquals(
    stripAnsiCode(
      "\u001B[0m\u001B[4m\u001B[42m\u001B[31mfoo\u001B[39m\u001B[49m\u001B[24mfoo\u001B[0m",
    ),
    "foofoo",
  );
});
