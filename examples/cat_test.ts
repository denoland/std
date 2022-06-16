// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertStrictEquals } from "../testing/asserts.ts";
import { dirname, fromFileURL } from "../path/mod.ts";

const moduleDir = dirname(fromFileURL(import.meta.url));

Deno.test("[examples/cat] print multiple files", async () => {
  const decoder = new TextDecoder();
  const { stdout } = await Deno.spawn(Deno.execPath(), {
    args: [
      "run",
      "--quiet",
      "--allow-read",
      "cat.ts",
      "testdata/cat/hello.txt",
      "testdata/cat/world.txt",
    ],
    cwd: moduleDir,
    stdout: "piped",
  });

  try {
    const actual = decoder.decode(stdout).trim();
    assertStrictEquals(actual, "Hello\nWorld");
  } finally {
    //
  }
});
