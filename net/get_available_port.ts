// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/** Options for {@linkcode getAvailablePort}. */
export interface GetAvailablePortOptions {
  /**
   * A port to check availability of first. If the port isn't available, fall
   * back to another port.
   */
  preferredPort?: number;
}

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
export function getAvailablePort(options?: GetAvailablePortOptions): number {
  if (options?.preferredPort) {
    try {
      // Check if the preferred port is available
      using listener = Deno.listen({ port: options.preferredPort });
      return (listener.addr as Deno.NetAddr).port;
    } catch (e) {
      // If the preferred port is not available, fall through and find an available port
      if (!(e instanceof Deno.errors.AddrInUse)) {
        throw e;
      }
    }
  }

  using listener = Deno.listen({ port: 0 });
  return (listener.addr as Deno.NetAddr).port;
}
