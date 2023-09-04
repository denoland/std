// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { join, posix, win32 } from "./mod.ts";

const backslashRE = /\\/g;

const joinTests =
  // arguments                     result
  [
    [[".", "x/b", "..", "/b/c.js"], "x/b/c.js"],
    [[], "."],
    [["/.", "x/b", "..", "/b/c.js"], "/x/b/c.js"],
    [["/foo", "../../../bar"], "/bar"],
    [["foo", "../../../bar"], "../../bar"],
    [["foo/", "../../../bar"], "../../bar"],
    [["foo/x", "../../../bar"], "../bar"],
    [["foo/x", "./bar"], "foo/x/bar"],
    [["foo/x/", "./bar"], "foo/x/bar"],
    [["foo/x/", ".", "bar"], "foo/x/bar"],
    [["./"], "./"],
    [[".", "./"], "./"],
    [[".", ".", "."], "."],
    [[".", "./", "."], "."],
    [[".", "/./", "."], "."],
    [[".", "/////./", "."], "."],
    [["."], "."],
    [["", "."], "."],
    [["", "foo"], "foo"],
    [["foo", "/bar"], "foo/bar"],
    [["", "/foo"], "/foo"],
    [["", "", "/foo"], "/foo"],
    [["", "", "foo"], "foo"],
    [["foo", ""], "foo"],
    [["foo/", ""], "foo/"],
    [["foo", "", "/bar"], "foo/bar"],
    [["./", "..", "/foo"], "../foo"],
    [["./", "..", "..", "/foo"], "../../foo"],
    [[".", "..", "..", "/foo"], "../../foo"],
    [["", "..", "..", "/foo"], "../../foo"],
    [["/"], "/"],
    [["/", "."], "/"],
    [["/", ".."], "/"],
    [["/", "..", ".."], "/"],
    [[""], "."],
    [["", ""], "."],
    [[" /foo"], " /foo"],
    [[" ", "foo"], " /foo"],
    [[" ", "."], " "],
    [[" ", "/"], " /"],
    [[" ", ""], " "],
    [["/", "foo"], "/foo"],
    [["/", "/foo"], "/foo"],
    [["/", "//foo"], "/foo"],
    [["/", "", "/foo"], "/foo"],
    [["", "/", "foo"], "/foo"],
    [["", "/", "/foo"], "/foo"],
  ];

// Windows-specific join tests
const windowsJoinTests = [
  // arguments                     result
  // UNC path expected
  [["//foo/bar"], "\\\\foo\\bar\\"],
  [["\\/foo/bar"], "\\\\foo\\bar\\"],
  [["\\\\foo/bar"], "\\\\foo\\bar\\"],
  // UNC path expected - server and share separate
  [["//foo", "bar"], "\\\\foo\\bar\\"],
  [["//foo/", "bar"], "\\\\foo\\bar\\"],
  [["//foo", "/bar"], "\\\\foo\\bar\\"],
  // UNC path expected - questionable
  [["//foo", "", "bar"], "\\\\foo\\bar\\"],
  [["//foo/", "", "bar"], "\\\\foo\\bar\\"],
  [["//foo/", "", "/bar"], "\\\\foo\\bar\\"],
  // UNC path expected - even more questionable
  [["", "//foo", "bar"], "\\\\foo\\bar\\"],
  [["", "//foo/", "bar"], "\\\\foo\\bar\\"],
  [["", "//foo/", "/bar"], "\\\\foo\\bar\\"],
  // No UNC path expected (no double slash in first component)
  [["\\", "foo/bar"], "\\foo\\bar"],
  [["\\", "/foo/bar"], "\\foo\\bar"],
  [["", "/", "/foo/bar"], "\\foo\\bar"],
  // No UNC path expected (no non-slashes in first component -
  // questionable)
  [["//", "foo/bar"], "\\foo\\bar"],
  [["//", "/foo/bar"], "\\foo\\bar"],
  [["\\\\", "/", "/foo/bar"], "\\foo\\bar"],
  [["//"], "\\"],
  // No UNC path expected (share name missing - questionable).
  [["//foo"], "\\foo"],
  [["//foo/"], "\\foo\\"],
  [["//foo", "/"], "\\foo\\"],
  [["//foo", "", "/"], "\\foo\\"],
  // No UNC path expected (too many leading slashes - questionable)
  [["///foo/bar"], "\\foo\\bar"],
  [["////foo", "bar"], "\\foo\\bar"],
  [["\\\\\\/foo/bar"], "\\foo\\bar"],
  // Drive-relative vs drive-absolute paths. This merely describes the
  // status quo, rather than being obviously right
  [["c:"], "c:."],
  [["c:."], "c:."],
  [["c:", ""], "c:."],
  [["", "c:"], "c:."],
  [["c:.", "/"], "c:.\\"],
  [["c:.", "file"], "c:file"],
  [["c:", "/"], "c:\\"],
  [["c:", "file"], "c:\\file"],
];

Deno.test("[path] join - posix", () => {
  joinTests.forEach(function (p) {
    const _p = p[0] as string[];
    assertEquals(posix.join(..._p), p[1]);
    assertEquals(join(..._p, { os: "linux" }), p[1]);
  });
});

Deno.test("[path] join - windows", () => {
  joinTests.forEach(function (p) {
    const _p = p[0] as string[];
    assertEquals(win32.join(..._p).replace(backslashRE, "/"), p[1]);
    assertEquals(
      join(..._p, { os: "windows" }).replace(backslashRE, "/"),
      p[1],
    );
  });
  windowsJoinTests.forEach(function (p) {
    const _p = p[0] as string[];
    assertEquals(win32.join(..._p), p[1]);
    assertEquals(join(..._p, { os: "windows" }), p[1]);
  });
});
