// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { normalizeGlob } from "./normalize_glob.ts";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";
import { SEPARATOR } from "./constants.ts";

Deno.test("normalizeGlob() checks options.globstar", function () {
  assertEquals(
    normalizeGlob(`**${SEPARATOR}..`, { globstar: true }),
    `**${SEPARATOR}..`,
  );
});

Deno.test("normalizeGlob() throws if it contains \\0 character", () => {
  assertThrows(
    () => {
      posix.normalizeGlob("\0");
    },
    Error,
    "Glob contains invalid characters:",
  );
  assertThrows(
    () => {
      windows.normalizeGlob("\0");
    },
    Error,
    "Glob contains invalid characters:",
  );
});

Deno.test(
  "normalizeGlob() works as the same way as normalize if globstar option is false",
  () => {
    assertEquals(
      posix.normalizeGlob("foo/bar/../baz"),
      "foo/baz",
    );
    assertEquals(windows.normalizeGlob("foo/bar/../baz"), "foo\\baz");
  },
);
