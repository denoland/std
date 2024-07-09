// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";
import { assertEquals, assertThrows } from "@std/assert";

Deno.test("posix.toFileUrl()", function () {
  assertEquals(posix.toFileUrl("/home/foo").href, "file:///home/foo");
  assertEquals(posix.toFileUrl("/home/ ").href, "file:///home/%20");
  assertEquals(posix.toFileUrl("/home/%20").href, "file:///home/%2520");
  assertEquals(posix.toFileUrl("/home\\foo").href, "file:///home%5Cfoo");
  assertThrows(
    () => posix.toFileUrl("foo").href,
    TypeError,
    "Must be an absolute path.",
  );
  assertThrows(
    () => posix.toFileUrl("C:/"),
    TypeError,
    "Must be an absolute path.",
  );
  assertEquals(
    posix.toFileUrl("//localhost/home/foo").href,
    "file:///localhost/home/foo",
  );
  assertEquals(posix.toFileUrl("//localhost/").href, "file:///localhost/");
  assertEquals(posix.toFileUrl("//:/home/foo").href, "file:///:/home/foo");
});

Deno.test("windows.toFileUrl()", function () {
  assertEquals(windows.toFileUrl("/home/foo").href, "file:///home/foo");
  assertEquals(windows.toFileUrl("/home/ ").href, "file:///home/%20");
  assertEquals(windows.toFileUrl("/home/%20").href, "file:///home/%2520");
  assertEquals(windows.toFileUrl("/home\\foo").href, "file:///home/foo");
  assertThrows(
    () => windows.toFileUrl("foo").href,
    TypeError,
    "Must be an absolute path.",
  );
  assertEquals(windows.toFileUrl("C:/").href, "file:///C:/");
  assertEquals(
    windows.toFileUrl("//localhost/home/foo").href,
    "file:///home/foo",
  );
  assertEquals(
    windows.toFileUrl("//127.0.0.1/home/foo").href,
    "file://127.0.0.1/home/foo",
  );
  assertEquals(windows.toFileUrl("//localhost/").href, "file:///");
  assertEquals(windows.toFileUrl("//127.0.0.1/").href, "file://127.0.0.1/");
  assertThrows(
    () => windows.toFileUrl("//:/home/foo").href,
    TypeError,
    "Invalid hostname.",
  );
});
