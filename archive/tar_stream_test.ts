// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { TarStream } from "./tar_stream.ts";
import { assertEquals } from "../assert/mod.ts";

Deno.test("createTarArchiveDefaultStream", async function () {
  const text = new TextEncoder().encode("Hello World!");

  const reader = ReadableStream.from([
    {
      pathname: "./potato",
    },
    {
      pathname: "./text.txt",
      size: text.length,
      iterable: [text.slice()],
    },
  ])
    .pipeThrough(new TarStream())
    .getReader();

  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    size += value.length;
  }
  assertEquals(size, 512 + 512 + Math.ceil(text.length / 512) * 512 + 1024);
});

Deno.test("createTarArchiveByteStream", async function () {
  const text = new TextEncoder().encode("Hello World!");

  const reader = ReadableStream.from([
    {
      pathname: "./potato",
    },
    {
      pathname: "./text.txt",
      size: text.length,
      iterable: [text.slice()],
    },
  ])
    .pipeThrough(new TarStream())
    .getReader({ mode: "byob" });

  let size = 0;
  while (true) {
    const { done, value } = await reader.read(
      new Uint8Array(Math.ceil(Math.random() * 1024)),
    );
    if (done) {
      break;
    }
    size += value.length;
  }
  assertEquals(size, 512 + 512 + Math.ceil(text.length / 512) * 512 + 1024);
});
