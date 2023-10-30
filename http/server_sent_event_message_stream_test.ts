// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/assert_equals.ts";
import {
  type ServerSentEventMessage,
  ServerSentEventMessageStream,
} from "./server_sent_event_message_stream.ts";

Deno.test("ServerSentEventMessageStream() enqueues a stringified server-sent event message object", async () => {
  const stream = ReadableStream.from<ServerSentEventMessage>([{
    comment: "a",
    event: "b",
    data: "c\nd",
    id: "123",
    retry: 456,
  }]).pipeThrough(new ServerSentEventMessageStream());
  let chunks = "";
  for await (const chunk of stream) chunks += chunk;

  assertEquals(
    chunks,
    `:a\nevent:b\ndata:c\ndata:d\nid:123\nretry:456\n\n`,
  );
});
