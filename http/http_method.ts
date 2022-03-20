// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Enum of HTTP RFC 7231 & RFC 5789 methods.
 *
 * ```ts
 * import {
 *   Method
 * } from "https://deno.land/std@$STD_VERSION/http/http_method.ts";
 *
 * console.log(Method.GET); //=> "GET"
 * ```
 */
export enum Method {
  /* RFC 7231, 4.3.1 */
  GET = "GET",
  /* RFC 7231, 4.3.2 */
  HEAD = "HEAD",
  /* RFC 7231, 4.3.3  */
  POST = "POST",
  /* RFC 7231, 4.3.4 */
  PUT = "PUT",
  /* RFC 7231, 4.3.5 */
  DELETE = "DELETE",
  /* RFC 7231, 4.3.6 */
  CONNECT = "CONNECT",
  /* RFC 7231, 4.3.7 */
  OPTIONS = "OPTIONS",
  /* RFC 7231, 4.3.8 */
  TRACE = "TRACE",
  /* RFC 5789, 2 */
  PATCH = "PATCH",
}
