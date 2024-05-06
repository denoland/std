// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/**
 * Gets the IPv4 network address of the machine.
 *
 * This is inspired by the util of the same name in
 * {@linkcode https://www.npmjs.com/package/serve | npm:serve}.
 *
 * @see {@link https://github.com/vercel/serve/blob/1ea55b1b5004f468159b54775e4fb3090fedbb2b/source/utilities/http.ts#L33}
 *
 * @returns The IPv4 network address of the machine.
 *
 * @example Basic usage
 * ```ts
 * import { getNetworkAddress } from "@std/net/get-network-address";
 * import { assert } from "@std/assert/assert";
 *
 * const address = getNetworkAddress();
 *
 * assert(address !== undefined);
 * ```
 */
export function getNetworkAddress(
  family: Deno.NetworkInterfaceInfo["family"] = "IPv4",
): string | undefined {
  return Deno.networkInterfaces()
    .find((i) => i.family === family && !i.address.startsWith("127"))?.address;
}
