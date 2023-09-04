// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "../assert/mod.ts";
import {
  isAbsolute,
  join,
  normalize,
  posix,
  relative,
  resolve,
  win32,
} from "./mod.ts";

const pwd = Deno.cwd();

Deno.test("[path] joinZeroLength", () => {
  // join will internally ignore all the zero-length strings and it will return
  // '.' if the joined string is a zero-length string.
  assertEquals(posix.join(""), ".");
  assertEquals(posix.join("", ""), ".");
  assertEquals(join("", { os: "linux" }), ".");
  assertEquals(join("", "", { os: "linux" }), ".");

  assertEquals(win32.join(""), ".");
  assertEquals(win32.join("", ""), ".");
  assertEquals(join("", { os: "windows" }), ".");
  assertEquals(join("", "", { os: "windows" }), ".");

  assertEquals(join(pwd), pwd);
  assertEquals(join(pwd, ""), pwd);
});

Deno.test("[path] normalizeZeroLength", () => {
  // normalize will return '.' if the input is a zero-length string
  assertEquals(posix.normalize(""), ".");
  assertEquals(normalize("", { os: "linux" }), ".");
  assertEquals(win32.normalize(""), ".");
  assertEquals(normalize("", { os: "windows" }), ".");
  assertEquals(normalize(pwd), pwd);
});

Deno.test("[path] isAbsoluteZeroLength", () => {
  // Since '' is not a valid path in any of the common environments,
  // return false
  assertEquals(posix.isAbsolute(""), false);
  assertEquals(isAbsolute("", { os: "linux" }), false);
  assertEquals(win32.isAbsolute(""), false);
  assertEquals(isAbsolute("", { os: "windows" }), false);
  assertEquals(isAbsolute(""), false);
});

Deno.test("[path] resolveZeroLength", () => {
  // resolve, internally ignores all the zero-length strings and returns the
  // current working directory
  assertEquals(resolve(""), pwd);
  assertEquals(resolve("", ""), pwd);
});

Deno.test("[path] relativeZeroLength", () => {
  // relative, internally calls resolve. So, '' is actually the current
  // directory
  assertEquals(relative("", pwd), "");
  assertEquals(relative(pwd, ""), "");
  assertEquals(relative(pwd, pwd), "");
});
