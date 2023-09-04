// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "../assert/mod.ts";
import { dirname, posix, win32 } from "./mod.ts";

// Test suite from "GNU core utilities"
// https://github.com/coreutils/coreutils/blob/master/tests/misc/dirname.pl
const COREUTILS_TESTSUITE = [
  ["d/f", "d"],
  ["/d/f", "/d"],
  ["d/f/", "d"],
  ["d/f//", "d"],
  ["f", "."],
  ["/", "/"],
  ["//", "/"],
  ["///", "/"],
  ["//a//", "/"],
  ["///a///", "/"],
  ["///a///b", "///a"],
  ["///a//b/", "///a"],
  ["", "."],
];

const POSIX_TESTSUITE = [
  ["/a/b/", "/a"],
  ["/a/b", "/a"],
  ["/a", "/"],
  ["", "."],
  ["/", "/"],
  ["////", "/"],
  ["//a", "/"],
  ["foo", "."],
];

const WIN32_TESTSUITE = [
  ["c:\\", "c:\\"],
  ["c:\\foo", "c:\\"],
  ["c:\\foo\\", "c:\\"],
  ["c:\\foo\\bar", "c:\\foo"],
  ["c:\\foo\\bar\\", "c:\\foo"],
  ["c:\\foo\\bar\\baz", "c:\\foo\\bar"],
  ["\\", "\\"],
  ["\\foo", "\\"],
  ["\\foo\\", "\\"],
  ["\\foo\\bar", "\\foo"],
  ["\\foo\\bar\\", "\\foo"],
  ["\\foo\\bar\\baz", "\\foo\\bar"],
  ["c:", "c:"],
  ["c:foo", "c:"],
  ["c:foo\\", "c:"],
  ["c:foo\\bar", "c:foo"],
  ["c:foo\\bar\\", "c:foo"],
  ["c:foo\\bar\\baz", "c:foo\\bar"],
  ["file:stream", "."],
  ["dir\\file:stream", "dir"],
  ["\\\\unc\\share", "\\\\unc\\share"],
  ["\\\\unc\\share\\foo", "\\\\unc\\share\\"],
  ["\\\\unc\\share\\foo\\", "\\\\unc\\share\\"],
  ["\\\\unc\\share\\foo\\bar", "\\\\unc\\share\\foo"],
  ["\\\\unc\\share\\foo\\bar\\", "\\\\unc\\share\\foo"],
  ["\\\\unc\\share\\foo\\bar\\baz", "\\\\unc\\share\\foo\\bar"],
  ["/a/b/", "/a"],
  ["/a/b", "/a"],
  ["/a", "/"],
  ["", "."],
  ["/", "/"],
  ["////", "/"],
  ["foo", "."],
];

Deno.test("[path] dirname", () => {
  for (const [name, expected] of COREUTILS_TESTSUITE) {
    assertEquals(dirname(name), expected);
  }
});

Deno.test("[path] dirname - posix", () => {
  for (const [name, expected] of POSIX_TESTSUITE) {
    assertEquals(posix.dirname(name), expected);
    assertEquals(dirname(name, { os: "linux" }), expected);
  }

  // POSIX treats backslash as any other character.
  assertEquals(posix.dirname("\\foo/bar"), "\\foo");
  assertEquals(posix.dirname("\\/foo/bar"), "\\/foo");
  assertEquals(posix.dirname("/foo/bar\\baz/qux"), "/foo/bar\\baz");
  assertEquals(posix.dirname("/foo/bar/baz\\"), "/foo/bar");
  assertEquals(dirname("\\foo/bar", { os: "linux" }), "\\foo");
  assertEquals(dirname("\\/foo/bar", { os: "linux" }), "\\/foo");
  assertEquals(dirname("/foo/bar\\baz/qux", { os: "linux" }), "/foo/bar\\baz");
  assertEquals(dirname("/foo/bar/baz\\", { os: "linux" }), "/foo/bar");
});

Deno.test("[path] dirname - windows", () => {
  for (const [name, expected] of WIN32_TESTSUITE) {
    assertEquals(win32.dirname(name), expected);
    assertEquals(dirname(name, { os: "windows" }), expected);
  }

  // path.win32 should pass all "forward slash" posix tests as well.
  for (const [name, expected] of COREUTILS_TESTSUITE) {
    assertEquals(win32.dirname(name), expected);
    assertEquals(dirname(name, { os: "windows" }), expected);
  }

  for (const [name, expected] of POSIX_TESTSUITE) {
    assertEquals(win32.dirname(name), expected);
    assertEquals(dirname(name, { os: "windows" }), expected);
  }
});
