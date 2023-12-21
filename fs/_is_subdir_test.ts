// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.

import { assertEquals } from "../assert/mod.ts";
import { SEP as SEP_POSIX } from "../path/posix/separator.ts";
import { SEP as SEP_WIN32 } from "../path/windows/separator.ts";
import { isSubdir } from "./_is_subdir.ts";

Deno.test("isSubdir() returns a boolean indicating if dir is a subdir", function () {
  const pairs = [
    ["", "", false, SEP_POSIX],
    ["/first/second", "/first", false, SEP_POSIX],
    ["/first", "/first", false, SEP_POSIX],
    ["/first", "/first/second", true, SEP_POSIX],
    ["first", "first/second", true, SEP_POSIX],
    ["../first", "../first/second", true, SEP_POSIX],
    ["c:\\first", "c:\\first", false, SEP_WIN32],
    ["c:\\first", "c:\\first\\second", true, SEP_WIN32],
  ];

  pairs.forEach(function (p) {
    const src = p[0] as string;
    const dest = p[1] as string;
    const expected = p[2] as boolean;
    const sep = p[3] as string;
    assertEquals(
      isSubdir(src, dest, sep),
      expected,
      `'${src}' should ${expected ? "" : "not"} be parent dir of '${dest}'`,
    );
  });
});
