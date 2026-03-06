// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertRejects } from "@std/assert";
import {
  type ServerSentEventMessage,
  ServerSentEventStream,
} from "./server_sent_event_stream.ts";

function createStream(
  messages: ServerSentEventMessage[],
): ReadableStream<string> {
  return ReadableStream
    .from<ServerSentEventMessage>(messages)
    .pipeThrough(new ServerSentEventStream())
    .pipeThrough(new TextDecoderStream());
}

Deno.test("ServerSentEventStream enqueues a stringified server-sent event message object", async () => {
  const stream = createStream([
    {
      comment: "a",
      event: "b",
      data: "c\nd\re\r\nf",
      id: "123",
      retry: 456,
    },
    {
      comment: "a",
    },
    {
      event: "b",
    },
    {
      data: "c\nd\re\r\nf",
    },
    {
      id: "123",
    },
    {
      id: 123,
    },
    {
      retry: 456,
    },
  ]);
  const clientMessages = await Array.fromAsync(stream);

  assertEquals(
    clientMessages,
    [
      ":a\nevent:b\ndata:c\ndata:d\ndata:e\ndata:f\nid:123\nretry:456\n\n",
      ":a\n\n",
      "event:b\n\n",
      "data:c\ndata:d\ndata:e\ndata:f\n\n",
      "id:123\n\n",
      "id:123\n\n",
      "retry:456\n\n",
    ],
  );
});

Deno.test("ServerSentEventStream throws if single-line fields contain a newline", async () => {
  // Comment
  await assertRejects(
    async () => await createStream([{ comment: "a\n" }]).getReader().read(),
    SyntaxError,
    "`message.comment` cannot contain a newline",
  );

  await assertRejects(
    async () => await createStream([{ comment: "a\r" }]).getReader().read(),
    SyntaxError,
    "`message.comment` cannot contain a newline",
  );

  await assertRejects(
    async () => await createStream([{ comment: "a\n\r" }]).getReader().read(),
    SyntaxError,
    "`message.comment` cannot contain a newline",
  );

  // Event
  await assertRejects(
    async () => await createStream([{ event: "a\n" }]).getReader().read(),
    SyntaxError,
    "`message.event` cannot contain a newline",
  );

  await assertRejects(
    async () => await createStream([{ event: "a\r" }]).getReader().read(),
    SyntaxError,
    "`message.event` cannot contain a newline",
  );

  await assertRejects(
    async () => await createStream([{ event: "a\n\r" }]).getReader().read(),
    SyntaxError,
    "`message.event` cannot contain a newline",
  );

  // ID
  await assertRejects(
    async () => await createStream([{ id: "a\n" }]).getReader().read(),
    SyntaxError,
    "`message.id` cannot contain a newline",
  );

  await assertRejects(
    async () => await createStream([{ id: "a\r" }]).getReader().read(),
    SyntaxError,
    "`message.id` cannot contain a newline",
  );

  await assertRejects(
    async () => await createStream([{ id: "a\n\r" }]).getReader().read(),
    SyntaxError,
    "`message.id` cannot contain a newline",
  );
});
