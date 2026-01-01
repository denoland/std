// Copyright 2018-2026 the Deno authors. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals, assertThrows } from "@std/assert";
import { dirname } from "./dirname.ts";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";

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
] as const;

const POSIX_TESTSUITE = [
  ["/a/b/", "/a"],
  ["/a/b", "/a"],
  ["/a", "/"],
  ["", "."],
  ["/", "/"],
  ["////", "/"],
  ["//a", "/"],
  ["foo", "."],
] as const;

const WINDOWS_TESTSUITE = [
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
] as const;

Deno.test("posix.dirname()", function () {
  for (const [name, expected] of COREUTILS_TESTSUITE) {
    assertEquals(dirname(name), expected);
  }

  for (const [name, expected] of POSIX_TESTSUITE) {
    assertEquals(posix.dirname(name), expected);
  }

  // POSIX treats backslash as any other character.
  assertEquals(posix.dirname("\\foo/bar"), "\\foo");
  assertEquals(posix.dirname("\\/foo/bar"), "\\/foo");
  assertEquals(posix.dirname("/foo/bar\\baz/qux"), "/foo/bar\\baz");
  assertEquals(posix.dirname("/foo/bar/baz\\"), "/foo/bar");
});

Deno.test("posix.dirname() works with file URLs", () => {
  assertEquals(
    posix.dirname(new URL("file:///home/user/Documents/image.png")),
    "/home/user/Documents",
  );

  // throws with non-file URLs
  assertThrows(
    () => posix.dirname(new URL("https://deno.land/")),
    TypeError,
    'URL must be a file URL: received "https:"',
  );
});

Deno.test("windows.dirname()", function () {
  for (const [name, expected] of WINDOWS_TESTSUITE) {
    assertEquals(windows.dirname(name), expected);
  }

  // windows should pass all "forward slash" posix tests as well.
  for (const [name, expected] of COREUTILS_TESTSUITE) {
    assertEquals(windows.dirname(name), expected);
  }

  for (const [name, expected] of POSIX_TESTSUITE) {
    assertEquals(windows.dirname(name), expected);
  }
});

Deno.test("windows.dirname() works with file URLs", () => {
  assertEquals(
    windows.dirname(new URL("file:///C:/home/user/Documents/image.png")),
    "C:\\home\\user\\Documents",
  );

  // throws with non-file URLs
  assertThrows(
    () => windows.dirname(new URL("https://deno.land/")),
    TypeError,
    'URL must be a file URL: received "https:"',
  );
});
