// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
// This module is generated from https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods.

/**
 * HTTP request methods
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
 */
export const HttpRequestMethod = {
  /**
   * The GET method requests a representation of the specified resource. Requests using GET should only retrieve data.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET
   */
  Get: "GET",

  /**
   * The HEAD method asks for a response identical to a GET request, but without the response body.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD
   */
  Head: "HEAD",

  /**
   * The POST method submits an entity to the specified resource, often causing a change in state or side effects on the server.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST
   */
  Post: "POST",

  /**
   * The PUT method replaces all current representations of the target resource with the request payload.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PUT
   */
  Put: "PUT",

  /**
   * The DELETE method deletes the specified resource.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE
   */
  Delete: "DELETE",

  /**
   * The CONNECT method establishes a tunnel to the server identified by the target resource.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT
   */
  Connect: "CONNECT",

  /**
   * The OPTIONS method describes the communication options for the target resource.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/OPTIONS
   */
  Options: "OPTIONS",

  /**
   * The TRACE method performs a message loop-back test along the path to the target resource.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/TRACE
   */
  Trace: "TRACE",

  /**
   * The PATCH method applies partial modifications to a resource.
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PATCH
   */
  Patch: "PATCH",
} as const;
