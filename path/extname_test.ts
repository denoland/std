// Copyright 2018-2025 the Deno authors. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "@std/assert";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";

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
] as const;

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

  assertEquals(
    posix.extname(new URL("file:///home/user/Documents/image.png")),
    ".png",
  );
  assertEquals(
    posix.extname(new URL("file:///home/user/Documents")),
    "",
  );
});

Deno.test("windows.extname()", function () {
  pairs.forEach(function (p) {
    const input = p[0].replace(slashRE, "\\");
    const expected = p[1];
    assertEquals(expected, windows.extname(input));
    assertEquals(expected, windows.extname("C:" + input));
  });

  // On Windows, backslash is a path separator.
  assertEquals(windows.extname(".\\"), "");
  assertEquals(windows.extname("..\\"), "");
  assertEquals(windows.extname("file.ext\\"), ".ext");
  assertEquals(windows.extname("file.ext\\\\"), ".ext");
  assertEquals(windows.extname("file\\"), "");
  assertEquals(windows.extname("file\\\\"), "");
  assertEquals(windows.extname("file.\\"), ".");
  assertEquals(windows.extname("file.\\\\"), ".");

  assertEquals(
    windows.extname(new URL("file:///C:/home/user/Documents/image.png")),
    ".png",
  );
  assertEquals(
    windows.extname(new URL("file:///C:/home/user/Documents")),
    "",
  );
});
