// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { posix, toFileUrl, win32 } from "./mod.ts";
import { assertEquals, assertThrows } from "../assert/mod.ts";

Deno.test("[path] toFileUrl - posix", () => {
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

  assertEquals(
    toFileUrl("/home/foo", { os: "linux" }).href,
    "file:///home/foo",
  );
  assertEquals(toFileUrl("/home/ ", { os: "linux" }).href, "file:///home/%20");
  assertEquals(
    toFileUrl("/home/%20", { os: "linux" }).href,
    "file:///home/%2520",
  );
  assertEquals(
    toFileUrl("/home\\foo", { os: "linux" }).href,
    "file:///home%5Cfoo",
  );
  assertThrows(
    () => toFileUrl("foo", { os: "linux" }).href,
    TypeError,
    "Must be an absolute path.",
  );
  assertThrows(
    () => toFileUrl("C:/", { os: "linux" }),
    TypeError,
    "Must be an absolute path.",
  );
  assertEquals(
    toFileUrl("//localhost/home/foo", { os: "linux" }).href,
    "file:///localhost/home/foo",
  );
  assertEquals(
    toFileUrl("//localhost/", { os: "linux" }).href,
    "file:///localhost/",
  );
  assertEquals(
    toFileUrl("//:/home/foo", { os: "linux" }).href,
    "file:///:/home/foo",
  );
});

Deno.test("[path] toFileUrl - windows", () => {
  assertEquals(win32.toFileUrl("/home/foo").href, "file:///home/foo");
  assertEquals(win32.toFileUrl("/home/ ").href, "file:///home/%20");
  assertEquals(win32.toFileUrl("/home/%20").href, "file:///home/%2520");
  assertEquals(win32.toFileUrl("/home\\foo").href, "file:///home/foo");
  assertThrows(
    () => win32.toFileUrl("foo").href,
    TypeError,
    "Must be an absolute path.",
  );
  assertEquals(win32.toFileUrl("C:/").href, "file:///C:/");
  assertEquals(
    win32.toFileUrl("//localhost/home/foo").href,
    "file:///home/foo",
  );
  assertEquals(
    win32.toFileUrl("//127.0.0.1/home/foo").href,
    "file://127.0.0.1/home/foo",
  );
  assertEquals(win32.toFileUrl("//localhost/").href, "file:///");
  assertEquals(win32.toFileUrl("//127.0.0.1/").href, "file://127.0.0.1/");
  assertThrows(
    () => win32.toFileUrl("//:/home/foo").href,
    TypeError,
    "Invalid hostname.",
  );

  assertEquals(
    toFileUrl("/home/foo", { os: "windows" }).href,
    "file:///home/foo",
  );
  assertEquals(
    toFileUrl("/home/ ", { os: "windows" }).href,
    "file:///home/%20",
  );
  assertEquals(
    toFileUrl("/home/%20", { os: "windows" }).href,
    "file:///home/%2520",
  );
  assertEquals(
    toFileUrl("/home\\foo", { os: "windows" }).href,
    "file:///home/foo",
  );
  assertThrows(
    () => toFileUrl("foo", { os: "windows" }).href,
    TypeError,
    "Must be an absolute path.",
  );
  assertEquals(toFileUrl("C:/", { os: "windows" }).href, "file:///C:/");
  assertEquals(
    toFileUrl("//localhost/home/foo", { os: "windows" }).href,
    "file:///home/foo",
  );
  assertEquals(
    toFileUrl("//127.0.0.1/home/foo", { os: "windows" }).href,
    "file://127.0.0.1/home/foo",
  );
  assertEquals(toFileUrl("//localhost/", { os: "windows" }).href, "file:///");
  assertEquals(
    toFileUrl("//127.0.0.1/", { os: "windows" }).href,
    "file://127.0.0.1/",
  );
  assertThrows(
    () => toFileUrl("//:/home/foo", { os: "windows" }).href,
    TypeError,
    "Invalid hostname.",
  );
});
