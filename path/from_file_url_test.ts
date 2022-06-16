// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { posix, win32 } from "./mod.ts";
import { assertEquals, assertThrows } from "../testing/asserts.ts";

Deno.test("[path] fromFileURL", function () {
  assertEquals(posix.fromFileURL(new URL("file:///home/foo")), "/home/foo");
  assertEquals(posix.fromFileURL("file:///"), "/");
  assertEquals(posix.fromFileURL("file:///home/foo"), "/home/foo");
  assertEquals(posix.fromFileURL("file:///home/foo%20bar"), "/home/foo bar");
  assertEquals(posix.fromFileURL("file:///%"), "/%");
  assertEquals(posix.fromFileURL("file://localhost/foo"), "/foo");
  assertEquals(posix.fromFileURL("file:///C:"), "/C:");
  assertEquals(posix.fromFileURL("file:///C:/"), "/C:/");
  assertEquals(posix.fromFileURL("file:///C:/Users/"), "/C:/Users/");
  assertEquals(posix.fromFileURL("file:///C:foo/bar"), "/C:foo/bar");
  assertThrows(
    () => posix.fromFileURL("http://localhost/foo"),
    TypeError,
    "Must be a file URL.",
  );
  assertThrows(
    () => posix.fromFileURL("abcd://localhost/foo"),
    TypeError,
    "Must be a file URL.",
  );
});

Deno.test("[path] fromFileURL (win32)", function () {
  assertEquals(win32.fromFileURL(new URL("file:///home/foo")), "\\home\\foo");
  assertEquals(win32.fromFileURL("file:///"), "\\");
  assertEquals(win32.fromFileURL("file:///home/foo"), "\\home\\foo");
  assertEquals(win32.fromFileURL("file:///home/foo%20bar"), "\\home\\foo bar");
  assertEquals(win32.fromFileURL("file:///%"), "\\%");
  assertEquals(win32.fromFileURL("file://127.0.0.1/foo"), "\\\\127.0.0.1\\foo");
  assertEquals(win32.fromFileURL("file://localhost/foo"), "\\foo");
  assertEquals(win32.fromFileURL("file:///C:"), "C:\\");
  assertEquals(win32.fromFileURL("file:///C:/"), "C:\\");
  // Drop the hostname if a drive letter is parsed.
  assertEquals(win32.fromFileURL("file://localhost/C:/"), "C:\\");
  assertEquals(win32.fromFileURL("file:///C:/Users/"), "C:\\Users\\");
  assertEquals(win32.fromFileURL("file:///C:foo/bar"), "\\C:foo\\bar");
  assertThrows(
    () => win32.fromFileURL("http://localhost/foo"),
    TypeError,
    "Must be a file URL.",
  );
  assertThrows(
    () => win32.fromFileURL("abcd://localhost/foo"),
    TypeError,
    "Must be a file URL.",
  );
});
