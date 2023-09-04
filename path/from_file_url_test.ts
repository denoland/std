// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { fromFileUrl, posix, win32 } from "./mod.ts";
import { assertEquals, assertThrows } from "../assert/mod.ts";

Deno.test("[path] fromFileUrl - posix", () => {
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
    "Must be a file URL.",
  );
  assertThrows(
    () => posix.fromFileUrl("abcd://localhost/foo"),
    TypeError,
    "Must be a file URL.",
  );

  assertEquals(
    fromFileUrl(new URL("file:///home/foo"), { os: "linux" }),
    "/home/foo",
  );
  assertEquals(fromFileUrl("file:///", { os: "linux" }), "/");
  assertEquals(fromFileUrl("file:///home/foo", { os: "linux" }), "/home/foo");
  assertEquals(
    fromFileUrl("file:///home/foo%20bar", { os: "linux" }),
    "/home/foo bar",
  );
  assertEquals(fromFileUrl("file:///%", { os: "linux" }), "/%");
  assertEquals(fromFileUrl("file://localhost/foo", { os: "linux" }), "/foo");
  assertEquals(fromFileUrl("file:///C:", { os: "linux" }), "/C:");
  assertEquals(fromFileUrl("file:///C:/", { os: "linux" }), "/C:/");
  assertEquals(fromFileUrl("file:///C:/Users/", { os: "linux" }), "/C:/Users/");
  assertEquals(fromFileUrl("file:///C:foo/bar", { os: "linux" }), "/C:foo/bar");
  assertThrows(
    () => fromFileUrl("http://localhost/foo", { os: "linux" }),
    TypeError,
    "Must be a file URL.",
  );
  assertThrows(
    () => fromFileUrl("abcd://localhost/foo", { os: "linux" }),
    TypeError,
    "Must be a file URL.",
  );
});

Deno.test("[path] fromFileUrl - windows", () => {
  assertEquals(win32.fromFileUrl(new URL("file:///home/foo")), "\\home\\foo");
  assertEquals(win32.fromFileUrl("file:///"), "\\");
  assertEquals(win32.fromFileUrl("file:///home/foo"), "\\home\\foo");
  assertEquals(win32.fromFileUrl("file:///home/foo%20bar"), "\\home\\foo bar");
  assertEquals(win32.fromFileUrl("file:///%"), "\\%");
  assertEquals(win32.fromFileUrl("file://127.0.0.1/foo"), "\\\\127.0.0.1\\foo");
  assertEquals(win32.fromFileUrl("file://localhost/foo"), "\\foo");
  assertEquals(win32.fromFileUrl("file:///C:"), "C:\\");
  assertEquals(win32.fromFileUrl("file:///C:/"), "C:\\");
  // Drop the hostname if a drive letter is parsed.
  assertEquals(win32.fromFileUrl("file://localhost/C:/"), "C:\\");
  assertEquals(win32.fromFileUrl("file:///C:/Users/"), "C:\\Users\\");
  assertEquals(win32.fromFileUrl("file:///C:foo/bar"), "\\C:foo\\bar");
  assertThrows(
    () => win32.fromFileUrl("http://localhost/foo"),
    TypeError,
    "Must be a file URL.",
  );
  assertThrows(
    () => win32.fromFileUrl("abcd://localhost/foo"),
    TypeError,
    "Must be a file URL.",
  );

  assertEquals(
    fromFileUrl(new URL("file:///home/foo"), { os: "windows" }),
    "\\home\\foo",
  );
  assertEquals(fromFileUrl("file:///", { os: "windows" }), "\\");
  assertEquals(
    fromFileUrl("file:///home/foo", { os: "windows" }),
    "\\home\\foo",
  );
  assertEquals(
    fromFileUrl("file:///home/foo%20bar", { os: "windows" }),
    "\\home\\foo bar",
  );
  assertEquals(fromFileUrl("file:///%", { os: "windows" }), "\\%");
  assertEquals(
    fromFileUrl("file://127.0.0.1/foo", { os: "windows" }),
    "\\\\127.0.0.1\\foo",
  );
  assertEquals(fromFileUrl("file://localhost/foo", { os: "windows" }), "\\foo");
  assertEquals(fromFileUrl("file:///C:", { os: "windows" }), "C:\\");
  assertEquals(fromFileUrl("file:///C:/", { os: "windows" }), "C:\\");
  // Drop the hostname if a drive letter is parsed.
  assertEquals(fromFileUrl("file://localhost/C:/", { os: "windows" }), "C:\\");
  assertEquals(
    fromFileUrl("file:///C:/Users/", { os: "windows" }),
    "C:\\Users\\",
  );
  assertEquals(
    fromFileUrl("file:///C:foo/bar", { os: "windows" }),
    "\\C:foo\\bar",
  );
  assertThrows(
    () => fromFileUrl("http://localhost/foo", { os: "windows" }),
    TypeError,
    "Must be a file URL.",
  );
  assertThrows(
    () => fromFileUrl("abcd://localhost/foo", { os: "windows" }),
    TypeError,
    "Must be a file URL.",
  );
});
