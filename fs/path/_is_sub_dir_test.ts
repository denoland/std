// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/

import { test } from "../../testing/mod.ts";
import { assertEquals } from "../../testing/asserts.ts";
import { isSubdir } from "./_is_sub_dir.ts";
import { isWindows } from "./constants.ts";

const pairs = [
  ["", "", false, "/"],
  ["/first/second", "/first", false, "/"],
  ["/first", "/first", false, "/"],
  ["/first", "/first/second", true, "/"],
  ["first", "first/second", true, "/"],
  ["../first", "../first/second", true, "/"],
  ["c:\\\\first", "c:\\\\first", false, "\\\\"],
  ["c:\\\\first", "c:\\\\first\\\\second", true, "\\\\"]
];

test(function _isSubdir() {
  pairs.forEach(function(p) {
    const src = p[0] as string;
    const dest = p[1] as string;
    const expected = p[2] as Boolean;
    const sep = p[3] ? p[3] : isWindows ? "\\\\" : "/";
    assertEquals(
      isSubdir(src, dest, sep as string),
      expected,
      `'${src}' should be parent dir of '${dest}'`
    );
  });
});
