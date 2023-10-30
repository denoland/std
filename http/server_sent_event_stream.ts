// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#fields}
 */
export interface ServerSentEventMessage {
  /** Ignored by the client. */
  comment?: string;
  /** A string identifying the type of event described. */
  event?: string;
  /** The data field for the message. Split by new lines. */
  data?: string;
  /** The event ID to set the {@linkcode EventSource} object's last event ID value. */
  id?: string | number;
  /** The reconnection time. */
  retry?: number;
}

/**
 * Converts a server-sent message object into a string for the client.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format}
 */
function stringify(message: ServerSentEventMessage) {
  const lines = [];
  if (message.comment) lines.push(`:${message.comment}`);
  if (message.event) lines.push(`event:${message.event}`);
  if (message.data) {
    message.data.split(/\r?\n/).forEach((line) => lines.push(`data:${line}`));
  }
  if (message.id) lines.push(`id:${message.id}`);
  if (message.retry) lines.push(`retry:${message.retry}`);
  return lines.join("\n") + "\n\n";
}

/**
 * Transforms server-sent message objects into strings for the client.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events}
 *
 * @example
 * ```ts
 * import {
 *   type ServerSentEventMessage,
 *   ServerSentEventStream,
 * } from "https://deno.land/std@$STD_VERSION/http/server_sent_event_stream.ts";
 *
 * const stream = ReadableStream.from<ServerSentEventMessage>([
 *   { data: "hello there" }
 * ]).pipeThrough(new ServerSentEventStream())
 *   .pipeThrough(new TextEncoderStream());
 * new Response(stream, {
 *   headers: {
 *     "content-type": "text/event-stream",
 *     "cache-control": "no-cache",
 *   },
 * });
 * ```
 */
export class ServerSentEventStream
  extends TransformStream<ServerSentEventMessage, string> {
  constructor() {
    super({
      transform: (message, controller) => {
        controller.enqueue(stringify(message));
      },
    });
  }
}
