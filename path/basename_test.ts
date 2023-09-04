// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "../assert/mod.ts";
import { basename, posix, win32 } from "./mod.ts";

// Test suite from "GNU core utilities"
// https://github.com/coreutils/coreutils/blob/master/tests/misc/basename.pl
const COREUTILS_TESTSUITE = [
  [["d/f"], "f"],
  [["/d/f"], "f"],
  [["d/f/"], "f"],
  [["d/f//"], "f"],
  [["f"], "f"],
  [["/"], "/"],
  [["///"], "/"],
  [["///a///"], "a"],
  [[""], ""],
  [["aa", "a"], "a"],
  [["a-a", "-a"], "a"],
  [["f.s", ".s"], "f"],
  [["fs", "s"], "f"],
  [["fs", "fs"], "fs"],
  [["fs/", "s"], "f"],
  [["dir/file.suf", ".suf"], "file"],
  [["fs", "x"], "fs"],
  [["fs", ""], "fs"],
  [["fs/", "s/"], "fs"],
];

const POSIX_TESTSUITE = [
  [[""], ""],
  [["/dir/basename.ext"], "basename.ext"],
  [["/basename.ext"], "basename.ext"],
  [["basename.ext"], "basename.ext"],
  [["basename.ext/"], "basename.ext"],
  [["basename.ext//"], "basename.ext"],
  [["aaa/bbb", "/bbb"], "bbb"],
  [["aaa/bbb", "a/bbb"], "bbb"],
  [["aaa/bbb", "bbb"], "bbb"],
  [["aaa/bbb//", "bbb"], "bbb"],
  [["aaa/bbb", "bb"], "b"],
  [["aaa/bbb", "b"], "bb"],
  [["/aaa/bbb", "/bbb"], "bbb"],
  [["/aaa/bbb", "a/bbb"], "bbb"],
  [["/aaa/bbb", "bbb"], "bbb"],
  [["/aaa/bbb//", "bbb"], "bbb"],
  [["/aaa/bbb//", "a/bbb"], "bbb"],
  [["/aaa/bbb", "bb"], "b"],
  [["/aaa/bbb", "b"], "bb"],
  [["/aaa/bbb"], "bbb"],
  [["/aaa/"], "aaa"],
  [["/aaa/b"], "b"],
  [["/a/b"], "b"],
  [["//a"], "a"],
  [["///"], "/"],
  [["///", "bbb"], "/"],
  [["//", "bbb"], "/"],
];

const WIN32_TESTSUITE = [
  [["\\dir\\basename.ext"], "basename.ext"],
  [["\\basename.ext"], "basename.ext"],
  [["basename.ext"], "basename.ext"],
  [["basename.ext\\"], "basename.ext"],
  [["basename.ext\\\\"], "basename.ext"],
  [["foo"], "foo"],
  [["aaa\\bbb", "\\bbb"], "bbb"],
  [["aaa\\bbb", "a\\bbb"], "bbb"],
  [["aaa\\bbb", "bbb"], "bbb"],
  [["aaa\\bbb\\\\\\\\", "bbb"], "bbb"],
  [["aaa\\bbb", "bb"], "b"],
  [["aaa\\bbb", "b"], "bb"],
  [["/aaa/bbb", "bb"], "b"],
  [["C:"], ""],
  [["C:."], "."],
  [["C:\\"], "\\"],
  [["C:\\dir\\base.ext"], "base.ext"],
  [["C:\\basename.ext"], "basename.ext"],
  [["C:basename.ext"], "basename.ext"],
  [["C:basename.ext\\"], "basename.ext"],
  [["C:basename.ext\\\\"], "basename.ext"],
  [["C:foo"], "foo"],
  [["file:stream"], "file:stream"],
];

Deno.test("[path] basename", () => {
  for (const [[name, suffix], expected] of COREUTILS_TESTSUITE) {
    assertEquals(basename(name, suffix), expected);
  }
});

Deno.test("[path] basename - posix", () => {
  for (const [[name, suffix], expected] of POSIX_TESTSUITE) {
    assertEquals(posix.basename(name, suffix), expected);
    assertEquals(basename(name, suffix, { os: "linux" }), expected);
  }

  // On unix a backslash is just treated as any other character.
  assertEquals(
    posix.basename("\\dir\\basename.ext"),
    "\\dir\\basename.ext",
  );
  assertEquals(posix.basename("\\basename.ext"), "\\basename.ext");
  assertEquals(posix.basename("basename.ext"), "basename.ext");
  assertEquals(posix.basename("basename.ext\\"), "basename.ext\\");
  assertEquals(posix.basename("basename.ext\\\\"), "basename.ext\\\\");
  assertEquals(posix.basename("foo"), "foo");
  assertEquals(
    basename("\\dir\\basename.ext", "", { os: "linux" }),
    "\\dir\\basename.ext",
  );
  assertEquals(
    basename("\\basename.ext", "", { os: "linux" }),
    "\\basename.ext",
  );
  assertEquals(basename("basename.ext", "", { os: "linux" }), "basename.ext");
  assertEquals(
    basename("basename.ext\\", "", { os: "linux" }),
    "basename.ext\\",
  );
  assertEquals(
    basename("basename.ext\\\\", "", { os: "linux" }),
    "basename.ext\\\\",
  );
  assertEquals(basename("foo", "", { os: "linux" }), "foo");

  // POSIX filenames may include control characters
  const controlCharFilename = "Icon" + String.fromCharCode(13);
  assertEquals(
    posix.basename("/a/b/" + controlCharFilename),
    controlCharFilename,
  );
  assertEquals(
    basename("/a/b/" + controlCharFilename, "", { os: "linux" }),
    controlCharFilename,
  );
});

Deno.test("[path] basename - windows", () => {
  for (const [[name, suffix], expected] of WIN32_TESTSUITE) {
    assertEquals(win32.basename(name, suffix), expected);
    assertEquals(basename(name, suffix, { os: "windows" }), expected);
  }

  // path.win32 should pass all "forward slash" posix tests as well.
  for (const [[name, suffix], expected] of COREUTILS_TESTSUITE) {
    assertEquals(win32.basename(name, suffix), expected);
    assertEquals(basename(name, suffix, { os: "windows" }), expected);
  }

  for (const [[name, suffix], expected] of POSIX_TESTSUITE) {
    assertEquals(win32.basename(name, suffix), expected);
    assertEquals(basename(name, suffix, { os: "windows" }), expected);
  }
});
