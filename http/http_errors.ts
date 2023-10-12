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
export {
  type ErrorStatusKeys,
  type HttpErrorOptions,
} from "./unstable_errors.ts";

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/unstable_errors.ts` instead.
 *
 * The base class that all derivative HTTP extend, providing a `status` and an expose` property.
 */
export { HttpError } from "./unstable_errors.ts";

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/unstable_errors.ts` instead.
 *
 * A namespace that contains each error constructor. Each error extends
 * `HTTPError` and provides `.status` and `.expose` properties, where the
 * `.status` will be an error `Status` value and `.expose` indicates if
 * information, like a stack trace, should be shared in the response.
 *
 * By default, `.expose` is set to false in server errors, and true for client
 * errors.
 *
 * @example
 * ```ts
 * import { errors } from "https://deno.land/std@$STD_VERSION/http/unstable_errors.ts";
 *
 * throw new errors.InternalServerError("Ooops!");
 * ```
 */
export { errors } from "./unstable_errors.ts";

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/unstable_errors.ts` instead.
 *
 * A factory function which provides a way to create errors. It takes up to 3
 * arguments, the error `Status`, an message, which defaults to the status text
 * and error options, which includes the `expose` property to set the `.expose`
 * value on the error.
 */
export { createHttpError } from "./unstable_errors.ts";

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/unstable_errors.ts` instead.
 *
 * A type guard that determines if the value is an HttpError or not.
 */
export { isHttpError } from "./unstable_errors.ts";
