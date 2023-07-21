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
    const response = await handler(new Request("http://localhost"));

    assert(response.ok);
    assertInstanceOf(response.body, ReadableStream);
    assertEquals(
      response.headers.get("content-type"),
      "text/html; charset=utf-8",
    );
    assertEquals(response.status, 200);
  });

  await test.step("GET /account", async () => {
    const response = await handler(
      new Request("http://localhost/account"),
    );

    assertFalse(response.ok);
    assertFalse(response.body);
    assertEquals(
      response.headers.get("location"),
      "/signin?from=http://localhost/account",
    );
    assertEquals(response.status, 303);
  });

  await test.step("GET /callback", async () => {
    const response = await handler(
      new Request("http://localhost/callback"),
    );

    assertFalse(response.ok);
    assertInstanceOf(response.body, ReadableStream);
    assertEquals(
      response.headers.get("content-type"),
      "text/html; charset=utf-8",
    );
    assertEquals(response.status, 500);
  });

  await test.step("GET /blog", async () => {
    const response = await handler(
      new Request("http://localhost/blog"),
    );

    assert(response.ok);
    assertInstanceOf(response.body, ReadableStream);
    assertEquals(
      response.headers.get("content-type"),
      "text/html; charset=utf-8",
    );
    assertEquals(response.status, 200);
  });

  await test.step("GET /pricing", async () => {
    const response = await handler(
      new Request("http://localhost/pricing"),
    );

    assertFalse(response.ok);
    assertInstanceOf(response.body, ReadableStream);
    assertEquals(
      response.headers.get("content-type"),
      "text/html; charset=utf-8",
    );
    assertEquals(response.status, 404);
  });

  await test.step("GET /signin", async () => {
    const response = await handler(
      new Request("http://localhost/signin"),
    );

    assertFalse(response.ok);
    assertFalse(response.body);
    assertStringIncludes(
      response.headers.get("location")!,
      "https://github.com/login/oauth/authorize",
    );
    assertEquals(response.status, 302);
  });

  await test.step("GET /signout", async () => {
    const response = await handler(
      new Request("http://localhost/signout"),
    );

    assertFalse(response.ok);
    assertFalse(response.body);
    assertEquals(response.headers.get("location"), "/");
    assertEquals(response.status, 302);
  });

  await test.step("GET /dashboard", async () => {
    const response = await handler(
      new Request("http://localhost/dashboard"),
    );

    assertFalse(response.ok);
    assertFalse(response.body);
    assertEquals(
      response.headers.get("location"),
      "/signin?from=http://localhost/dashboard",
    );
    assertEquals(response.status, 303);
  });

  await test.step("GET /submit", async () => {
    const response = await handler(
      new Request("http://localhost/submit"),
    );

    assertFalse(response.ok);
    assertFalse(response.body);
    assertEquals(
      response.headers.get("location"),
      "/signin?from=http://localhost/submit",
    );
    assertEquals(response.status, 303);
  });

  await test.step("POST /submit", async () => {
    const response = await handler(
      new Request("http://localhost/submit", { method: "POST" }),
    );

    assertFalse(response.ok);
    assertFalse(response.body);
    assertEquals(response.status, 401);
  });

  await test.step("GET /feed", async () => {
    const response = await handler(
      new Request("http://localhost/feed"),
    );

    assert(response.ok);
    assertInstanceOf(response.body, ReadableStream);
    assertEquals(
      response.headers.get("content-type"),
      "application/atom+xml; charset=utf-8",
    );
    assertEquals(response.status, 200);
  });
});
