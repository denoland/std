// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertStrictEquals } from "../testing/asserts.ts";
import { dirname, fromFileUrl } from "../path/mod.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));

Deno.test("[examples/welcome] print a welcome message", async () => {
  const decoder = new TextDecoder();
  const { stdout } = await Deno.spawn(Deno.execPath(), {
    args: ["run", "--quiet", "welcome.ts"],
    cwd: moduleDir,
    stdout: "piped",
  });
  try {
    const actual = decoder.decode(stdout).trim();
    const expected = "Welcome to Deno!";
    assertStrictEquals(actual, expected);
  } finally {
    //
  }
});
