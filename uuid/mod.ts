// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Generators and validators for
 * {@link https://www.rfc-editor.org/rfc/rfc9562.html | RFC 9562} UUIDs for
 * versions v1, v3, v4 and v5.
 *
 * Use the built-in
 * {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID | crypto.randomUUID()}
 * function instead of this package, if you only need to generate v4 UUIDs.
 *
 * Based on {@linkcode https://www.npmjs.com/package/uuid | npm:uuid}.
 *
 * ```ts
 * import { v5, NAMESPACE_DNS, NIL_UUID } from "@std/uuid";
 * import { assert, assertFalse } from "@std/assert";
 *
 * const data = new TextEncoder().encode("deno.land");
 * const uuid = await v5.generate(NAMESPACE_DNS, data);
 *
 * assert(v5.validate(uuid));
 * assertFalse(v5.validate(NIL_UUID));
 * ```
 *
 * @module
 */

export * from "./common.ts";
export * from "./constants.ts";
/**
 * Generator and validator for
 * {@link https://www.rfc-editor.org/rfc/rfc9562.html#section-5.1 | UUIDv1}.
 *
 * @example Usage
 * ```ts
 * import { v1 } from "@std/uuid";
 * import { assert } from "@std/assert/assert";
 *
 * const uuid = v1.generate();
 * assert(v1.validate(uuid as string));
 * ```
 */
export * as v1 from "./v1.ts";
/**
 * Generator and validator for
 * {@link https://www.rfc-editor.org/rfc/rfc9562.html#section-5.3 | UUIDv3}.
 *
 * @example Usage
 * ```ts
 * import { v3, NAMESPACE_DNS } from "@std/uuid";
 * import { assert } from "@std/assert/assert";
 *
 * const data = new TextEncoder().encode("deno.land");
 * const uuid = await v3.generate(NAMESPACE_DNS, data);
 * assert(v3.validate(uuid));
 * ```
 */
export * as v3 from "./v3.ts";
/**
 * Validator for
 * {@link https://www.rfc-editor.org/rfc/rfc9562.html#section-5.4 | UUIDv4}.
 *
 * @example Usage
 * ```ts
 * import { v4 } from "@std/uuid";
 * import { assert } from "@std/assert/assert";
 *
 * const uuid = crypto.randomUUID();
 * assert(v4.validate(uuid));
 * ```
 */
export * as v4 from "./v4.ts";
/**
 * Generator and validator for
 * {@link https://www.rfc-editor.org/rfc/rfc9562.html#section-5.5 | UUIDv5}.
 *
 * @example Usage
 * ```ts
 * import { v5, NAMESPACE_DNS } from "@std/uuid";
 * import { assert } from "@std/assert/assert";
 *
 * const data = new TextEncoder().encode("deno.land");
 * const uuid = await v5.generate(NAMESPACE_DNS, data);
 * assert(v5.validate(uuid));
 * ```
 */
export * as v5 from "./v5.ts";
