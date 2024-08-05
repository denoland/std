// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { TarStream, type TarStreamInput } from "./tar_stream.ts";
import { UnTarStream } from "./untar_stream.ts";
import { assertEquals } from "../assert/mod.ts";

Deno.test("expandTarArchiveCheckingHeaders", async function () {
  const text = new TextEncoder().encode("Hello World!");

  const readable = ReadableStream.from([
    {
      pathname: "./potato",
    },
    {
      pathname: "./text.txt",
      size: text.length,
      iterable: [text],
    },
  ])
    .pipeThrough(new TarStream())
    .pipeThrough(new UnTarStream());

  const pathnames: string[] = [];
  for await (const item of readable) {
    pathnames.push(item.pathname);
    item.readable?.cancel();
  }
  assertEquals(pathnames, ["potato/", "text.txt"]);
});

Deno.test("expandTarArchiveCheckingBodiesDefaultStream", async function () {
  const text = new TextEncoder().encode("Hello World!");

  const readable = ReadableStream.from([
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
    .pipeThrough(new UnTarStream());

  for await (const item of readable) {
    if (item.readable) {
      const buffer = new Uint8Array(text.length);
      let offset = 0;
      const reader = item.readable.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer.set(value, offset);
        offset += value.length;
      }
      assertEquals(buffer, text);
    }
  }
});

Deno.test("expandTarArchiveCheckingBodiesByteStream", async function () {
  const text = new TextEncoder().encode("Hello World!");

  const readable = ReadableStream.from([
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
    .pipeThrough(new UnTarStream());

  for await (const item of readable) {
    if (item.readable) {
      const buffer = new Uint8Array(text.length);
      let offset = 0;
      const reader = item.readable.getReader({ mode: "byob" });
      while (true) {
        const { done, value } = await reader.read(
          new Uint8Array(Math.ceil(Math.random() * 1024)),
        );
        if (done) {
          break;
        }
        buffer.set(value, offset);
        offset += value.length;
      }
      assertEquals(buffer, text);
    }
  }
});

Deno.test("UnTarStream() with size equals to multiple of 512", async () => {
  const size = 512 * 3;
  const data = Uint8Array.from(
    { length: size },
    () => Math.floor(Math.random() * 256),
  );

  const readable = ReadableStream.from<TarStreamInput>([
    {
      pathname: "name",
      size,
      iterable: [data.slice()],
    },
  ])
    .pipeThrough(new TarStream())
    .pipeThrough(new UnTarStream());

  for await (const item of readable) {
    if (item.readable) {
      assertEquals(
        Uint8Array.from(
          (await Array.fromAsync(item.readable)).map((x) => [...x]).flat(),
        ),
        data,
      );
    }
  }
});
