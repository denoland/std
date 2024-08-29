// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { concat } from "../bytes/mod.ts";
import { TarStream, type TarStreamInput } from "./tar_stream.ts";
import {
  type OldStyleFormat,
  type PosixUstarFormat,
  UntarStream,
} from "./untar_stream.ts";
import { assertEquals, assertRejects } from "../assert/mod.ts";

Deno.test("expandTarArchiveCheckingHeaders", async () => {
  const text = new TextEncoder().encode("Hello World!");
  const seconds = Math.floor(Date.now() / 1000);

  const readable = ReadableStream.from<TarStreamInput>([
    {
      path: "./potato",
      options: {
        mode: 111111,
        uid: 12,
        gid: 21,
        mtime: seconds,
        uname: "potato",
        gname: "cake",
        devmajor: "ice",
        devminor: "scream",
      },
    },
    {
      path: "./text.txt",
      size: text.length,
      readable: ReadableStream.from([text.slice()]),
      options: { mtime: seconds },
    },
  ])
    .pipeThrough(new TarStream())
    .pipeThrough(new UntarStream());

  const headers: (OldStyleFormat | PosixUstarFormat)[] = [];
  for await (const item of readable) {
    headers.push(item.header);
    await item.readable?.cancel();
  }
  assertEquals(headers, [{
    name: "./potato",
    mode: 111111,
    uid: 12,
    gid: 21,
    mtime: seconds,
    uname: "potato",
    gname: "cake",
    devmajor: "ice",
    devminor: "scream",
    size: 0,
    typeflag: "5",
    linkname: "",
    magic: "ustar\0",
    version: "00",
    prefix: "",
  }, {
    name: "./text.txt",
    mode: 644,
    uid: 0,
    gid: 0,
    mtime: seconds,
    uname: "",
    gname: "",
    devmajor: "",
    devminor: "",
    size: text.length,
    typeflag: "0",
    linkname: "",
    magic: "ustar\0",
    version: "00",
    prefix: "",
  }]);
});

Deno.test("expandTarArchiveCheckingBodies", async () => {
  const text = new TextEncoder().encode("Hello World!");

  const readable = ReadableStream.from<TarStreamInput>([
    {
      path: "./potato",
    },
    {
      path: "./text.txt",
      size: text.length,
      readable: ReadableStream.from([text.slice()]),
    },
  ])
    .pipeThrough(new TarStream())
    .pipeThrough(new UntarStream());

  let buffer = new Uint8Array();
  for await (const item of readable) {
    if (item.readable) {
      buffer = concat(await Array.fromAsync(item.readable));
    }
  }
  assertEquals(buffer, text);
});

Deno.test("UntarStream() with size equals to multiple of 512", async () => {
  const size = 512 * 3;
  const data = Uint8Array.from(
    { length: size },
    () => Math.floor(Math.random() * 256),
  );

  const readable = ReadableStream.from<TarStreamInput>([
    {
      path: "name",
      size,
      readable: ReadableStream.from([data.slice()]),
    },
  ])
    .pipeThrough(new TarStream())
    .pipeThrough(new UntarStream());

  let buffer = new Uint8Array();
  for await (const entry of readable) {
    if (entry.readable) {
      buffer = concat(await Array.fromAsync(entry.readable));
    }
  }
  assertEquals(buffer, data);
});

Deno.test("UntarStream() with invalid size", async () => {
  const readable = ReadableStream.from<TarStreamInput>([
    {
      path: "newFile.txt",
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
    .pipeThrough(new UntarStream());

  await assertRejects(
    async () => {
      for await (const entry of readable) {
        if (entry.readable) {
          // deno-lint-ignore no-empty
          for await (const _ of entry.readable) {}
        }
      }
    },
    RangeError,
    "Tarball has an unexpected number of bytes",
  );
});

Deno.test("UntarStream() with invalid ending", async () => {
  const tarBytes = concat(
    await Array.fromAsync(
      ReadableStream.from<TarStreamInput>([
        {
          path: "newFile.txt",
          size: 512,
          readable: ReadableStream.from([new Uint8Array(512).fill(97)]),
        },
      ])
        .pipeThrough(new TarStream()),
    ),
  );
  tarBytes[tarBytes.length - 1] = 1;

  const readable = ReadableStream.from([tarBytes])
    .pipeThrough(new UntarStream());

  await assertRejects(
    async () => {
      for await (const entry of readable) {
        if (entry.readable) {
          // deno-lint-ignore no-empty
          for await (const _ of entry.readable) {}
        }
      }
    },
    TypeError,
    "Tarball has invalid ending",
  );
});

Deno.test("UntarStream() with too small size", async () => {
  const readable = ReadableStream.from([new Uint8Array(512)])
    .pipeThrough(new UntarStream());

  await assertRejects(
    async () => {
      for await (const entry of readable) {
        if (entry.readable) {
          // deno-lint-ignore no-empty
          for await (const _ of entry.readable) {}
        }
      }
    },
    RangeError,
    "Tarball was too small to be valid",
  );
});

Deno.test("UntarStream() with invalid checksum", async () => {
  const tarBytes = concat(
    await Array.fromAsync(
      ReadableStream.from<TarStreamInput>([
        {
          path: "newFile.txt",
          size: 512,
          readable: ReadableStream.from([new Uint8Array(512).fill(97)]),
        },
      ])
        .pipeThrough(new TarStream()),
    ),
  );
  tarBytes[148] = 97;

  const readable = ReadableStream.from([tarBytes])
    .pipeThrough(new UntarStream());

  await assertRejects(
    async () => {
      for await (const entry of readable) {
        if (entry.readable) {
          // deno-lint-ignore no-empty
          for await (const _ of entry.readable) {}
        }
      }
    },
    Error,
    "Tarball header failed to pass checksum",
  );
});
