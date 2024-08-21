// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { concat } from "../bytes/mod.ts";
import { TarStream, type TarStreamInput } from "./tar_stream.ts";
import { UnTarStream } from "./untar_stream.ts";
import { assertEquals, assertRejects } from "../assert/mod.ts";

Deno.test("expandTarArchiveCheckingHeaders", async () => {
  const text = new TextEncoder().encode("Hello World!");

  const readable = ReadableStream.from<TarStreamInput>([
    {
      pathname: "./potato",
    },
    {
      pathname: "./text.txt",
      size: text.length,
      readable: ReadableStream.from([text]),
    },
  ])
    .pipeThrough(new TarStream())
    .pipeThrough(new UnTarStream());

  const pathnames: string[] = [];
  for await (const item of readable) {
    if (item.type === "header") pathnames.push(item.pathname);
  }
  assertEquals(pathnames, ["./potato", "./text.txt"]);
});

Deno.test("expandTarArchiveCheckingBodies", async () => {
  const text = new TextEncoder().encode("Hello World!");

  const readable = ReadableStream.from<TarStreamInput>([
    {
      pathname: "./potato",
    },
    {
      pathname: "./text.txt",
      size: text.length,
      readable: ReadableStream.from([text.slice()]),
    },
  ])
    .pipeThrough(new TarStream())
    .pipeThrough(new UnTarStream());

  const buffer = new Uint8Array(text.length);
  let offset = 0;
  for await (const item of readable) {
    if (item.type === "data") {
      buffer.set(item.data, offset);
      offset += item.data.length;
    }
  }
  assertEquals(buffer, text);
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
      readable: ReadableStream.from([data.slice()]),
    },
  ])
    .pipeThrough(new TarStream())
    .pipeThrough(new UnTarStream());

  assertEquals(
    concat(
      (await Array.fromAsync(readable)).filter((x) => x.type === "data").map(
        (x) => x.data,
      ),
    ),
    data,
  );
});

Deno.test("UnTarStream() with invalid size", async () => {
  const readable = ReadableStream.from<TarStreamInput>([
    {
      pathname: "newFile.txt",
      size: 512,
      readable: ReadableStream.from([new Uint8Array(512).fill(97)]),
    },
  ])
    .pipeThrough(new TarStream())
    .pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        flush(controller) {
          controller.enqueue(new Uint8Array(100));
        },
      }),
    )
    .pipeThrough(new UnTarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    Error,
    "Tarball has an unexpected number of bytes",
  );
});

Deno.test("UnTarStream() with invalid ending", async () => {
  const tarBytes = concat(
    await Array.fromAsync(
      ReadableStream.from<TarStreamInput>([
        {
          pathname: "newFile.txt",
          size: 512,
          readable: ReadableStream.from([new Uint8Array(512).fill(97)]),
        },
      ])
        .pipeThrough(new TarStream()),
    ),
  );
  tarBytes[tarBytes.length - 1] = 1;

  const readable = ReadableStream.from([tarBytes])
    .pipeThrough(new UnTarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    Error,
    "Tarball has invalid ending",
  );
});

Deno.test("UnTarStream() with too small size", async () => {
  const readable = ReadableStream.from([new Uint8Array(512)])
    .pipeThrough(new UnTarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    Error,
    "Tarball was too small to be valid",
  );
});

Deno.test("UnTarStream() with invalid checksum", async () => {
  const tarBytes = concat(
    await Array.fromAsync(
      ReadableStream.from<TarStreamInput>([
        {
          pathname: "newFile.txt",
          size: 512,
          readable: ReadableStream.from([new Uint8Array(512).fill(97)]),
        },
      ])
        .pipeThrough(new TarStream()),
    ),
  );
  tarBytes[148] = 97;

  const readable = ReadableStream.from([tarBytes])
    .pipeThrough(new UnTarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    Error,
    "Tarball header failed to pass checksum",
  );
});
