// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Generators and validators for [RFC4122](https://www.rfc-editor.org/rfc/rfc4122.html)
 * UUIDs for versions v1, v3, v4 and v5.
 *
 * Use the built-in [`crypto.randomUUID`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)
 * function instead of this package, if you only need to generate v4 UUIDs.
 *
 * Based on {@linkcode https://www.npmjs.com/package/uuid | npm:uuid}.
 *
 * This module is browser compatible.
 *
 * @example
 * ```js
 * import { generate } from "@std/uuid/v5";
 *
 * const NAMESPACE_URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
 *
 * const uuid = await generate(NAMESPACE_URL, new TextEncoder().encode("python.org"));
 * uuid === "7af94e2b-4dd9-50f0-9c9a-8a48519bdef0" // true
 * ```
 *
 * @module
 */

export * from "./common.ts";
export * from "./constants.ts";
export * as v1 from "./v1.ts";
export * as v3 from "./v3.ts";
export * as v4 from "./v4.ts";
export * as v5 from "./v5.ts";
