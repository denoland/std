// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "../assert/mod.ts";
import { extname, posix, win32 } from "./mod.ts";

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

Deno.test("[path] extname - posix", () => {
  pairs.forEach((p) => {
    const input = p[0];
    const expected = p[1];
    assertEquals(expected, posix.extname(input));
    assertEquals(expected, extname(input, { os: "linux" }));
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
  assertEquals(extname(".\\", { os: "linux" }), "");
  assertEquals(extname("..\\", { os: "linux" }), ".\\");
  assertEquals(extname("file.ext\\", { os: "linux" }), ".ext\\");
  assertEquals(extname("file.ext\\\\", { os: "linux" }), ".ext\\\\");
  assertEquals(extname("file\\", { os: "linux" }), "");
  assertEquals(extname("file\\\\", { os: "linux" }), "");
  assertEquals(extname("file.\\", { os: "linux" }), ".\\");
  assertEquals(extname("file.\\\\", { os: "linux" }), ".\\\\");
});

Deno.test("[path] extname - windows", () => {
  pairs.forEach(function (p) {
    const input = p[0].replace(slashRE, "\\");
    const expected = p[1];
    assertEquals(expected, win32.extname(input));
    assertEquals(expected, win32.extname("C:" + input));
    assertEquals(expected, extname(input, { os: "windows" }));
    assertEquals(expected, extname("C:" + input, { os: "windows" }));
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
  assertEquals(extname(".\\", { os: "windows" }), "");
  assertEquals(extname("..\\", { os: "windows" }), "");
  assertEquals(extname("file.ext\\", { os: "windows" }), ".ext");
  assertEquals(extname("file.ext\\\\", { os: "windows" }), ".ext");
  assertEquals(extname("file\\", { os: "windows" }), "");
  assertEquals(extname("file\\\\", { os: "windows" }), "");
  assertEquals(extname("file.\\", { os: "windows" }), ".");
  assertEquals(extname("file.\\\\", { os: "windows" }), ".");
});
