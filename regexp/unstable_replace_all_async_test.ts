// Copyright 2018-2026 the Deno authors. MIT license.

import { replaceAllAsync } from "./unstable_replace_all_async.ts";
import { assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";

Deno.test("replaceAllAsync() replaces all occurrences of a pattern asynchronously", async () => {
  using _ = stub(
    globalThis,
    "fetch",
    (u) =>
      Promise.resolve(
        { status: String(u).includes("not-found") ? 404 : 200 } as Response,
      ),
  );

  const result = await replaceAllAsync(
    "https://example.com/ and https://example.com/not-found!",
    /https:\/\/([\w\-/.]+)/g,
    async (match, address) => {
      const { status } = await fetch(match, { method: "HEAD" });
      return `${address} returned status ${status}`;
    },
  );

  assertEquals(
    result,
    "example.com/ returned status 200 and example.com/not-found returned status 404!",
  );
});
