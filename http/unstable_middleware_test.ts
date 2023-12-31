// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertRejects } from "../assert/mod.ts";
import {
  composeMiddleware,
  type MiddlewareHandler,
} from "./unstable_middleware.ts";

const info: Deno.ServeHandlerInfo = {
  remoteAddr: { transport: "tcp", hostname: "foo", port: 200 },
};

Deno.test("composeMiddleware() chains middlewares in order", async () => {
  type State = number[];

  const middleware1: MiddlewareHandler<State> = async (
    _request,
    { next, state },
  ) => {
    state.push(1);
    const response = await next();
    response.headers.set("X-Foo-1", "Bar-1");
    return response;
  };

  const middleware2: MiddlewareHandler<State> = async (
    _request,
    { next, state },
  ) => {
    state.push(2);
    const response = await next();
    response.headers.set("X-Foo-2", "Bar-2");
    return response;
  };

  const finalMiddleware: MiddlewareHandler<State> = (
    _request,
    { state },
  ) => {
    assertEquals(state, [1, 2]);
    return new Response();
  };

  const handler = composeMiddleware<State>([
    middleware1,
    middleware2,
    finalMiddleware,
  ], []);
  const request = new Request("http://localhost");
  const response = await handler(request, info);

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("X-Foo-1"), "Bar-1");
  assertEquals(response.headers.get("X-Foo-2"), "Bar-2");
});

Deno.test("composeMiddleware() throws when next() is called incorrectly", async () => {
  const finalMiddleware: MiddlewareHandler = async (
    _request,
    { next },
  ) => {
    await next();
    return new Response();
  };

  const handler = composeMiddleware([finalMiddleware]);
  const request = new Request("http://localhost");
  await assertRejects(
    async () => await handler(request, info),
    RangeError,
    "Middleware chain exhausted",
  );
});
