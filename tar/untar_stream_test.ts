// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects } from "@std/assert";
import { toBytes } from "@std/streams/unstable-to-bytes";
import { TarStream, type TarStreamInput } from "./tar_stream.ts";
import {
  type OldStyleFormat,
  type PosixUstarFormat,
  UntarStream,
} from "./untar_stream.ts";

Deno.test("expandTarArchiveCheckingHeaders", async () => {
  const text = new TextEncoder().encode("Hello World!");
  const seconds = Math.floor(Date.now() / 1000);

  const readable = ReadableStream.from<TarStreamInput>([
    {
      type: "directory",
      path: "./potato",
      options: {
        mode: 0o111111,
        uid: 0o12,
        gid: 0o21,
        mtime: seconds,
        uname: "potato",
        gname: "cake",
        devmajor: "ice",
        devminor: "scream",
      },
    },
    {
      type: "file",
      path: "./text.txt",
      size: text.length,
      readable: ReadableStream.from([text.slice()]),
      options: { mtime: seconds },
    },
  ])
    .pipeThrough(new TarStream())
    .pipeThrough(new UntarStream());

  const headers: (OldStyleFormat | PosixUstarFormat)[] = [];
  for await (const entry of readable) {
    headers.push(entry.header);
    await entry.readable?.cancel();
  }
  assertEquals(headers, [{
    name: "./potato",
    mode: 0o111111,
    uid: 0o12,
    gid: 0o21,
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
    mode: 0o644,
    uid: 0o0,
    gid: 0o0,
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
      type: "directory",
      path: "./potato",
    },
    {
      type: "file",
      path: "./text.txt",
      size: text.length,
      readable: ReadableStream.from([text.slice()]),
    },
  ])
    .pipeThrough(new TarStream())
    .pipeThrough(new UntarStream());

  let buffer: Uint8Array = new Uint8Array();
  for await (const item of readable) {
    if (item.readable) buffer = await toBytes(item.readable);
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
      type: "file",
      path: "name",
      size,
      readable: ReadableStream.from([data.slice()]),
    },
  ])
    .pipeThrough(new TarStream())
    .pipeThrough(new UntarStream());

  let buffer: Uint8Array = new Uint8Array();
  for await (const entry of readable) {
    if (entry.readable) buffer = await toBytes(entry.readable);
  }
  assertEquals(buffer, data);
});

Deno.test("UntarStream() with invalid size", async () => {
  const bytes = (await toBytes(
    ReadableStream.from<TarStreamInput>([
      {
        type: "file",
        path: "newFile.txt",
        size: 512,
        readable: ReadableStream.from([new Uint8Array(512).fill(97)]),
      },
    ])
      .pipeThrough(new TarStream()),
  )).slice(0, -100);

  const readable = ReadableStream.from([bytes])
    .pipeThrough(new UntarStream());

  await assertRejects(
    async () => {
      for await (const entry of readable) await entry.readable?.cancel();
    },
    RangeError,
    "Cannot extract the tar archive: The tarball chunk has an unexpected number of bytes (412)",
  );
});

Deno.test("UntarStream() with invalid ending", async () => {
  const tarBytes = await toBytes(
    ReadableStream.from<TarStreamInput>([
      {
        type: "file",
        path: "newFile.txt",
        size: 512,
        readable: ReadableStream.from([new Uint8Array(512).fill(97)]),
      },
    ])
      .pipeThrough(new TarStream()),
  );
  tarBytes[tarBytes.length - 1] = 1;

  const readable = ReadableStream.from([tarBytes])
    .pipeThrough(new UntarStream());

  await assertRejects(
    async () => {
      for await (const entry of readable) await entry.readable?.cancel();
    },
    TypeError,
    "Cannot extract the tar archive: The tarball has invalid ending",
  );
});

Deno.test("UntarStream() with too small size", async () => {
  const readable = ReadableStream.from([new Uint8Array(512)])
    .pipeThrough(new UntarStream());

  await assertRejects(
    async () => {
      for await (const entry of readable) await entry.readable?.cancel();
    },
    RangeError,
    "Cannot extract the tar archive: The tarball is too small to be valid",
  );
});

Deno.test("UntarStream() with invalid checksum", async () => {
  const tarBytes = await toBytes(
    ReadableStream.from<TarStreamInput>([
      {
        type: "file",
        path: "newFile.txt",
        size: 512,
        readable: ReadableStream.from([new Uint8Array(512).fill(97)]),
      },
    ])
      .pipeThrough(new TarStream()),
  );
  tarBytes[148] = 97;

  const readable = ReadableStream.from([tarBytes])
    .pipeThrough(new UntarStream());

  await assertRejects(
    async () => {
      for await (const entry of readable) await entry.readable?.cancel();
    },
    Error,
    "Cannot extract the tar archive: An archive entry has invalid header checksum",
  );
});

Deno.test("UntarStream() with extra bytes", async () => {
  const readable = ReadableStream.from<TarStreamInput>([
    {
      type: "directory",
      path: "a",
    },
  ])
    .pipeThrough(new TarStream())
    .pipeThrough(
      new TransformStream({
        flush(controller) {
          controller.enqueue(new Uint8Array(512 * 2).fill(1));
        },
      }),
    )
    .pipeThrough(new UntarStream());

  for await (const entry of readable) {
    assertEquals(entry.path, "a");
    entry.readable?.cancel();
  }
});

Deno.test("UntarStream() with extra checksum digits", async () => {
  const bytes = await toBytes(
    ReadableStream.from<TarStreamInput>([
      { type: "directory", path: "a" },
    ]).pipeThrough(new TarStream()),
  );

  for await (
    const entry of ReadableStream
      .from([bytes.slice()])
      .pipeThrough(new UntarStream())
  ) {
    assertEquals(entry.path, "a");
    entry.readable?.cancel();
  }

  bytes.set(bytes.subarray(148, 156 - 2), 148 + 1); // Copy 6 octal digits of checksum and make it seven sigits. Assuming first digit is zero
  for await (
    const entry of ReadableStream
      .from([bytes.slice()])
      .pipeThrough(new UntarStream())
  ) {
    assertEquals(entry.path, "a");
    entry.readable?.cancel();
  }
});
