// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { listenAndServe } from "../http/server.ts";
import { assertStrictEquals } from "../testing/asserts.ts";
import { dirname, fromFileUrl } from "../path/mod.ts";

const moduleDir = dirname(fromFileUrl(import.meta.url));

Deno.test({
  name: "[examples/curl] send a request to a specified url",
  fn: async () => {
    const abortController = new AbortController();
    const serverPromise = listenAndServe(
      ":8081",
      () => new Response("Hello world"),
      { signal: abortController.signal },
    );
    const decoder = new TextDecoder();
    const process = Deno.run({
      cmd: [
        Deno.execPath(),
        "run",
        "--quiet",
        "--allow-net",
        "curl.ts",
        "http://localhost:8081",
      ],
      cwd: moduleDir,
      stdout: "piped",
    });

    try {
      const output = await process.output();
      const actual = decoder.decode(output).trim();
      const expected = "Hello world";

      assertStrictEquals(actual, expected);
    } finally {
      abortController.abort();
      process.close();
      await serverPromise;
    }
  },
});
