// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { type ErrorStatus, STATUS_TEXT } from "./status.ts";

/**
 * Options for {@linkcode HttpError}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface HttpErrorOptions extends ErrorOptions {
  /**
   * Configuration options for the HTTP response associated with this error.
   */
  init?: ResponseInit;
}

/**
 * An error class for representing HTTP errors with status codes.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * Extends the standard {@linkcode Error} class to include HTTP-specific
 * properties such as status codes and optional response initialization options.
 * It's commonly used in route handlers to signal HTTP errors that should be
 * returned to the client.
 *
 * @param status The HTTP status code (e.g., 404, 500, 403)
 * @param message Optional error message. Defaults to the standard status text for the given status code
 * @param options Optional error options including cause and response init configuration
 *
 * @example Usage without custom message or options
 * ```ts
 * import { HttpError } from "@std/http/unstable-error";
 * import { assertEquals, assertInstanceOf } from "@std/assert";
 *
 * try {
 *   throw new HttpError(404);
 * } catch (error) {
 *   assertInstanceOf(error, HttpError);
 *   assertEquals(error.status, 404);
 *   assertEquals(error.message, "Not Found");
 * }
 * ```
 *
 * @example Usage with custom message
 * ```ts
 * import { HttpError } from "@std/http/unstable-error";
 * import { assertEquals, assertInstanceOf } from "@std/assert";
 *
 * try {
 *   throw new HttpError(500, "Something went wrong");
 * } catch (error) {
 *   assertInstanceOf(error, HttpError);
 *   assertEquals(error.status, 500);
 *   assertEquals(error.message, "Something went wrong");
 * }
 * ```
 *
 * @example Usage with response init options
 * ```ts
 * import { HttpError } from "@std/http/unstable-error";
 * import { assertEquals, assertInstanceOf } from "@std/assert";
 *
 * try {
 *   throw new HttpError(403, "Forbidden", {
 *     init: { headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' } },
 *   });
 * } catch (error) {
 *   assertInstanceOf(error, HttpError);
 *   assertEquals(error.status, 403);
 *   assertEquals(error.message, "Forbidden");
 *   assertEquals(
 *     (error.init.headers as Record<string, string>)["WWW-Authenticate"],
 *     'Basic realm="Secure Area"',
 *   );
 * }
 * ```
 *
 * @example Usage with cause
 * ```ts
 * import { HttpError } from "@std/http/unstable-error";
 * import { assertEquals, assertInstanceOf } from "@std/assert";
 *
 * try {
 *   throw new HttpError(500, "Internal Server Error", {
 *     cause: new Error("Database connection failed"),
 *   });
 * } catch (error) {
 *   assertInstanceOf(error, HttpError);
 *   assertEquals(error.status, 500);
 *   assertEquals(error.message, "Internal Server Error");
 *   assertInstanceOf(error.cause, Error);
 *   assertEquals(error.cause?.message, "Database connection failed");
 * }
 * ```
 */
export class HttpError extends Error {
  /**
   * The HTTP status code (e.g., 404, 500, 403)
   *
   * @example Usage
   * ```ts
   * import { HttpError } from "@std/http/unstable-error";
   * import { assertEquals, assertInstanceOf } from "@std/assert";
   *
   * try {
   *   throw new HttpError(404);
   * } catch (error) {
   *   assertInstanceOf(error, HttpError);
   *   assertEquals(error.status, 404);
   *   assertEquals(error.message, "Not Found");
   * }
   * ```
   */
  status: ErrorStatus;
  /**
   * Configuration options for the HTTP response associated with this error.
   *
   * `init.status` always reflects the standard HTTP value for the given status
   * code.
   *
   * @example Usage
   * ```ts
   * import { HttpError } from "@std/http/unstable-error";
   * import { assertEquals, assertInstanceOf } from "@std/assert";
   *
   * try {
   *   throw new HttpError(403, "Forbidden", {
   *     init: { headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' } },
   *   });
   * } catch (error) {
   *   assertInstanceOf(error, HttpError);
   *   assertEquals(error.status, 403);
   *   assertEquals(error.message, "Forbidden");
   *   assertEquals(
   *     (error.init.headers as Record<string, string>)["WWW-Authenticate"],
   *     'Basic realm="Secure Area"',
   *   );
   * }
   * ```
   */
  init: ResponseInit;

  /**
   * Constructs a new instance.
   *
   * @param status The HTTP status code (e.g., 404, 500, 403)
   * @param message Optional error message. Defaults to the standard status text for the given status code
   * @param options Optional error options including cause and response init configuration
   */
  constructor(
    status: ErrorStatus,
    message: string = STATUS_TEXT[status],
    options?: HttpErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
    this.status = status;
    this.init = { status, ...options?.init };
  }
}
