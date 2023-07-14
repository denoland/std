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
import type { ConnInfo } from "std/http/server.ts";

const CONN_INFO: ConnInfo = {
  localAddr: { hostname: "localhost", port: 8000, transport: "tcp" },
  remoteAddr: { hostname: "localhost", port: 53496, transport: "tcp" },
};

Deno.test("[http]", async (test) => {
  const handler = await createHandler(manifest);

  await test.step("GET /", async () => {
    const response = await handler(new Request("http://localhost"), CONN_INFO);

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
      CONN_INFO,
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
      CONN_INFO,
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
      CONN_INFO,
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
      CONN_INFO,
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
      CONN_INFO,
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
      CONN_INFO,
    );

    assertFalse(response.ok);
    assertFalse(response.body);
    assertEquals(response.headers.get("location"), "/");
    assertEquals(response.status, 302);
  });

  await test.step("GET /stats", async () => {
    const response = await handler(
      new Request("http://localhost/stats"),
      CONN_INFO,
    );

    assert(response.ok);
    assertInstanceOf(response.body, ReadableStream);
    assertEquals(
      response.headers.get("content-type"),
      "text/html; charset=utf-8",
    );
    assertEquals(response.status, 200);
  });

  await test.step("GET /submit", async () => {
    const response = await handler(
      new Request("http://localhost/submit"),
      CONN_INFO,
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
      CONN_INFO,
    );

    assertFalse(response.ok);
    assertFalse(response.body);
    assertEquals(response.status, 401);
  });

  await test.step("GET /feed", async () => {
    const response = await handler(
      new Request("http://localhost/feed"),
      CONN_INFO,
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
