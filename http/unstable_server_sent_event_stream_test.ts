// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import {
  type ServerSentEventParsedMessage,
  ServerSentEventParseStream,
} from "./unstable_server_sent_event_stream.ts";
import {
  type ServerSentEventMessage,
  ServerSentEventStream,
} from "./server_sent_event_stream.ts";

/** Helper to parse SSE from raw string chunks */
function parseStream(
  chunks: string[],
): ReadableStream<ServerSentEventParsedMessage> {
  const encoder = new TextEncoder();
  return ReadableStream
    .from(chunks.map((chunk) => encoder.encode(chunk)))
    .pipeThrough(new ServerSentEventParseStream());
}

/** Helper to roundtrip through encode then decode */
function roundtrip(
  messages: ServerSentEventMessage[],
): ReadableStream<ServerSentEventParsedMessage> {
  return ReadableStream
    .from(messages)
    .pipeThrough(new ServerSentEventStream())
    .pipeThrough(new ServerSentEventParseStream());
}

Deno.test("ServerSentEventParseStream parses data field", async () => {
  const result = await Array.fromAsync(parseStream([
    "data: hello\n\n",
  ]));

  assertEquals(result, [{ data: "hello" }]);
});

Deno.test("ServerSentEventParseStream parses data field without space after colon", async () => {
  const result = await Array.fromAsync(parseStream([
    "data:hello\n\n",
  ]));

  assertEquals(result, [{ data: "hello" }]);
});

Deno.test("ServerSentEventParseStream parses multiple data lines", async () => {
  const result = await Array.fromAsync(parseStream([
    "data: line1\ndata: line2\ndata: line3\n\n",
  ]));

  assertEquals(result, [{ data: "line1\nline2\nline3" }]);
});

Deno.test("ServerSentEventParseStream parses event field", async () => {
  const result = await Array.fromAsync(parseStream([
    "event: update\ndata: payload\n\n",
  ]));

  assertEquals(result, [{ event: "update", data: "payload" }]);
});

Deno.test("ServerSentEventParseStream parses id field", async () => {
  const result = await Array.fromAsync(parseStream([
    "id: 123\ndata: payload\n\n",
  ]));

  assertEquals(result, [{ id: "123", data: "payload" }]);
});

Deno.test("ServerSentEventParseStream parses id field as string", async () => {
  const result = await Array.fromAsync(parseStream([
    "id: abc\n\n",
  ]));

  assertEquals(result, [{ id: "abc" }]);
  assertEquals(typeof result[0]!.id, "string");
});

Deno.test("ServerSentEventParseStream ignores id with null character", async () => {
  const result = await Array.fromAsync(parseStream([
    "id: abc\0def\ndata: test\n\n",
  ]));

  assertEquals(result, [{ data: "test" }]);
});

Deno.test("ServerSentEventParseStream parses retry field", async () => {
  const result = await Array.fromAsync(parseStream([
    "retry: 3000\n\n",
  ]));

  assertEquals(result, [{ retry: 3000 }]);
});

Deno.test("ServerSentEventParseStream ignores non-numeric retry", async () => {
  const result = await Array.fromAsync(parseStream([
    "retry: abc\ndata: test\n\n",
  ]));

  assertEquals(result, [{ data: "test" }]);
});

Deno.test("ServerSentEventParseStream parses comment lines", async () => {
  const result = await Array.fromAsync(parseStream([
    ":this is a comment\n\n",
  ]));

  assertEquals(result, [{ comment: "this is a comment" }]);
});

Deno.test("ServerSentEventParseStream parses multiple comment lines", async () => {
  const result = await Array.fromAsync(parseStream([
    ":comment 1\n:comment 2\n\n",
  ]));

  assertEquals(result, [{ comment: "comment 1\ncomment 2" }]);
});

Deno.test("ServerSentEventParseStream parses all fields together", async () => {
  const result = await Array.fromAsync(parseStream([
    ":comment\nevent: type\ndata: payload\nid: 1\nretry: 1000\n\n",
  ]));

  assertEquals(result, [{
    comment: "comment",
    event: "type",
    data: "payload",
    id: "1",
    retry: 1000,
  }]);
});

Deno.test("ServerSentEventParseStream handles multiple messages", async () => {
  const result = await Array.fromAsync(parseStream([
    "data: first\n\ndata: second\n\n",
  ]));

  assertEquals(result, [{ data: "first" }, { data: "second" }]);
});

Deno.test("ServerSentEventParseStream handles chunked input", async () => {
  const result = await Array.fromAsync(parseStream([
    "da",
    "ta: hel",
    "lo\n",
    "\n",
  ]));

  assertEquals(result, [{ data: "hello" }]);
});

Deno.test("ServerSentEventParseStream handles CRLF line endings", async () => {
  const result = await Array.fromAsync(parseStream([
    "data: hello\r\n\r\n",
  ]));

  assertEquals(result, [{ data: "hello" }]);
});

Deno.test("ServerSentEventParseStream handles CR line endings", async () => {
  const result = await Array.fromAsync(parseStream([
    "data: hello\r\r",
  ]));

  assertEquals(result, [{ data: "hello" }]);
});

Deno.test("ServerSentEventParseStream handles mixed line endings", async () => {
  const result = await Array.fromAsync(parseStream([
    "data: one\ndata: two\r\ndata: three\r\n\n",
  ]));

  assertEquals(result, [{ data: "one\ntwo\nthree" }]);
});

Deno.test("ServerSentEventParseStream handles CRLF split across chunks", async () => {
  // \r at end of chunk 1, \n at start of chunk 2 should be ONE line ending
  const result = await Array.fromAsync(parseStream([
    ":comment\r",
    "\ndata: hello\n\n",
  ]));

  assertEquals(result, [{ comment: "comment", data: "hello" }]);
});

Deno.test("ServerSentEventParseStream handles standalone CR at chunk boundary", async () => {
  // \r at end of chunk 1 followed by non-\n should be a line ending
  const result = await Array.fromAsync(parseStream([
    "data: one\r",
    "data: two\n\n",
  ]));

  assertEquals(result, [{ data: "one\ntwo" }]);
});

Deno.test("ServerSentEventParseStream handles trailing CR at end of stream", async () => {
  const result = await Array.fromAsync(parseStream([
    "data: hello\r",
  ]));

  assertEquals(result, [{ data: "hello" }]);
});

Deno.test("ServerSentEventParseStream strips BOM from start", async () => {
  const result = await Array.fromAsync(parseStream([
    "\uFEFFdata: hello\n\n",
  ]));

  assertEquals(result, [{ data: "hello" }]);
});

Deno.test("ServerSentEventParseStream ignores empty messages", async () => {
  const result = await Array.fromAsync(parseStream([
    "\n\ndata: real\n\n\n\n",
  ]));

  assertEquals(result, [{ data: "real" }]);
});

Deno.test("ServerSentEventParseStream ignores unknown fields", async () => {
  const result = await Array.fromAsync(parseStream([
    "unknown: value\ndata: test\n\n",
  ]));

  assertEquals(result, [{ data: "test" }]);
});

Deno.test("ServerSentEventParseStream handles field without colon", async () => {
  const result = await Array.fromAsync(parseStream([
    "data\n\n",
  ]));

  assertEquals(result, [{ data: "" }]);
});

Deno.test("ServerSentEventParseStream handles empty data value", async () => {
  const result = await Array.fromAsync(parseStream([
    "data:\n\n",
  ]));

  assertEquals(result, [{ data: "" }]);
});

Deno.test("ServerSentEventParseStream handles data with leading space preserved", async () => {
  // Only ONE space after colon is removed
  const result = await Array.fromAsync(parseStream([
    "data:  two spaces\n\n",
  ]));

  assertEquals(result, [{ data: " two spaces" }]);
});

Deno.test("ServerSentEventParseStream handles flush with pending message", async () => {
  // No trailing newlines - message should be dispatched on flush
  const result = await Array.fromAsync(parseStream([
    "data: final",
  ]));

  assertEquals(result, [{ data: "final" }]);
});

Deno.test("ServerSentEventParseStream roundtrip with ServerSentEventStream", async () => {
  const original: ServerSentEventMessage[] = [
    { data: "hello" },
    { event: "update", data: "world" },
    { id: "1", data: "with id" },
    { retry: 3000 },
    { comment: "a comment" },
  ];

  const result = await Array.fromAsync(roundtrip(original));

  assertEquals(result, original);
});

Deno.test("ServerSentEventParseStream roundtrip with multiline data", async () => {
  const original: ServerSentEventMessage[] = [
    { data: "line1\nline2\nline3" },
  ];

  const result = await Array.fromAsync(roundtrip(original));

  assertEquals(result, original);
});

Deno.test("ServerSentEventParseStream roundtrip with all fields", async () => {
  const original: ServerSentEventMessage[] = [
    {
      comment: "test",
      event: "message",
      data: "payload",
      id: "123",
      retry: 5000,
    },
  ];

  const result = await Array.fromAsync(roundtrip(original));

  assertEquals(result, original);
});

Deno.test("ServerSentEventParseStream handles empty stream", async () => {
  const result = await Array.fromAsync(parseStream([]));

  assertEquals(result, []);
});

Deno.test("ServerSentEventParseStream handles stream with only whitespace", async () => {
  const result = await Array.fromAsync(parseStream(["\n\n\n"]));

  assertEquals(result, []);
});

Deno.test("ServerSentEventParseStream handles multi-byte UTF-8 split across chunks", async () => {
  // "data: 🦕\n\n" - the dinosaur emoji is 4 bytes (F0 9F A6 95)
  // Split it in the middle of the emoji
  const full = new TextEncoder().encode("data: 🦕\n\n");
  // Split after "data: " and first 2 bytes of emoji
  const chunk1 = full.slice(0, 8); // "data: " (6) + first 2 bytes of emoji
  const chunk2 = full.slice(8); // last 2 bytes of emoji + "\n\n"

  const stream = ReadableStream.from([chunk1, chunk2])
    .pipeThrough(new ServerSentEventParseStream());

  const result = await Array.fromAsync(stream);

  assertEquals(result, [{ data: "🦕" }]);
});

Deno.test("ServerSentEventParseStream handles multi-byte UTF-8 in various positions", async () => {
  const result = await Array.fromAsync(parseStream([
    "event: 日本語\ndata: Привет мир\nid: 中文\n\n",
  ]));

  assertEquals(result, [{
    event: "日本語",
    data: "Привет мир",
    id: "中文",
  }]);
});
