// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Returns an available network port.
 *
 * @example
 * ```ts
 * import { getAvailablePort } from "https://deno.land/std@$STD_VERSION/net/get_available_port.ts";
 *
 * const port = getAvailablePort();
 * Deno.serve({ port }, () => new Response("Hello, world!"));
 * ```
 */
export function getAvailablePort(): number {
  using listener = Deno.listen({ port: 0 });
  return (listener.addr as Deno.NetAddr).port;
}
