// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertRejects } from "../assert/mod.ts";
import { composeHandler, type MiddlewareHandler } from "./middleware.ts";

const info: Deno.ServeHandlerInfo = {
  remoteAddr: { transport: "tcp", hostname: "foo", port: 200 },
};

Deno.test("composeHandler() chains middlewares in order", async () => {
  const order: number[] = [];

  const middleware1: MiddlewareHandler = async (_request, _info, next) => {
    const response = await next();
    response.headers.set("X-Foo-1", "Bar-1");
    order.push(1);
    return response;
  };

  const middleware2: MiddlewareHandler = async (_request, _info, next) => {
    const response = await next();
    response.headers.set("X-Foo-2", "Bar-2");
    order.push(2);
    return response;
  };

  const finalMiddleware: MiddlewareHandler = () => {
    order.push(3);
    return new Response();
  };

  const handler = composeHandler([middleware1, middleware2, finalMiddleware]);
  const request = new Request("http://localhost");
  const response = await handler(request, info);

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("X-Foo-1"), "Bar-1");
  assertEquals(response.headers.get("X-Foo-2"), "Bar-2");
  assertEquals(order, [3, 2, 1]);
});

Deno.test("composeHandler() throws when next() is called incorrectly", async () => {
  const finalMiddleware: MiddlewareHandler = async (_request, _info, next) => {
    await next();
    return new Response();
  };

  const handler = composeHandler([finalMiddleware]);
  const request = new Request("http://localhost");
  await assertRejects(
    async () => await handler(request, info),
    RangeError,
    "Middleware chain exhausted",
  );
});
