// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { fromFileUrl } from "./from_file_url.ts";
import { assertEquals, assertThrows } from "../testing/asserts.ts";

Deno.test("[path] fromFileUrl", function () {
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

Deno.test("[path] fromFileUrl (win32)", function () {
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
