// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "../assert/mod.ts";
import * as posix from "./posix/mod.ts";
import * as win32 from "./windows/mod.ts";

Deno.test("posix.isAbsolute()", function () {
  assertEquals(posix.isAbsolute("/home/foo"), true);
  assertEquals(posix.isAbsolute("/home/foo/.."), true);
  assertEquals(posix.isAbsolute("bar/"), false);
  assertEquals(posix.isAbsolute("./baz"), false);
});

Deno.test("win32.isAbsolute()", function () {
  assertEquals(win32.isAbsolute("/"), true);
  assertEquals(win32.isAbsolute("//"), true);
  assertEquals(win32.isAbsolute("//server"), true);
  assertEquals(win32.isAbsolute("//server/file"), true);
  assertEquals(win32.isAbsolute("\\\\server\\file"), true);
  assertEquals(win32.isAbsolute("\\\\server"), true);
  assertEquals(win32.isAbsolute("\\\\"), true);
  assertEquals(win32.isAbsolute("c"), false);
  assertEquals(win32.isAbsolute("c:"), false);
  assertEquals(win32.isAbsolute("c:\\"), true);
  assertEquals(win32.isAbsolute("c:/"), true);
  assertEquals(win32.isAbsolute("c://"), true);
  assertEquals(win32.isAbsolute("C:/Users/"), true);
  assertEquals(win32.isAbsolute("C:\\Users\\"), true);
  assertEquals(win32.isAbsolute("C:cwd/another"), false);
  assertEquals(win32.isAbsolute("C:cwd\\another"), false);
  assertEquals(win32.isAbsolute("directory/directory"), false);
  assertEquals(win32.isAbsolute("directory\\directory"), false);
});
