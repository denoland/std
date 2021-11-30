// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "../testing/asserts.ts";
import { isAbsolute } from "./is_absolute.ts";

Deno.test("isAbsolute", function () {
  assertEquals(isAbsolute("/home/foo", { os: "linux" }), true);
  assertEquals(isAbsolute("/home/foo/..", { os: "linux" }), true);
  assertEquals(isAbsolute("bar/", { os: "linux" }), false);
  assertEquals(isAbsolute("./baz", { os: "linux" }), false);
});

Deno.test("isAbsoluteWin32", function () {
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
