// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Contains the constant {@linkcode HTTP_METHODS} and the type
 * {@linkcode HttpMethods} and the type guard {@linkcode isHttpMethod} for
 * working with HTTP methods with type safety.
 *
 * @module
 */

/** A constant array of common HTTP methods. */
export const HTTP_METHODS = [
  "HEAD",
  "OPTIONS",
  "GET",
  "PUT",
  "PATCH",
  "POST",
  "DELETE",
] as const;

/** A type representing string literals of each of the common HTTP method. */
export type HttpMethods = typeof HTTP_METHODS[number];

/** A type guard that determines if a value is a valid HTTP method. */
export function isHttpMethod(value: unknown): value is HttpMethods {
  return HTTP_METHODS.includes(value as HttpMethods);
}
