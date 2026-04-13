// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { CHAR_FORWARD_SLASH } from "./constants.ts";
import { normalizeString } from "./normalize_string.ts";

function isSeparator(code: number): boolean {
  return code === CHAR_FORWARD_SLASH;
}

Deno.test("normalizeSring()", () => {
  assertEquals(normalizeString("", true, "/", isSeparator), "");
  assertEquals(normalizeString("", false, "/", isSeparator), "");
  assertEquals(normalizeString("a/../b", true, "/", isSeparator), "b");
  assertEquals(normalizeString("foo/bar/", true, "/", isSeparator), "foo/bar");
  assertEquals(normalizeString("/foo/bar", true, "/", isSeparator), "foo/bar");
  assertEquals(normalizeString("./foo/bar", true, "/", isSeparator), "foo/bar");
  assertEquals(
    normalizeString("../foo/bar/baz/", true, "/", isSeparator),
    "../foo/bar/baz",
  );
  assertEquals(
    normalizeString("/foo/../../bar", true, "/", isSeparator),
    "../bar",
  );
});
