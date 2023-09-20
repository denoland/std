// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/status.ts` instead.
 *
 * Contains the enum {@linkcode Status} which enumerates standard HTTP status
 * codes and provides several type guards for handling status codes with type
 * safety.
 *
 * @example
 * ```ts
 * import {
 *   Status,
 *   STATUS_TEXT,
 * } from "https://deno.land/std@$STD_VERSION/http/http_status.ts";
 *
 * console.log(Status.NotFound); //=> 404
 * console.log(STATUS_TEXT[Status.NotFound]); //=> "Not Found"
 * ```
 *
 * ```ts
 * import { isErrorStatus } from "https://deno.land/std@$STD_VERSION/http/http_status.ts";
 *
 * const res = await fetch("https://example.com/");
 *
 * if (isErrorStatus(res.status)) {
 *   // error handling here...
 * }
 * ```
 *
 * @module
 */

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/status.ts` instead.
 */
export * from "./status.ts";
