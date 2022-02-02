// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "../testing/asserts.ts";
import { extname } from "./extname.ts";

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

Deno.test("extname", function () {
  pairs.forEach(function (p) {
    const input = p[0];
    const expected = p[1];
    assertEquals(expected, extname(input, { os: "linux" }));
  });

  // On *nix, backslash is a valid name component like any other character.
  assertEquals(extname(".\\", { os: "linux" }), "");
  assertEquals(extname("..\\", { os: "linux" }), ".\\");
  assertEquals(extname("file.ext\\", { os: "linux" }), ".ext\\");
  assertEquals(extname("file.ext\\\\", { os: "linux" }), ".ext\\\\");
  assertEquals(extname("file\\", { os: "linux" }), "");
  assertEquals(extname("file\\\\", { os: "linux" }), "");
  assertEquals(extname("file.\\", { os: "linux" }), ".\\");
  assertEquals(extname("file.\\\\", { os: "linux" }), ".\\\\");
});

Deno.test("extnameWin32", function () {
  pairs.forEach(function (p) {
    const input = p[0].replace(slashRE, "\\");
    const expected = p[1];
    assertEquals(expected, extname(input, { os: "windows" }));
    assertEquals(expected, extname("C:" + input, { os: "windows" }));
  });

  // On Windows, backslash is a path separator.
  assertEquals(extname(".\\", { os: "windows" }), "");
  assertEquals(extname("..\\", { os: "windows" }), "");
  assertEquals(extname("file.ext\\", { os: "windows" }), ".ext");
  assertEquals(extname("file.ext\\\\", { os: "windows" }), ".ext");
  assertEquals(extname("file\\", { os: "windows" }), "");
  assertEquals(extname("file\\\\", { os: "windows" }), "");
  assertEquals(extname("file.\\", { os: "windows" }), ".");
  assertEquals(extname("file.\\\\", { os: "windows" }), ".");
});
