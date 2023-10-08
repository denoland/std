// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/unstable_errors.ts` instead.
 *
 * A collection of HTTP errors and utilities.
 *
 * The export {@linkcode errors} contains an individual class that extends
 * {@linkcode HttpError} which makes handling HTTP errors in a structured way.
 *
 * The function {@linkcode createHttpError} provides a way to create instances
 * of errors in a factory pattern.
 *
 * The function {@linkcode isHttpError} is a type guard that will narrow a value
 * to an `HttpError` instance.
 *
 * @example
 * ```ts
 * import { errors, isHttpError } from "https://deno.land/std@$STD_VERSION/http/unstable_errors.ts";
 *
 * try {
 *   throw new errors.NotFound();
 * } catch (e) {
 *   if (isHttpError(e)) {
 *     const response = new Response(e.message, { status: e.status });
 *   } else {
 *     throw e;
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * import { createHttpError } from "https://deno.land/std@$STD_VERSION/http/unstable_errors.ts";
 * import { Status } from "https://deno.land/std@$STD_VERSION/http/status.ts";
 *
 * try {
 *   throw createHttpError(
 *     Status.BadRequest,
 *     "The request was bad.",
 *     { expose: false }
 *   );
 * } catch (e) {
 *   // handle errors
 * }
 * ```
 *
 * @module
 */

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/unstable_errors.ts` instead.
 */
export * from "./unstable_errors.ts";
