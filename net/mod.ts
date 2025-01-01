// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Network utilities.
 *
 * ```ts no-assert ignore
 * import { getAvailablePort } from "@std/net";
 *
 * const command = new Deno.Command(Deno.execPath(), {
 *  args: ["test.ts", "--port", getAvailablePort().toString()],
 * });
 *
 * // ...
 * ```
 *
 * @module
 */

export * from "./get_available_port.ts";
