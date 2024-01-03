// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "../assert/mod.ts";
import * as posix from "./posix/mod.ts";
import * as win32 from "./windows/mod.ts";

const slashRE = /\//g;

const pairs = [
  ["", ""],
  ["/path/to/file", ""],
  ["/path/to/file.ext", ".ext"],
  ["/path.to/file.ext", ".ext"],
  ["/path.to/file", ""],
  ["/path.to/.file", ""],
  ["/path.to/.file.ext", ".ext"],
  ["/path/to/f.ext", ".ext"],
  ["/path/to/..ext", ".ext"],
  ["/path/to/..", ""],
  ["file", ""],
  ["file.ext", ".ext"],
  [".file", ""],
  [".file.ext", ".ext"],
  ["/file", ""],
  ["/file.ext", ".ext"],
  ["/.file", ""],
  ["/.file.ext", ".ext"],
  [".path/file.ext", ".ext"],
  ["file.ext.ext", ".ext"],
  ["file.", "."],
  [".", ""],
  ["./", ""],
  [".file.ext", ".ext"],
  [".file", ""],
  [".file.", "."],
  [".file..", "."],
  ["..", ""],
  ["../", ""],
  ["..file.ext", ".ext"],
  ["..file", ".file"],
  ["..file.", "."],
  ["..file..", "."],
  ["...", "."],
  ["...ext", ".ext"],
  ["....", "."],
  ["file.ext/", ".ext"],
  ["file.ext//", ".ext"],
  ["file/", ""],
  ["file//", ""],
  ["file./", "."],
  ["file.//", "."],
];

Deno.test("posix.extname()", function () {
  pairs.forEach(function (p) {
    const input = p[0];
    const expected = p[1];
    assertEquals(expected, posix.extname(input));
  });

  // On *nix, backslash is a valid name component like any other character.
  assertEquals(posix.extname(".\\"), "");
  assertEquals(posix.extname("..\\"), ".\\");
  assertEquals(posix.extname("file.ext\\"), ".ext\\");
  assertEquals(posix.extname("file.ext\\\\"), ".ext\\\\");
  assertEquals(posix.extname("file\\"), "");
  assertEquals(posix.extname("file\\\\"), "");
  assertEquals(posix.extname("file.\\"), ".\\");
  assertEquals(posix.extname("file.\\\\"), ".\\\\");
});

Deno.test("win32.extname()", function () {
  pairs.forEach(function (p) {
    const input = p[0].replace(slashRE, "\\");
    const expected = p[1];
    assertEquals(expected, win32.extname(input));
    assertEquals(expected, win32.extname("C:" + input));
  });

  // On Windows, backslash is a path separator.
  assertEquals(win32.extname(".\\"), "");
  assertEquals(win32.extname("..\\"), "");
  assertEquals(win32.extname("file.ext\\"), ".ext");
  assertEquals(win32.extname("file.ext\\\\"), ".ext");
  assertEquals(win32.extname("file\\"), "");
  assertEquals(win32.extname("file\\\\"), "");
  assertEquals(win32.extname("file.\\"), ".");
  assertEquals(win32.extname("file.\\\\"), ".");
});
