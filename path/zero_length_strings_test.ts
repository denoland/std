// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "../assert/mod.ts";
import * as path from "./mod.ts";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";

const pwd = Deno.cwd();
Deno.test(`join() returns "." if input is empty`, function () {
  assertEquals(posix.join(""), ".");
  assertEquals(posix.join("", ""), ".");
  if (windows) assertEquals(windows.join(""), ".");
  if (windows) assertEquals(windows.join("", ""), ".");
  assertEquals(path.join(pwd), pwd);
  assertEquals(path.join(pwd, ""), pwd);
});

Deno.test(`normalize() returns "." if input is empty`, function () {
  assertEquals(posix.normalize(""), ".");
  if (windows) assertEquals(windows.normalize(""), ".");
  assertEquals(path.normalize(pwd), pwd);
});

Deno.test("isAbsolute() retuns false if input is empty", function () {
  assertEquals(posix.isAbsolute(""), false);
  if (windows) assertEquals(windows.isAbsolute(""), false);
});

Deno.test("resolve() returns current working directory if input is empty", function () {
  assertEquals(path.resolve(""), pwd);
  assertEquals(path.resolve("", ""), pwd);
});

Deno.test("relative() returns current working directory if input is empty", function () {
  assertEquals(path.relative("", pwd), "");
  assertEquals(path.relative(pwd, ""), "");
  assertEquals(path.relative(pwd, pwd), "");
});
