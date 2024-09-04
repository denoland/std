// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { assertEquals, assertThrows } from "@std/assert";
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
  [[new URL("file:///dir/basename.ext")], "basename.ext"],
  [[new URL("file:///basename.ext"), ".ext"], "basename"],
  [[new URL("file:///dir/basename.ext")], "basename.ext"],
  [[new URL("file:///aaa/bbb/")], "bbb"],
  [[new URL("file:///aaa/bbb"), "b"], "bb"],
  [[new URL("file:///aaa/bbb"), "bb"], "b"],
  [[new URL("file:///aaa/bbb"), "bbb"], "bbb"],
  [[new URL("file:///aaa/bbb"), "a/bbb"], "bbb"],
  [[new URL("file://///a")], "a"],
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
  [[new URL("file:///")], "\\"],
  [[new URL("file:///C:/")], "\\"],
  [[new URL("file:///C:/aaa")], "aaa"],
  [[new URL("file://///")], "\\"],
] as const;

Deno.test("posix.basename()", function () {
  for (const [[name, suffix], expected] of COREUTILS_TESTSUITE) {
    assertEquals(basename(name, suffix), expected);
  }

  for (const [[name, suffix], expected] of POSIX_TESTSUITE) {
    // deno-lint-ignore no-explicit-any
    assertEquals(posix.basename(name as any, suffix), expected);
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

Deno.test("posix.basename() throws with non-file URL", () => {
  assertThrows(
    () => posix.basename(new URL("https://deno.land/")),
    TypeError,
    'URL must be a file URL: received "https:"',
  );
});

Deno.test("windows.basename()", function () {
  for (const [[name, suffix], expected] of WIN32_TESTSUITE) {
    // deno-lint-ignore no-explicit-any
    assertEquals(windows.basename(name as any, suffix), expected);
  }

  // windows should pass all "forward slash" posix tests as well.
  for (const [[name, suffix], expected] of COREUTILS_TESTSUITE) {
    // deno-lint-ignore no-explicit-any
    assertEquals(windows.basename(name as any, suffix), expected);
  }

  for (const [[name, suffix], expected] of POSIX_TESTSUITE) {
    // deno-lint-ignore no-explicit-any
    assertEquals(windows.basename(name as any, suffix), expected);
  }
});

Deno.test("windows.basename() throws with non-file URL", () => {
  assertThrows(
    () => windows.basename(new URL("https://deno.land/")),
    TypeError,
    'URL must be a file URL: received "https:"',
  );
});
