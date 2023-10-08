// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/unstable_cookie_map.ts` instead.
 *
 * Provides a iterable map interfaces for managing cookies server side.
 *
 * @example
 * To access the keys in a request and have any set keys available for creating
 * a response:
 *
 * ```ts
 * import {
 *   CookieMap,
 *   mergeHeaders
 * } from "https://deno.land/std@$STD_VERSION/http/unstable_cookie_map.ts";
 *
 * const request = new Request("https://localhost/", {
 *   headers: { "cookie": "foo=bar; bar=baz;"}
 * });
 *
 * const cookies = new CookieMap(request, { secure: true });
 * console.log(cookies.get("foo")); // logs "bar"
 * cookies.set("session", "1234567", { secure: true });
 *
 * const response = new Response("hello", {
 *   headers: mergeHeaders({
 *     "content-type": "text/plain",
 *   }, cookies),
 * });
 * ```
 *
 * @example
 * To have automatic management of cryptographically signed cookies, you can use
 * the {@linkcode SecureCookieMap} instead of {@linkcode CookieMap}. The biggest
 * difference is that the methods operate async in order to be able to support
 * async signing and validation of cookies:
 *
 * ```ts
 * import {
 *   SecureCookieMap,
 *   mergeHeaders,
 *   type KeyRing,
 * } from "https://deno.land/std@$STD_VERSION/http/unstable_cookie_map.ts";
 *
 * const request = new Request("https://localhost/", {
 *   headers: { "cookie": "foo=bar; bar=baz;"}
 * });
 *
 * // The keys must implement the `KeyRing` interface.
 * declare const keys: KeyRing;
 *
 * const cookies = new SecureCookieMap(request, { keys, secure: true });
 * console.log(await cookies.get("foo")); // logs "bar"
 * // the cookie will be automatically signed using the supplied key ring.
 * await cookies.set("session", "1234567");
 *
 * const response = new Response("hello", {
 *   headers: mergeHeaders({
 *     "content-type": "text/plain",
 *   }, cookies),
 * });
 * ```
 *
 * In addition, if you have a {@linkcode Response} or {@linkcode Headers} for a
 * response at construction of the cookies object, they can be passed and any
 * set cookies will be added directly to those headers:
 *
 * ```ts
 * import { CookieMap } from "https://deno.land/std@$STD_VERSION/http/unstable_cookie_map.ts";
 *
 * const request = new Request("https://localhost/", {
 *   headers: { "cookie": "foo=bar; bar=baz;"}
 * });
 *
 * const response = new Response("hello", {
 *   headers: { "content-type": "text/plain" },
 * });
 *
 * const cookies = new CookieMap(request, { response });
 * console.log(cookies.get("foo")); // logs "bar"
 * cookies.set("session", "1234567");
 * ```
 *
 * @module
 */

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/unstable_cookie_map.ts` instead.
 */
export * from "./unstable_cookie_map.ts";
