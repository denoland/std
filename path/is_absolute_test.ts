// Copyright 2018-2026 the Deno authors. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "@std/assert";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";
import { isAbsolute } from "./is_absolute.ts";

Deno.test("posix.isAbsolute()", function () {
  assertEquals(posix.isAbsolute("/home/foo"), true);
  assertEquals(posix.isAbsolute("/home/foo/.."), true);
  assertEquals(posix.isAbsolute("bar/"), false);
  assertEquals(posix.isAbsolute("./baz"), false);
});

Deno.test("windows.isAbsolute()", function () {
  assertEquals(windows.isAbsolute(""), false);
  assertEquals(windows.isAbsolute("/"), true);
  assertEquals(windows.isAbsolute("//"), true);
  assertEquals(windows.isAbsolute("//server"), true);
  assertEquals(windows.isAbsolute("//server/file"), true);
  assertEquals(windows.isAbsolute("\\\\server\\file"), true);
  assertEquals(windows.isAbsolute("\\\\server"), true);
  assertEquals(windows.isAbsolute("\\\\"), true);
  assertEquals(windows.isAbsolute("c"), false);
  assertEquals(windows.isAbsolute("c:"), false);
  assertEquals(windows.isAbsolute("c:\\"), true);
  assertEquals(windows.isAbsolute("c:/"), true);
  assertEquals(windows.isAbsolute("c://"), true);
  assertEquals(windows.isAbsolute("C:/Users/"), true);
  assertEquals(windows.isAbsolute("C:\\Users\\"), true);
  assertEquals(windows.isAbsolute("C:cwd/another"), false);
  assertEquals(windows.isAbsolute("C:cwd\\another"), false);
  assertEquals(windows.isAbsolute("directory/directory"), false);
  assertEquals(windows.isAbsolute("directory\\directory"), false);
});

Deno.test("isAbsolute() returns false if input is empty", function () {
  assertEquals(isAbsolute(""), false);
});
