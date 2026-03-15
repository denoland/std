// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import type { ServerSentEventMessage } from "./server_sent_event_stream.ts";

/**
 * A server-sent event message parsed from a stream.
 *
 * Unlike {@linkcode ServerSentEventMessage}, the `id` field is always
 * a string (not `string | number`) because parsed IDs are not coerced.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#fields}
 */
export type ServerSentEventParsedMessage =
  & Omit<ServerSentEventMessage, "id">
  & {
    /** The event ID to set the {@linkcode EventSource} object's last event ID value. */
    id?: string;
  };

/**
 * Options for {@linkcode ServerSentEventParseStream}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface ServerSentEventParseStreamOptions {
  /**
   * Whether to ignore comment lines (lines starting with `:`).
   *
   * Comments are often used as keep-alive signals and may not be needed
   * by the consumer. When `true`, comment lines are still parsed to detect
   * message boundaries but are not included in the output.
   *
   * @default {false}
   */
  ignoreComments?: boolean;
}

const NEWLINE_REGEXP = /\r\n|\r|\n/;

/**
 * Parses a field line and updates the message accumulator.
 * Returns true if a field was added to the message.
 */
function parseLine(
  line: string,
  message: ServerSentEventParsedMessage,
  ignoreComments: boolean,
): boolean {
  // Lines starting with colon are comments
  if (line[0] === ":") {
    if (ignoreComments) return false;
    const value = line.slice(1);
    message.comment = message.comment !== undefined
      ? `${message.comment}\n${value}`
      : value;
    return true;
  }

  // Parse field:value
  const colonIndex = line.indexOf(":");
  let field: string;
  let value: string;

  if (colonIndex === -1) {
    // No colon means field name only, empty value
    field = line;
    value = "";
  } else {
    field = line.slice(0, colonIndex);
    // Remove single leading space from value if present
    value = line[colonIndex + 1] === " "
      ? line.slice(colonIndex + 2)
      : line.slice(colonIndex + 1);
  }

  switch (field) {
    case "event":
      message.event = value;
      return true;
    case "data":
      // Accumulate data with newlines between
      message.data = message.data !== undefined
        ? `${message.data}\n${value}`
        : value;
      return true;
    case "id":
      // Per spec: ignore if value contains null character
      if (!value.includes("\0")) {
        message.id = value;
        return true;
      }
      return false;
    case "retry":
      // Per spec: only set if value consists of ASCII digits only
      if (/^\d+$/.test(value)) {
        message.retry = parseInt(value, 10);
        return true;
      }
      return false;
    default:
      // Unknown fields are ignored per spec
      return false;
  }
}

/**
 * Transforms a byte stream of server-sent events into parsed message objects.
 *
 * This enables consuming server-sent events using the Fetch API instead of
 * {@linkcode EventSource}, which is useful when you need custom headers,
 * request bodies, or HTTP methods other than GET.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events}
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Basic usage with fetch
 * ```ts ignore
 * import { ServerSentEventParseStream } from "@std/http/unstable-server-sent-event-stream";
 *
 * const response = await fetch("https://example.com/sse", {
 *   headers: { "Authorization": "Bearer token" },
 * });
 *
 * const stream = response.body!
 *   .pipeThrough(new ServerSentEventParseStream());
 *
 * for await (const event of stream) {
 *   console.log(event.event, event.data);
 * }
 * ```
 *
 * @example Roundtrip with ServerSentEventStream
 * ```ts
 * import { ServerSentEventParseStream } from "@std/http/unstable-server-sent-event-stream";
 * import { ServerSentEventStream } from "@std/http/server-sent-event-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const original = [
 *   { data: "hello" },
 *   { event: "update", data: "world" },
 *   { id: "1", data: "with id" },
 * ];
 *
 * const encoded = ReadableStream.from(original)
 *   .pipeThrough(new ServerSentEventStream());
 *
 * const decoded = encoded.pipeThrough(new ServerSentEventParseStream());
 * const result = await Array.fromAsync(decoded);
 *
 * assertEquals(result, original);
 * ```
 *
 * @example Ignoring comments
 * ```ts
 * import { ServerSentEventParseStream } from "@std/http/unstable-server-sent-event-stream";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   new TextEncoder().encode(":keepalive\ndata: hello\n\n"),
 * ]).pipeThrough(new ServerSentEventParseStream({ ignoreComments: true }));
 *
 * const result = await Array.fromAsync(stream);
 *
 * assertEquals(result, [{ data: "hello" }]);
 * ```
 */
export class ServerSentEventParseStream
  extends TransformStream<Uint8Array, ServerSentEventParsedMessage> {
  /**
   * Constructs a new instance.
   *
   * @param options Options for the stream.
   */
  constructor(options: ServerSentEventParseStreamOptions = {}) {
    const { ignoreComments = false } = options;
    // Note: TextDecoder automatically strips the UTF-8 BOM (U+FEFF) from the
    // start of the stream per the WHATWG Encoding Standard, so we don't need
    // to handle it manually.
    const decoder = new TextDecoder();
    let buffer = "";
    let message: ServerSentEventParsedMessage = {};
    let hasFields = false;

    super({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });

        // Preserve trailing \r - it might be part of \r\n split across chunks
        let trailingCR = "";
        if (buffer[buffer.length - 1] === "\r") {
          trailingCR = "\r";
          buffer = buffer.slice(0, -1);
        }

        // Process complete lines
        const lines = buffer.split(NEWLINE_REGEXP);
        // Keep incomplete last line in buffer, restore any trailing \r
        buffer = lines.pop()! + trailingCR;

        for (const line of lines) {
          if (line === "") {
            // Empty line signals end of message - dispatch if non-empty
            if (hasFields) {
              controller.enqueue(message);
            }
            message = {};
            hasFields = false;
          } else if (parseLine(line, message, ignoreComments)) {
            hasFields = true;
          }
        }
      },

      flush(controller) {
        // Handle any remaining content in buffer
        buffer += decoder.decode();

        // Trailing \r at end of stream is a line ending
        if (buffer[buffer.length - 1] === "\r") {
          buffer = buffer.slice(0, -1);
          if (parseLine(buffer, message, ignoreComments)) {
            hasFields = true;
          }
          // The \r was a line ending, so dispatch if we have fields
          if (hasFields) {
            controller.enqueue(message);
            return;
          }
        } else if (buffer) {
          if (parseLine(buffer, message, ignoreComments)) {
            hasFields = true;
          }
        }

        // Dispatch final message if non-empty
        if (hasFields) {
          controller.enqueue(message);
        }
      },
    });
  }
}
