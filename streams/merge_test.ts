// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import {
  earlyZipReadableStreams,
  mergeReadableStreams,
  zipReadableStreams,
} from "./merge.ts";
import { assertEquals } from "../testing/asserts.ts";

Deno.test("mergeReadableStreams", async () => {
  const textStream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("qwertzuiopasd");
      controller.enqueue("mnbvcxylkjhgfds");
      controller.enqueue("apoiuztrewq0987654321");
      controller.close();
    },
  });

  const textStream2 = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("mnbvcxylkjhgfds");
      controller.enqueue("apoiuztrewq0987654321");
      controller.enqueue("qwertzuiopasd");
      controller.close();
    },
  });

  const buf = [];
  for await (const s of mergeReadableStreams(textStream, textStream2)) {
    buf.push(s);
  }

  assertEquals(buf.sort(), [
    "apoiuztrewq0987654321",
    "apoiuztrewq0987654321",
    "mnbvcxylkjhgfds",
    "mnbvcxylkjhgfds",
    "qwertzuiopasd",
    "qwertzuiopasd",
  ]);
});

Deno.test("zipReadableStreams", async () => {
  const textStream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("qwertzuiopasd");
      controller.enqueue("mnbvcxylkjhgfds");
      controller.enqueue("apoiuztrewq0987321");
      controller.close();
    },
  });

  const textStream2 = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("mnbvcxylkjhgfdsewr");
      controller.enqueue("apoiuztrewq0987654321");
      controller.enqueue("qwertzuiopasq123d");
      controller.close();
    },
  });

  const buf = [];
  for await (const s of zipReadableStreams(textStream, textStream2)) {
    buf.push(s);
  }

  assertEquals(buf, [
    "qwertzuiopasd",
    "mnbvcxylkjhgfdsewr",
    "mnbvcxylkjhgfds",
    "apoiuztrewq0987654321",
    "apoiuztrewq0987321",
    "qwertzuiopasq123d",
  ]);
});

Deno.test("earlyZipReadableStreams short first", async () => {
  const textStream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("1");
      controller.enqueue("2");
      controller.enqueue("3");
      controller.close();
    },
  });

  const textStream2 = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("a");
      controller.enqueue("b");
      controller.enqueue("c");
      controller.enqueue("d");
      controller.enqueue("e");
      controller.close();
    },
  });

  const buf = [];
  for await (const s of earlyZipReadableStreams(textStream, textStream2)) {
    buf.push(s);
  }

  assertEquals(buf, [
    "1",
    "a",
    "2",
    "b",
    "3",
    "c",
  ]);
});

Deno.test("earlyZipReadableStreams long first", async () => {
  const textStream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("a");
      controller.enqueue("b");
      controller.enqueue("c");
      controller.enqueue("d");
      controller.enqueue("e");
      controller.close();
    },
  });

  const textStream2 = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("1");
      controller.enqueue("2");
      controller.enqueue("3");
      controller.close();
    },
  });

  const buf = [];
  for await (const s of earlyZipReadableStreams(textStream, textStream2)) {
    buf.push(s);
  }

  assertEquals(buf, [
    "a",
    "1",
    "b",
    "2",
    "c",
    "3",
    "d",
  ]);
});
