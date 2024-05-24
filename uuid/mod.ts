// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Generators and validators for UUIDs for versions v1, v3, v4 and v5.
 *
 * Use {@linkcode crypto.randomUUID} for v4 generating v4 UUIDs.
 *
 * Based on {@linkcode https://www.npmjs.com/package/uuid | npm:uuid}, which is
 * based on {@link https://www.rfc-editor.org/rfc/rfc4122.html | RFC 4122}.
 *
 * Support for RFC4122 version 1, 3, 4, and 5 UUIDs
 *
 * This module is browser compatible.
 *
 * @module
 */

export * from "./common.ts";
export * from "./constants.ts";
export * as v1 from "./v1.ts";
export * as v3 from "./v3.ts";
export * as v4 from "./v4.ts";
export * as v5 from "./v5.ts";
