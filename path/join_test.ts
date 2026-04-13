// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";
import { join } from "./join.ts";

const backslashRE = /\\/g;

type TestCase = [string[], string];
type UrlTestCase = [[URL, ...string[]], string];

const joinTests: TestCase[] =
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

const joinUrlTests: UrlTestCase[] = [
  // URLs
  [[new URL("file:///"), "x/b", "..", "/b/c.js"], "/x/b/c.js"],
  [[new URL("file:///foo"), "../../../bar"], "/bar"],
  [
    [new URL("file:///foo"), "bar", "baz/asdf", "quux", ".."],
    "/foo/bar/baz/asdf",
  ],
];

// Windows-specific join tests
const windowsJoinTests: TestCase[] = [
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
const windowsJoinUrlTests: UrlTestCase[] = [
  // URLs
  [[new URL("file:///c:")], "c:\\"],
  [[new URL("file:///c:"), "file"], "c:\\file"],
  [[new URL("file:///c:/"), "file"], "c:\\file"],
];

Deno.test("posix.join()", function () {
  joinTests.forEach(function (p) {
    const _p = p[0];
    const actual = posix.join.apply(null, _p);
    assertEquals(actual, p[1]);
  });

  joinUrlTests.forEach(function (p) {
    const _p = p[0];
    const actual = posix.join.apply(null, _p);
    assertEquals(actual, p[1]);
  });
});

Deno.test("windows.join()", function () {
  joinTests.forEach(function (p) {
    const _p = p[0];
    const actual = windows.join.apply(null, _p).replace(backslashRE, "/");
    assertEquals(actual, p[1]);
  });
  windowsJoinTests.forEach(function (p) {
    const _p = p[0];
    const actual = windows.join.apply(null, _p);
    assertEquals(actual, p[1]);
  });

  joinUrlTests.forEach(function (p) {
    const _p = p[0];
    const actual = windows.join.apply(null, _p).replace(
      backslashRE,
      "/",
    );
    assertEquals(actual, p[1]);
  });
  windowsJoinUrlTests.forEach(function (p) {
    const _p = p[0];
    const actual = windows.join.apply(null, _p);
    assertEquals(actual, p[1]);
  });
});

Deno.test(`join() returns "." if input is empty`, function () {
  assertEquals(join(""), ".");
  assertEquals(join("", ""), ".");

  const pwd = Deno.cwd();
  assertEquals(join(pwd), pwd);
  assertEquals(join(pwd, ""), pwd);
});
