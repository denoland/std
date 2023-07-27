// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertStrictEquals } from "../assert/mod.ts";
import { dirname, fromFileUrl } from "../path/mod.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));

Deno.test({
  name: "[examples/curl] send a request to a specified url",
  fn: async () => {
    const abortController = new AbortController();
    const serverPromise = Deno.serve(
      { signal: abortController.signal, port: 8081 },
      () => new Response("Hello world"),
    ).finished;
    const decoder = new TextDecoder();
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--quiet",
        "--allow-net",
        "curl.ts",
        "http://localhost:8081",
      ],
      cwd: moduleDir,
    });
    const { stdout } = await command.output();

    try {
      const actual = decoder.decode(stdout).trim();
      const expected = "Hello world";

      assertStrictEquals(actual, expected);
    } finally {
      abortController.abort();
      await serverPromise;
    }
  },
});
