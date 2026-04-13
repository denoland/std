// Copyright 2018-2026 the Deno authors. MIT license.
// Copyright the Browserify authors. MIT License.

import { assertEquals } from "@std/assert";
import { SEPARATOR as SEP_POSIX } from "@std/path/posix/constants";
import { SEPARATOR as SEP_WIN32 } from "@std/path/windows/constants";
import { isSubdir } from "./_is_subdir.ts";

Deno.test("isSubdir() returns a boolean indicating if dir is a subdir", function () {
  const pairs = [
    ["", "", false, SEP_POSIX],
    [".", "", false, SEP_POSIX],
    ["/first/second", "/first", false, SEP_POSIX],
    ["/first", "/first", false, SEP_POSIX],
    ["/first", "/first/second", true, SEP_POSIX],
    ["first", "first/second", true, SEP_POSIX],
    ["../first", "../first/second", true, SEP_POSIX],
    ["c:\\first", "c:\\first", false, SEP_WIN32],
    ["c:\\first", "c:\\first\\second", true, SEP_WIN32],
  ] as const;

  pairs.forEach(function ([src, dest, expected, sep]) {
    assertEquals(
      isSubdir(src, dest, sep),
      expected,
      `'${src}' should ${expected ? "" : "not"} be parent dir of '${dest}'`,
    );
  });
});
