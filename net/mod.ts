// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Network utilities.
 *
 * ```ts
 * import { getNetworkAddress } from "@std/net";
 * import { assertNotEquals } from "@std/assert/assert-not-equals";
 *
 * assertNotEquals(getNetworkAddress(), undefined);
 * ```
 *
 * @module
 */

export * from "./get_available_port.ts";
export * from "./get_network_address.ts";
