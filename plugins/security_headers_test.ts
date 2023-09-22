// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { createHandler } from "$fresh/server.ts";
import { assertEquals } from "std/assert/assert_equals.ts";
import manifest from "@/fresh.gen.ts";
import options from "@/fresh.config.ts";

const handler = await createHandler(manifest, options);

Deno.test("[middleware] security headers are present", async () => {
  const resp = await handler(new Request("http://localhost"));

  assertEquals(
    resp.headers.get("strict-transport-security"),
    "max-age=63072000;",
  );
  assertEquals(
    resp.headers.get("referrer-policy"),
    "strict-origin-when-cross-origin",
  );
  assertEquals(resp.headers.get("x-content-type-options"), "nosniff");
  assertEquals(resp.headers.get("x-frame-options"), "SAMEORIGIN");
  assertEquals(resp.headers.get("x-xss-protection"), "1; mode=block");
});
