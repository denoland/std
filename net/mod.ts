// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Network utilities.
 *
 * ```ts no-assert no-eval
 * import { getNetworkAddress, getAvailablePort } from "@std/net";
 *
 * const port = getAvailablePort();
 * const hostname = getNetworkAddress();
 *
 * Deno.serve({ port, hostname }, () => new Response("Hello, world!"));
 * ```
 *
 * @module
 */

export * from "./get_available_port.ts";
export * from "./get_network_address.ts";
