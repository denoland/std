// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { type Route, route } from "./unstable_route.ts";
import { assertEquals } from "../assert/equals.ts";

const routes: Route[] = [
  {
    pattern: new URLPattern({ pathname: "/about" }),
    handlers: { GET: (request) => new Response(new URL(request.url).pathname) },
  },
  {
    pattern: new URLPattern({ pathname: "/users/:id" }),
    handlers: {
      GET: (_request, params) => new Response(params?.pathname.groups.id),
      POST: () => new Response("Done"),
    },
  },
  {
    pattern: new URLPattern({ pathname: "/resource" }),
    handlers: {
      GET: (_request: Request) => new Response("Ok"),
      HEAD: (_request: Request) => new Response(null),
    },
  },
  {
    pattern: new URLPattern({ pathname: "/will-throw" }),
    handler: (_request: Request) => {
      throw new Error("oops");
      // deno-lint-ignore no-unreachable
      return new Response(null, { status: 200 });
    },
  },
];

const wildcardHandler: Route = {
  pattern: new URLPattern({ pathname: "/*" }),
  handler: (request: Request) => {
    return new Response(new URL(request.url).pathname, { status: 404 });
  },
};

function errorHandler(_err: unknown, _req: Request) {
  return new Response("Custom Error Message", {
    status: 500,
  });
}

Deno.test("route()", async (t) => {
  let handler = route(routes);

  await t.step("handles static routes", async () => {
    const request = new Request("http://example.com/about");
    const response = await handler(request);
    assertEquals(response?.status, 200);
    assertEquals(await response?.text(), "/about");
  });

  await t.step("handles dynamic routes", async () => {
    const request1 = new Request("http://example.com/users/123");
    const response1 = await handler(request1);
    assertEquals(await response1?.text(), "123");
    assertEquals(response1?.status, 200);

    const request2 = new Request("http://example.com/users/123", {
      method: "POST",
    });
    const response2 = await handler(request2);
    assertEquals(await response2?.text(), "Done");
    assertEquals(response2?.status, 200);
  });

  await t.step("handles multiple methods", async () => {
    const getMethodRequest = new Request("http://example.com/resource");
    const getMethodResponse = await handler(getMethodRequest);
    assertEquals(getMethodResponse?.status, 200);
    assertEquals(await getMethodResponse?.text(), "Ok");

    const headMethodRequest = new Request("http://example.com/resource", {
      method: "HEAD",
    });
    const headMethodResponse = await handler(headMethodRequest);
    assertEquals(headMethodResponse?.status, 200);
    assertEquals(await headMethodResponse?.text(), "");
  });

  await t.step("handles method not allowed", async () => {
    const request = new Request("http://example.com/resource", {
      method: "POST",
    });
    const response = await handler(request);
    assertEquals(response?.status, 405);
    assertEquals(response?.headers.get("Allow"), "GET, HEAD");
    assertEquals(await response?.text(), "Method Not Allowed");
  });

  await t.step("handles errors using default error handler", async () => {
    const request = new Request("http://example.com/will-throw");
    const response = await handler(request);
    assertEquals(response?.status, 500);
    assertEquals(await response?.text(), "Internal Server Error");
  });

  await t.step(
    "handles no matching route with default 404 handler",
    async () => {
      const request = new Request("http://example.com/not-found");
      const response = await handler(request);
      assertEquals(response?.status, 404);
      assertEquals(await response?.text(), "Not Found");
    },
  );

  handler = route([...routes, wildcardHandler], errorHandler);

  await t.step("handles routes using wildcard handler", async () => {
    const request = new Request("http://example.com/not-found");
    const response = await handler(request);
    assertEquals(response?.status, 404);
    assertEquals(await response?.text(), "/not-found");
  });

  await t.step("handles errors using custom error handler", async () => {
    const request = new Request("http://example.com/will-throw");
    const response = await handler(request);
    assertEquals(response?.status, 500);
    assertEquals(await response?.text(), "Custom Error Message");
  });
});
