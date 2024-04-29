// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate that the passed UUID is an RFC4122 v4 UUID.
 *
 * @example
 * ```ts
 * import { validate } from "@std/uuid/v4";
 * import { generate as generateV1 } from "@std/uuid/v1";
 *
 * validate(crypto.randomUUID()); // true
 * validate(generateV1() as string); // false
 * validate("this-is-not-a-uuid"); // false
 * ```
 */
export function validate(
  id: string,
): id is ReturnType<typeof crypto.randomUUID> {
  return UUID_RE.test(id);
}
