// Copyright 2018-2026 the Deno authors. MIT license.

import { type Route, routeLinear, routeRadix } from "./unstable_route.ts";
import { assertEquals } from "../assert/equals.ts";

function testRouter(name: string, route: typeof routeRadix) {
  const routes: Route[] = [
    {
      // No method — matches all HTTP methods
      pattern: new URLPattern({ pathname: "/about" }),
      handler: (request: Request) =>
        new Response(new URL(request.url).pathname),
    },
    {
      pattern: new URLPattern({ pathname: "/users/:id" }),
      method: "GET",
      handler: (_request, params) => new Response(params.pathname.groups.id),
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

  Deno.test(name, async (t) => {
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

    await t.step(
      "matches all methods when method is not specified",
      async () => {
        for (const method of ["GET", "POST", "PUT", "DELETE", "PATCH"]) {
          const request = new Request("http://example.com/about", { method });
          const response = await handler(request);
          assertEquals(response?.status, 200);
          assertEquals(await response?.text(), "/about");
        }
      },
    );

    await t.step("does not match unspecified methods", async () => {
      const request = new Request("http://example.com/users/123", {
        method: "DELETE",
      });
      const response = await handler(request);
      assertEquals(response?.status, 404);
    });

    await t.step("method matching is case-insensitive", async () => {
      const lowerCaseRoutes: Route[] = [
        {
          pattern: new URLPattern({ pathname: "/test" }),
          method: "post",
          handler: () => new Response("matched"),
        },
      ];
      const lowerCaseHandler = route(lowerCaseRoutes, defaultHandler);

      const request = new Request("http://example.com/test", {
        method: "POST",
      });
      const response = await lowerCaseHandler(request);
      assertEquals(response?.status, 200);
      assertEquals(await response?.text(), "matched");
    });

    await t.step(
      "method matching is case-insensitive for arrays",
      async () => {
        const mixedCaseRoutes: Route[] = [
          {
            pattern: new URLPattern({ pathname: "/test" }),
            method: ["get", "Post"],
            handler: () => new Response("matched"),
          },
        ];
        const mixedCaseHandler = route(mixedCaseRoutes, defaultHandler);

        const getResponse = await mixedCaseHandler(
          new Request("http://example.com/test"),
        );
        assertEquals(getResponse?.status, 200);

        const postResponse = await mixedCaseHandler(
          new Request("http://example.com/test", { method: "POST" }),
        );
        assertEquals(postResponse?.status, 200);
      },
    );

    await t.step("handles wildcard routes", async () => {
      const wildcardRoutes: Route[] = [
        {
          pattern: new URLPattern({ pathname: "/static/*" }),
          handler: () => new Response("static"),
        },
      ];
      const wildcardHandler = route(wildcardRoutes, defaultHandler);

      const response = await wildcardHandler(
        new Request("http://example.com/static/foo/bar.js"),
      );
      assertEquals(response?.status, 200);
      assertEquals(await response?.text(), "static");

      const noMatchResponse = await wildcardHandler(
        new Request("http://example.com/other/foo.js"),
      );
      assertEquals(noMatchResponse?.status, 404);
    });

    await t.step("handles root path", async () => {
      const rootRoutes: Route[] = [
        {
          pattern: new URLPattern({ pathname: "/" }),
          handler: () => new Response("root"),
        },
      ];
      const rootHandler = route(rootRoutes, defaultHandler);

      const response = await rootHandler(new Request("http://example.com/"));
      assertEquals(response?.status, 200);
      assertEquals(await response?.text(), "root");
    });

    await t.step(
      "first matching route wins when static and param routes overlap",
      async () => {
        const priorityRoutes: Route[] = [
          {
            pattern: new URLPattern({ pathname: "/users/me" }),
            handler: () => new Response("me"),
          },
          {
            pattern: new URLPattern({ pathname: "/users/:id" }),
            handler: (_request, params) =>
              new Response(params.pathname.groups.id),
          },
        ];
        const priorityHandler = route(priorityRoutes, defaultHandler);

        const meResponse = await priorityHandler(
          new Request("http://example.com/users/me"),
        );
        assertEquals(meResponse?.status, 200);
        assertEquals(await meResponse?.text(), "me");

        const idResponse = await priorityHandler(
          new Request("http://example.com/users/99"),
        );
        assertEquals(idResponse?.status, 200);
        assertEquals(await idResponse?.text(), "99");
      },
    );

    await t.step("param with regex constraint", async () => {
      const constrainedRoutes: Route[] = [
        {
          pattern: new URLPattern({ pathname: "/books/:id(\\d+)" }),
          handler: (_request, params) =>
            new Response("book:" + params.pathname.groups.id),
        },
        {
          pattern: new URLPattern({ pathname: "/books/:slug" }),
          handler: (_request, params) =>
            new Response("slug:" + params.pathname.groups.slug),
        },
      ];
      const constrainedHandler = route(constrainedRoutes, defaultHandler);

      const numericResponse = await constrainedHandler(
        new Request("http://example.com/books/123"),
      );
      assertEquals(numericResponse?.status, 200);
      assertEquals(await numericResponse?.text(), "book:123");

      const slugResponse = await constrainedHandler(
        new Request("http://example.com/books/my-book"),
      );
      assertEquals(slugResponse?.status, 200);
      assertEquals(await slugResponse?.text(), "slug:my-book");
    });

    await t.step("optional group in pattern", async () => {
      const optionalRoutes: Route[] = [
        {
          pattern: new URLPattern({ pathname: "/file{.:ext}?" }),
          handler: (_request, params) =>
            new Response("ext:" + (params.pathname.groups.ext || "none")),
        },
      ];
      const optionalHandler = route(optionalRoutes, defaultHandler);

      const withExtResponse = await optionalHandler(
        new Request("http://example.com/file.ts"),
      );
      assertEquals(withExtResponse?.status, 200);
      assertEquals(await withExtResponse?.text(), "ext:ts");

      const noExtResponse = await optionalHandler(
        new Request("http://example.com/file"),
      );
      assertEquals(noExtResponse?.status, 200);
      assertEquals(await noExtResponse?.text(), "ext:none");
    });

    await t.step("inline wildcard with suffix", async () => {
      const inlineWildcardRoutes: Route[] = [
        {
          pattern: new URLPattern({ pathname: "/static/*.js" }),
          handler: () => new Response("js-file"),
        },
      ];
      const inlineWildcardHandler = route(
        inlineWildcardRoutes,
        defaultHandler,
      );

      const jsResponse = await inlineWildcardHandler(
        new Request("http://example.com/static/app.js"),
      );
      assertEquals(jsResponse?.status, 200);
      assertEquals(await jsResponse?.text(), "js-file");

      const tsResponse = await inlineWildcardHandler(
        new Request("http://example.com/static/app.ts"),
      );
      assertEquals(tsResponse?.status, 404);
    });

    await t.step("non-capturing group in pattern", async () => {
      const ncgRoutes: Route[] = [
        {
          // {ersion} is a non-capturing group that matches the literal string "ersion" —
          // so the full pattern matches "/version/resource". It does NOT make the group
          // optional; use {ersion}? for that.
          pattern: new URLPattern({ pathname: "/v{ersion}/resource" }),
          handler: () => new Response("versioned"),
        },
      ];
      const ncgHandler = route(ncgRoutes, defaultHandler);

      const versionedResponse = await ncgHandler(
        new Request("http://example.com/version/resource"),
      );
      assertEquals(versionedResponse?.status, 200);
      assertEquals(await versionedResponse?.text(), "versioned");

      const shortResponse = await ncgHandler(
        new Request("http://example.com/v/resource"),
      );
      assertEquals(shortResponse?.status, 404);
    });

    await t.step("hostname constraint", async () => {
      const hostnameRoutes: Route[] = [
        {
          pattern: new URLPattern({
            hostname: "api.example.com",
            pathname: "/data",
          }),
          handler: () => new Response("api"),
        },
        {
          pattern: new URLPattern({
            hostname: "www.example.com",
            pathname: "/data",
          }),
          handler: () => new Response("www"),
        },
      ];
      const hostnameHandler = route(hostnameRoutes, defaultHandler);

      const apiResponse = await hostnameHandler(
        new Request("http://api.example.com/data"),
      );
      assertEquals(apiResponse?.status, 200);
      assertEquals(await apiResponse?.text(), "api");

      const wwwResponse = await hostnameHandler(
        new Request("http://www.example.com/data"),
      );
      assertEquals(wwwResponse?.status, 200);
      assertEquals(await wwwResponse?.text(), "www");
    });

    await t.step("search param constraint", async () => {
      const searchRoutes: Route[] = [
        {
          pattern: new URLPattern({ pathname: "/search", search: "q=:term" }),
          handler: (_request, params) =>
            new Response("term:" + params.search.groups.term),
        },
      ];
      const searchHandler = route(searchRoutes, defaultHandler);

      const matchedResponse = await searchHandler(
        new Request("http://example.com/search?q=hello"),
      );
      assertEquals(matchedResponse?.status, 200);
      assertEquals(await matchedResponse?.text(), "term:hello");

      const unmatchedResponse = await searchHandler(
        new Request("http://example.com/search?other=x"),
      );
      assertEquals(unmatchedResponse?.status, 404);
    });

    await t.step("handles URLs with fragment identifiers", async () => {
      const response = await handler(
        new Request("http://example.com/about#section1"),
      );
      assertEquals(response?.status, 200);
      assertEquals(await response?.text(), "/about");
    });

    await t.step(
      "handles URLs with both query string and fragment",
      async () => {
        const searchRoutes: Route[] = [
          {
            pattern: new URLPattern({ pathname: "/search", search: "q=:term" }),
            handler: (_request, params) =>
              new Response("term:" + params.search.groups.term),
          },
        ];
        const searchHandler = route(searchRoutes, defaultHandler);

        const response = await searchHandler(
          new Request("http://example.com/search?q=hello#results"),
        );
        assertEquals(response?.status, 200);
        assertEquals(await response?.text(), "term:hello");
      },
    );

    await t.step(
      "param route registered before static route preserves insertion order",
      async () => {
        const orderRoutes: Route[] = [
          {
            pattern: new URLPattern({ pathname: "/users/:id" }),
            handler: (_request, params) =>
              new Response("param:" + params.pathname.groups.id),
          },
          {
            pattern: new URLPattern({ pathname: "/users/me" }),
            handler: () => new Response("static:me"),
          },
        ];
        const orderHandler = route(orderRoutes, defaultHandler);

        // The param route was registered first, so it should win for "/users/me"
        const response = await orderHandler(
          new Request("http://example.com/users/me"),
        );
        assertEquals(response?.status, 200);
        assertEquals(await response?.text(), "param:me");
      },
    );

    await t.step("optional param with ? modifier", async () => {
      const optionalParamRoutes: Route[] = [
        {
          pattern: new URLPattern({ pathname: "/users/:id?" }),
          handler: (_request, params) =>
            new Response("id:" + (params.pathname.groups.id || "none")),
        },
      ];
      const optionalParamHandler = route(optionalParamRoutes, defaultHandler);

      const withId = await optionalParamHandler(
        new Request("http://example.com/users/42"),
      );
      assertEquals(withId?.status, 200);
      assertEquals(await withId?.text(), "id:42");

      const withoutId = await optionalParamHandler(
        new Request("http://example.com/users"),
      );
      assertEquals(withoutId?.status, 200);
      assertEquals(await withoutId?.text(), "id:none");
    });

    await t.step(
      "backslash-escaped literal in pathname matches request path",
      async () => {
        // URLPattern requires reserved characters (+, ?, *) to be backslash-
        // escaped to match literally. The escape is preserved in
        // `pattern.pathname`, so the matcher must not treat the segment
        // as a static radix-tree key.
        const escapedRoutes: Route[] = [
          {
            pattern: new URLPattern({ pathname: "/file\\+v2" }),
            handler: () => new Response("plus"),
          },
          {
            pattern: new URLPattern({ pathname: "/c\\+\\+" }),
            handler: () => new Response("cpp"),
          },
        ];
        const escapedHandler = route(escapedRoutes, defaultHandler);

        const plusResponse = await escapedHandler(
          new Request("http://example.com/file+v2"),
        );
        assertEquals(plusResponse?.status, 200);
        assertEquals(await plusResponse?.text(), "plus");

        const cppResponse = await escapedHandler(
          new Request("http://example.com/c++"),
        );
        assertEquals(cppResponse?.status, 200);
        assertEquals(await cppResponse?.text(), "cpp");
      },
    );
  });
}

testRouter("routeRadix()", routeRadix);
testRouter("routeLinear()", routeLinear);
