// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { joinGlobs } from "./join_globs.ts";
import { SEPARATOR } from "./mod.ts";

Deno.test("joinGlobs() checks options.globstar", function () {
  assertEquals(joinGlobs(["**", ".."], { globstar: true }), `**${SEPARATOR}..`);
});
