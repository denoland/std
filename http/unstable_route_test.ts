// Copyright 2018-2026 the Deno authors. MIT license.

import { type Route, route } from "./unstable_route.ts";
import { assertEquals } from "../assert/equals.ts";

const routes: Route[] = [
  {
    pattern: new URLPattern({ pathname: "/about" }),
    handler: (request: Request) => new Response(new URL(request.url).pathname),
  },
  {
    pattern: new URLPattern({ pathname: "/users/:id" }),
    handler: (_request, params) => new Response(params?.pathname.groups.id),
  },
  {
    pattern: new URLPattern({ pathname: "/users/:id" }),
    method: "POST",
    handler: () => new Response("Done"),
  },
  {
    pattern: new URLPattern({ pathname: "/resource" }),
    method: ["GET", "HEAD"],
    handler: (request: Request) =>
      new Response(request.method === "HEAD" ? null : "Ok"),
  },
];

function defaultHandler(request: Request) {
  return new Response(new URL(request.url).pathname, { status: 404 });
}

Deno.test("route()", async (t) => {
  const handler = route(routes, defaultHandler);

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

  await t.step("handles default handler", async () => {
    const request = new Request("http://example.com/not-found");
    const response = await handler(request);
    assertEquals(response?.status, 404);
    assertEquals(await response?.text(), "/not-found");
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
});
