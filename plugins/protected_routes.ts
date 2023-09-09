// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { Plugin } from "$fresh/server.ts";
import { ensureSignedIn, type State } from "@/middleware/session.ts";

/**
 * Adds middleware to the defined routes that ensures the client is signed-in
 * before proceeding. The {@linkcode ensureSignedIn} middleware throws an error
 * equivalent to the
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401|HTTP 401 Unauthorized}
 * error if `ctx.state.sessionUser` is `undefined`.
 *
 * The thrown error is then handled by {@linkcode handleWebPageErrors}, or
 * {@linkcode handleRestApiErrors}, if the request is made to a REST API
 * endpoint.
 *
 * @see {@link https://fresh.deno.dev/docs/concepts/plugins|Plugins documentation}
 * for more information on Fresh's plugin functionality.
 */
const middleware = { handler: ensureSignedIn };
export default {
  name: "protected-routes",
  middlewares: [
    {
      path: "/account",
      middleware,
    },
    {
      path: "/dashboard",
      middleware,
    },
    {
      path: "/notifications",
      middleware,
    },
    {
      path: "/submit",
      middleware,
    },
    {
      path: "/api/me",
      middleware,
    },
  ],
} as Plugin<State>;
