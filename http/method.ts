// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/unstable_method.ts` instead.
 *
 * Contains the constant {@linkcode HTTP_METHODS} and the type
 * {@linkcode HttpMethod} and the type guard {@linkcode isHttpMethod} for
 * working with HTTP methods with type safety.
 *
 * @module
 */
import {
  HTTP_METHODS as HTTP_METHODS_,
  type HttpMethod as HttpMethod_,
  isHttpMethod as isHttpMethod_,
} from "./unstable_method.ts";

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/unstable_method.ts` instead.
 *
 * A constant array of common HTTP methods.
 *
 * This list is compatible with Node.js `http` module.
 */
export const HTTP_METHODS = HTTP_METHODS_;

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/unstable_method.ts` instead.
 *
 * A type representing string literals of each of the common HTTP method.
 */
export type HttpMethod = HttpMethod_;

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/unstable_method.ts` instead.
 *
 * A type guard that determines if a value is a valid HTTP method.
 */
export const isHttpMethod = isHttpMethod_;
