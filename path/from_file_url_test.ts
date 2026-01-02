// Copyright 2018-2026 the Deno authors. MIT license.
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";
import { assertEquals, assertThrows } from "@std/assert";

Deno.test("posix.fromFileUrl()", function () {
  assertEquals(posix.fromFileUrl(new URL("file:///home/foo")), "/home/foo");
  assertEquals(posix.fromFileUrl("file:///"), "/");
  assertEquals(posix.fromFileUrl("file:///home/foo"), "/home/foo");
  assertEquals(posix.fromFileUrl("file:///home/foo%20bar"), "/home/foo bar");
  assertEquals(posix.fromFileUrl("file:///%"), "/%");
  assertEquals(posix.fromFileUrl("file://localhost/foo"), "/foo");
  assertEquals(posix.fromFileUrl("file:///C:"), "/C:");
  assertEquals(posix.fromFileUrl("file:///C:/"), "/C:/");
  assertEquals(posix.fromFileUrl("file:///C:/Users/"), "/C:/Users/");
  assertEquals(posix.fromFileUrl("file:///C:foo/bar"), "/C:foo/bar");
  assertThrows(
    () => posix.fromFileUrl("http://localhost/foo"),
    TypeError,
    'URL must be a file URL: received "http:"',
  );
  assertThrows(
    () => posix.fromFileUrl("abcd://localhost/foo"),
    TypeError,
    'URL must be a file URL: received "abcd:"',
  );
});

Deno.test("windows.fromFileUrl()", function () {
  assertEquals(windows.fromFileUrl(new URL("file:///home/foo")), "\\home\\foo");
  assertEquals(windows.fromFileUrl("file:///"), "\\");
  assertEquals(windows.fromFileUrl("file:///home/foo"), "\\home\\foo");
  assertEquals(
    windows.fromFileUrl("file:///home/foo%20bar"),
    "\\home\\foo bar",
  );
  assertEquals(windows.fromFileUrl("file:///%"), "\\%");
  assertEquals(
    windows.fromFileUrl("file://127.0.0.1/foo"),
    "\\\\127.0.0.1\\foo",
  );
  assertEquals(windows.fromFileUrl("file://localhost/foo"), "\\foo");
  assertEquals(windows.fromFileUrl("file:///C:"), "C:\\");
  assertEquals(windows.fromFileUrl("file:///C:/"), "C:\\");
  // Drop the hostname if a drive letter is parsed.
  assertEquals(windows.fromFileUrl("file://localhost/C:/"), "C:\\");
  assertEquals(windows.fromFileUrl("file:///C:/Users/"), "C:\\Users\\");
  assertEquals(windows.fromFileUrl("file:///C:foo/bar"), "\\C:foo\\bar");
  assertThrows(
    () => windows.fromFileUrl("http://localhost/foo"),
    TypeError,
    'URL must be a file URL: received "http:"',
  );
  assertThrows(
    () => windows.fromFileUrl("abcd://localhost/foo"),
    TypeError,
    'URL must be a file URL: received "abcd:"',
  );
});
