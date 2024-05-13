// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This code was vendored from `fmt/colors_test.ts`.

import { assertEquals } from "./assert_equals.ts";
import { red } from "./_red.ts";

Deno.test("red() single color", function () {
  assertEquals(red("foo bar"), "[31mfoo bar[39m");
});
