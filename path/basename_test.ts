// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals } from "../assert/mod.ts";
import { basename } from "./basename.ts";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";

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
] as const;

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
] as const;

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
] as const;

Deno.test("posix.basename()", function () {
  for (const [[name, suffix], expected] of COREUTILS_TESTSUITE) {
    assertEquals(basename(name, suffix), expected);
  }

  for (const [[name, suffix], expected] of POSIX_TESTSUITE) {
    assertEquals(posix.basename(name, suffix), expected);
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

  // POSIX filenames may include control characters
  const controlCharFilename = "Icon" + String.fromCharCode(13);
  assertEquals(
    posix.basename("/a/b/" + controlCharFilename),
    controlCharFilename,
  );
});

Deno.test("windows.basename()", function () {
  for (const [[name, suffix], expected] of WIN32_TESTSUITE) {
    assertEquals(windows.basename(name, suffix), expected);
  }

  // windows should pass all "forward slash" posix tests as well.
  for (const [[name, suffix], expected] of COREUTILS_TESTSUITE) {
    assertEquals(windows.basename(name, suffix), expected);
  }

  for (const [[name, suffix], expected] of POSIX_TESTSUITE) {
    assertEquals(windows.basename(name, suffix), expected);
  }
});
