// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "../assert/mod.ts";
import { isAbsolute, posix, win32 } from "./mod.ts";

Deno.test("[path] isAbsolute - posix", () => {
  assertEquals(posix.isAbsolute("/home/foo"), true);
  assertEquals(posix.isAbsolute("/home/foo/.."), true);
  assertEquals(posix.isAbsolute("bar/"), false);
  assertEquals(posix.isAbsolute("./baz"), false);

  assertEquals(isAbsolute("/home/foo", { os: "linux" }), true);
  assertEquals(isAbsolute("/home/foo/..", { os: "linux" }), true);
  assertEquals(isAbsolute("bar/", { os: "linux" }), false);
  assertEquals(isAbsolute("./baz", { os: "linux" }), false);
});

Deno.test("[path] isAbsolute - windows", () => {
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

  assertEquals(isAbsolute("/", { os: "windows" }), true);
  assertEquals(isAbsolute("//", { os: "windows" }), true);
  assertEquals(isAbsolute("//server", { os: "windows" }), true);
  assertEquals(isAbsolute("//server/file", { os: "windows" }), true);
  assertEquals(isAbsolute("\\\\server\\file", { os: "windows" }), true);
  assertEquals(isAbsolute("\\\\server", { os: "windows" }), true);
  assertEquals(isAbsolute("\\\\", { os: "windows" }), true);
  assertEquals(isAbsolute("c", { os: "windows" }), false);
  assertEquals(isAbsolute("c:", { os: "windows" }), false);
  assertEquals(isAbsolute("c:\\", { os: "windows" }), true);
  assertEquals(isAbsolute("c:/", { os: "windows" }), true);
  assertEquals(isAbsolute("c://", { os: "windows" }), true);
  assertEquals(isAbsolute("C:/Users/", { os: "windows" }), true);
  assertEquals(isAbsolute("C:\\Users\\", { os: "windows" }), true);
  assertEquals(isAbsolute("C:cwd/another", { os: "windows" }), false);
  assertEquals(isAbsolute("C:cwd\\another", { os: "windows" }), false);
  assertEquals(isAbsolute("directory/directory", { os: "windows" }), false);
  assertEquals(isAbsolute("directory\\directory", { os: "windows" }), false);
});
