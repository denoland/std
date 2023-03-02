// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertStrictEquals } from "../testing/asserts.ts";
import { dirname, fromFileUrl } from "../path/mod.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));

Deno.test("[examples/cat] print multiple files", async () => {
  const decoder = new TextDecoder();
  const command = new Deno.Command(Deno.execPath(), {
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
  const { stdout } = await command.output();

  try {
    const actual = decoder.decode(stdout).trim();
    assertStrictEquals(actual, "Hello\nWorld");
  } finally {
    //
  }
});
