// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { normalizeGlob } from "./normalize_glob.ts";
import { SEPARATOR } from "./constants.ts";

Deno.test("normalizeGlob() checks options.globstar", function () {
  assertEquals(
    normalizeGlob(`**${SEPARATOR}..`, { globstar: true }),
    `**${SEPARATOR}..`,
  );
});
