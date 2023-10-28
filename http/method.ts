// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Contains the constant {@linkcode HTTP_METHODS} and the type
 * {@linkcode HttpMethod} and the type guard {@linkcode isHttpMethod} for
 * working with HTTP methods with type safety.
 *
 * @module
 */

/**
 * List of common IANA-registered HTTP methods.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9110.html#name-overview}
 */
export const HTTP_METHODS = [
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "DELETE",
  "CONNECT",
  "OPTIONS",
  "TRACE",
] as const;

/** A type representing string literals of each of the common HTTP method. */
export type HttpMethod = typeof HTTP_METHODS[number];

/** A type guard that determines if a value is a valid HTTP method. */
export function isHttpMethod(value: unknown): value is HttpMethod {
  return HTTP_METHODS.includes(value as HttpMethod);
}
