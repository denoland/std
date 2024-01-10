// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { normalizeGlob } from "./normalize_glob.ts";
import { SEP } from "./mod.ts";

Deno.test("normalizeGlob() checks options.globstar", function () {
  assertEquals(normalizeGlob(`**${SEP}..`, { globstar: true }), `**${SEP}..`);
});
