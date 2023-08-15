// Copyright 2023 the Deno authors. All rights reserved. MIT license.

import { createHandler } from "$fresh/server.ts";
import manifest from "@/fresh.gen.ts";
import {
  assert,
  assertEquals,
  assertFalse,
  assertInstanceOf,
  assertStringIncludes,
} from "std/testing/asserts.ts";

Deno.test("[http]", async (test) => {
  const handler = await createHandler(manifest);

  await test.step("GET /", async () => {
    const resp = await handler(new Request("http://localhost"));

    assert(resp.ok);
    assertInstanceOf(resp.body, ReadableStream);
    assertEquals(
      resp.headers.get("content-type"),
      "text/html; charset=utf-8",
    );
    assertEquals(resp.status, 200);
  });

  await test.step("GET /account", async () => {
    const resp = await handler(
      new Request("http://localhost/account"),
    );

    assertFalse(resp.ok);
    assertFalse(resp.body);
    assertEquals(
      resp.headers.get("location"),
      "/signin?from=http://localhost/account",
    );
    assertEquals(resp.status, 303);
  });

  await test.step("GET /callback", async () => {
    const resp = await handler(
      new Request("http://localhost/callback"),
    );

    assertFalse(resp.ok);
    assertInstanceOf(resp.body, ReadableStream);
    assertEquals(
      resp.headers.get("content-type"),
      "text/html; charset=utf-8",
    );
    assertEquals(resp.status, 500);
  });

  await test.step("GET /blog", async () => {
    const resp = await handler(
      new Request("http://localhost/blog"),
    );

    assert(resp.ok);
    assertInstanceOf(resp.body, ReadableStream);
    assertEquals(
      resp.headers.get("content-type"),
      "text/html; charset=utf-8",
    );
    assertEquals(resp.status, 200);
  });

  await test.step("GET /pricing", async () => {
    const resp = await handler(
      new Request("http://localhost/pricing"),
    );

    assertFalse(resp.ok);
    assertInstanceOf(resp.body, ReadableStream);
    assertEquals(
      resp.headers.get("content-type"),
      "text/html; charset=utf-8",
    );
    assertEquals(resp.status, 404);
  });

  await test.step("GET /signin", async () => {
    const resp = await handler(
      new Request("http://localhost/signin"),
    );

    assertFalse(resp.ok);
    assertFalse(resp.body);
    assertStringIncludes(
      resp.headers.get("location")!,
      "https://github.com/login/oauth/authorize",
    );
    assertEquals(resp.status, 302);
  });

  await test.step("GET /signout", async () => {
    const resp = await handler(
      new Request("http://localhost/signout"),
    );

    assertFalse(resp.ok);
    assertFalse(resp.body);
    assertEquals(resp.headers.get("location"), "/");
    assertEquals(resp.status, 302);
  });

  await test.step("GET /dashboard", async () => {
    const resp = await handler(
      new Request("http://localhost/dashboard"),
    );

    assertFalse(resp.ok);
    assertFalse(resp.body);
    assertEquals(
      resp.headers.get("location"),
      "/signin?from=http://localhost/dashboard",
    );
    assertEquals(resp.status, 303);
  });

  await test.step("GET /submit", async () => {
    const resp = await handler(
      new Request("http://localhost/submit"),
    );

    assertFalse(resp.ok);
    assertFalse(resp.body);
    assertEquals(
      resp.headers.get("location"),
      "/signin?from=http://localhost/submit",
    );
    assertEquals(resp.status, 303);
  });

  await test.step("POST /submit", async () => {
    const resp = await handler(
      new Request("http://localhost/submit", { method: "POST" }),
    );

    assertFalse(resp.ok);
    assertFalse(resp.body);
    assertEquals(resp.status, 303);
  });

  await test.step("GET /feed", async () => {
    const resp = await handler(
      new Request("http://localhost/feed"),
    );

    assert(resp.ok);
    assertInstanceOf(resp.body, ReadableStream);
    assertEquals(
      resp.headers.get("content-type"),
      "application/atom+xml; charset=utf-8",
    );
    assertEquals(resp.status, 200);
  });
});
