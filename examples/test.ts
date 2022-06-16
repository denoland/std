// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import { dirname, fromFileURL, relative, resolve } from "../path/mod.ts";

const moduleDir = dirname(fromFileURL(import.meta.url));

/** Example of how to do basic tests */
Deno.test("t1", function (): void {
  assertEquals("hello", "hello");
});

Deno.test("t2", function (): void {
  assertEquals("world", "world");
});

/** A more complicated test that runs a subprocess. */
Deno.test("catSmoke", async function () {
  const { status } = await Deno.spawn(Deno.execPath(), {
    args: [
      "run",
      "--quiet",
      "--allow-read",
      relative(Deno.cwd(), resolve(moduleDir, "cat.ts")),
      relative(Deno.cwd(), resolve(moduleDir, "..", "README.md")),
    ],
  });
  assertEquals(status.code, 0);
});
