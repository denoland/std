// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/**
 * Gets the IPv4 network address of the machine.
 *
 * This is inspired by the util of the same name in
 * {@linkcode https://www.npmjs.com/package/serve | npm:serve}.
 *
 * @see {@link https://github.com/vercel/serve/blob/1ea55b1b5004f468159b54775e4fb3090fedbb2b/source/utilities/http.ts#L33}
 *
 * @param family The IP protocol version of the interface to get the address of.
 * @returns The IPv4 network address of the machine.
 *
 * @example Get the IPv4 network address (default)
 * ```ts
 * import { getNetworkAddress } from "@std/net/get-network-address";
 * import { assert } from "@std/assert/assert";
 *
 * const address = getNetworkAddress();
 *
 * assert(address !== undefined);
 * ```
 *
 * @example Get the IPv6 network address
 * ```ts
 * import { getNetworkAddress } from "@std/net/get-network-address";
 * import { assert } from "@std/assert/assert";
 *
 * const address = getNetworkAddress("IPv6");
 *
 * assert(address !== undefined);
 * ```
 */
export function getNetworkAddress(
  family: Deno.NetworkInterfaceInfo["family"] = "IPv4",
): string | undefined {
  return Deno.networkInterfaces()
    .find((i) =>
      i.family === family &&
      (family === "IPv4"
        // Cannot lie within 127.0.0.0/8
        ? !i.address.startsWith("127")
        // Cannot lie within ::1/128 or fe80::/10
        : (!i.address.startsWith("::1")) || !i.address.startsWith("fe80::"))
    )
    ?.address;
}
