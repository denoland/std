// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/** Options for {@linkcode getAvailablePort}. */
export interface GetAvailablePortOptions {
  /**
   * A port to check availability of first. If the port isn't available, fall
   * back to another port.
   *
   * Defaults to port 0, which will let the operating system choose an available
   * port.
   *
   * @default {0}
   */
  preferredPort?: number;
}

/**
 * Returns an available network port.
 *
 * @param options Options for getting an available port.
 * @returns An available network port.
 *
 * @example Usage
 * ```ts no-eval no-assert
 * import { getAvailablePort } from "@std/net/get-available-port";
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
      return listener.addr.port;
    } catch (e) {
      // If the preferred port is not available, fall through and find an available port
      if (!(e instanceof Deno.errors.AddrInUse)) {
        throw e;
      }
    }
  }

  using listener = Deno.listen({ port: 0 });
  return listener.addr.port;
}
