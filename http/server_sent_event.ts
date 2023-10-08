// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/unstable_server_sent_event.ts` instead.
 *
 * Provides {@linkcode ServerSentEvent} and
 * {@linkcode ServerSentEventStreamTarget} which provides an interface to send
 * server sent events to a browser using the DOM event model.
 *
 * The {@linkcode ServerSentEventStreamTarget} provides the `.asResponse()` or
 * `.asResponseInit()` to provide a body and headers to the client to establish
 * the event connection. This is accomplished by keeping a connection open to
 * the client by not closing the body, which allows events to be sent down the
 * connection and processed by the client browser.
 *
 * See more about Server-sent events on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
 *
 * ## Example
 *
 * ```ts
 * import {
 *   ServerSentEvent,
 *   ServerSentEventStreamTarget,
 * } from "https://deno.land/std@$STD_VERSION/http/unstable_server_sent_event.ts";
 *
 * Deno.serve({ port: 8000 }, (request) => {
 *   const target = new ServerSentEventStreamTarget();
 *   let counter = 0;
 *
 *   // Sends an event every 2 seconds, incrementing the ID
 *   const id = setInterval(() => {
 *     const evt = new ServerSentEvent(
 *       "message",
 *       { data: { hello: "world" }, id: counter++ },
 *     );
 *     target.dispatchEvent(evt);
 *   }, 2000);
 *
 *   target.addEventListener("close", () => clearInterval(id));
 *   return target.asResponse();
 * });
 * ```
 *
 * @module
 */

/**
 * @deprecated (will be removed after 0.210.0) Import from `std/http/unstable_server_sent_event.ts` instead.
 */
export * from "./unstable_server_sent_event.ts";
