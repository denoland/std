// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { toFileUrl } from "./to_file_url.ts";
import { assertEquals, assertThrows } from "../testing/asserts.ts";

Deno.test("[path] toFileUrl", function () {
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

Deno.test("[path] toFileUrl (win32)", function () {
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
