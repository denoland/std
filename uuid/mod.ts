// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// Based on https://github.com/kelektiv/node-uuid -> https://www.ietf.org/rfc/rfc4122.txt
// Supporting Support for RFC4122 version 1, 4, and 5 UUIDs

import * as v1 from "./v1.ts";
import * as v4 from "./v4.ts";
import * as v5 from "./v5.ts";

export const NIL_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * Check if the passed UUID is the nil UUID.
 *
 * ```js
 * import { isNil } from "./mod.ts";
 *
 * isNil("00000000-0000-0000-0000-000000000000") // true
 * isNil(crypto.randomUUID()) // false
 * ```
 */
export function isNil(id: string): boolean {
  return id === NIL_UUID;
}

export { v1, v4, v5 };
