// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * Options for {@linkcode isPortAvailable}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface IsPortAvailableOptions {
  /**
   * The hostname to check the port on.
   *
   * @default {"0.0.0.0"}
   */
  hostname?: string;
}

/**
 * Returns whether the given TCP port is available to listen on.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * > [!IMPORTANT]
 * > This check is inherently racy: the port may be taken by another process
 * > between the time this function returns and the time you attempt to listen
 * > on it. When you control the listener, prefer passing `port: 0` to
 * > {@linkcode Deno.serve} or {@linkcode Deno.listen} to let the operating
 * > system assign an available port, or use
 * > {@linkcode https://jsr.io/@std/net/doc/get-available-port/~/getAvailablePort | getAvailablePort}.
 *
 * This function requires the `--allow-net` permission. Any error other than
 * {@linkcode Deno.errors.AddrInUse} is rethrown, including
 * {@linkcode Deno.errors.PermissionDenied} for privileged ports (below 1024)
 * or when the `net` permission has not been granted.
 *
 * @param port The port to check. Use `0` to check whether the operating system
 * can assign an ephemeral port.
 * @param options Options for checking the port.
 * @returns `true` if the port is available to listen on, `false` if it is
 * already in use.
 *
 * @example Usage
 * ```ts
 * import { isPortAvailable } from "@std/net/unstable-is-port-available";
 * import { assert } from "@std/assert";
 *
 * using listener = Deno.listen({ port: 0 });
 * const { port } = listener.addr;
 *
 * assert(!isPortAvailable(port));
 * ```
 *
 * @example Check before serving
 * ```ts no-assert ignore
 * import { isPortAvailable } from "@std/net/unstable-is-port-available";
 *
 * if (isPortAvailable(8080)) {
 *   Deno.serve({ port: 8080 }, () => new Response("Hello, world!"));
 * }
 * ```
 */
export function isPortAvailable(
  port: number,
  options?: IsPortAvailableOptions,
): boolean {
  try {
    using _listener = Deno.listen(
      options?.hostname !== undefined
        ? { port, hostname: options.hostname }
        : { port },
    );
    return true;
  } catch (e) {
    if (e instanceof Deno.errors.AddrInUse) {
      return false;
    }
    throw e;
  }
}
