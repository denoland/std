import { type Route, route } from "./route.ts";
import { assertEquals } from "../assert/equals.ts";

const routes: Route[] = [
  {
    path: "/about",
    handler: (request: Request) => new Response(new URL(request.url).pathname),
  },
  {
    path: new URLPattern({ pathname: "/users/:id" }),
    method: "POST",
    handler: (_request, _info, params) =>
      new Response(params?.pathname.groups.id),
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
    const request = new Request("http://example.com/users/123", {
      method: "POST",
    });
    const response = await handler(request);
    assertEquals(await response?.text(), "123");
    assertEquals(response?.status, 200);
  });

  await t.step("handles default handler", async () => {
    const request = new Request("http://example.com/not-found");
    const response = await handler(request);
    assertEquals(response?.status, 404);
    assertEquals(await response?.text(), "/not-found");
  });
});
