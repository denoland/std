// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import {
  TarStream,
  type TarStreamInput,
  validTarStreamOptions,
} from "./tar_stream.ts";
import { assert, assertEquals, assertRejects } from "../assert/mod.ts";
import { UntarStream } from "./untar_stream.ts";
import { concat } from "../bytes/mod.ts";

Deno.test("TarStream() with default stream", async () => {
  const text = new TextEncoder().encode("Hello World!");

  const reader = ReadableStream.from<TarStreamInput>([
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
    .getReader();

  let size = 0;
  const data: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    size += value.length;
    data.push(value);
  }
  assertEquals(size, 512 + 512 + Math.ceil(text.length / 512) * 512 + 1024);
  assertEquals(
    text,
    concat(data).slice(
      512 + // Slicing off ./potato header
        512, // Slicing off ./text.txt header
      -1024, // Slicing off 1024 bytes of end padding
    )
      .slice(0, text.length), // Slice off padding added to text to make it divisible by 512
  );
});

Deno.test("TarStream() with byte stream", async () => {
  const text = new TextEncoder().encode("Hello World!");

  const reader = ReadableStream.from<TarStreamInput>([
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
    .getReader({ mode: "byob" });

  let size = 0;
  const data: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read(
      new Uint8Array(Math.ceil(Math.random() * 1024)),
    );
    if (done) {
      break;
    }
    size += value.length;
    data.push(value);
  }
  assertEquals(size, 512 + 512 + Math.ceil(text.length / 512) * 512 + 1024);
  assertEquals(
    text,
    concat(data).slice(
      512 + // Slicing off ./potato header
        512, // Slicing off ./text.txt header
      -1024, // Slicing off 1024 bytes of end padding
    )
      .slice(0, text.length), // Slice off padding added to text to make it divisible by 512
  );
});

Deno.test("TarStream() with negative size", async () => {
  const text = new TextEncoder().encode("Hello World");

  const readable = ReadableStream.from<TarStreamInput>([
    {
      pathname: "name",
      size: -text.length,
      readable: ReadableStream.from([text.slice()]),
    },
  ])
    .pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    Error,
    "Size cannot exceed 64 Gibs",
  );
});

Deno.test("TarStream() with 65 GiB size", async () => {
  const size = 1024 ** 3 * 65;
  const step = 1024; // Size must equally be divisible by step
  const iterable = function* () {
    for (let i = 0; i < size; i += step) {
      yield new Uint8Array(step).map(() => Math.floor(Math.random() * 256));
    }
  }();

  const readable = ReadableStream.from<TarStreamInput>([
    {
      pathname: "name",
      size,
      readable: ReadableStream.from(iterable),
    },
  ])
    .pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    Error,
    "Size cannot exceed 64 Gibs",
  );
});

Deno.test("TarStream() with NaN size", async () => {
  const size = NaN;
  const step = 1024; // Size must equally be divisible by step
  const iterable = function* () {
    for (let i = 0; i < size; i += step) {
      yield new Uint8Array(step).map(() => Math.floor(Math.random() * 256));
    }
  }();

  const readable = ReadableStream.from<TarStreamInput>([
    {
      pathname: "name",
      size,
      readable: ReadableStream.from(iterable),
    },
  ])
    .pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    Error,
    "Size cannot exceed 64 Gibs",
  );
});

Deno.test("parsePathname()", async () => {
  const readable = ReadableStream.from<TarStreamInput>([
    {
      pathname:
        "./Veeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeery/LongPath",
    },
    {
      pathname:
        "./some random path/with/loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong/path",
    },
    {
      pathname:
        "./some random path/with/loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong/file",
    },
    {
      pathname:
        "./some random path/with/loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong/file",
    },
  ])
    .pipeThrough(new TarStream())
    .pipeThrough(new UntarStream());

  const output = [
    "./Veeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeery/LongPath",
    "./some random path/with/loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong/path",
    "./some random path/with/loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong/file",
    "./some random path/with/loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong/file",
  ];
  for await (const tarChunk of readable) {
    assert(tarChunk.type === "header");
    assertEquals(tarChunk.pathname, output.shift());
  }
});

Deno.test("validTarStreamOptions()", () => {
  assertEquals(validTarStreamOptions({}), true);

  assertEquals(validTarStreamOptions({ mode: 0 }), true);
  assertEquals(validTarStreamOptions({ mode: 8 }), false);
  assertEquals(validTarStreamOptions({ mode: 1111111 }), false);

  assertEquals(validTarStreamOptions({ uid: 0 }), true);
  assertEquals(validTarStreamOptions({ uid: 8 }), false);
  assertEquals(validTarStreamOptions({ uid: 1111111 }), false);

  assertEquals(validTarStreamOptions({ gid: 0 }), true);
  assertEquals(validTarStreamOptions({ gid: 8 }), false);
  assertEquals(validTarStreamOptions({ gid: 1111111 }), false);

  assertEquals(validTarStreamOptions({ mtime: 0 }), true);
  assertEquals(validTarStreamOptions({ mtime: NaN }), false);
  assertEquals(
    validTarStreamOptions({ mtime: Math.floor(new Date().getTime() / 1000) }),
    true,
  );
  assertEquals(validTarStreamOptions({ mtime: new Date().getTime() }), false);

  assertEquals(validTarStreamOptions({ uname: "" }), true);
  assertEquals(validTarStreamOptions({ uname: "abcdef" }), true);
  assertEquals(validTarStreamOptions({ uname: "å-abcdef" }), false);
  assertEquals(validTarStreamOptions({ uname: "a".repeat(100) }), false);

  assertEquals(validTarStreamOptions({ gname: "" }), true);
  assertEquals(validTarStreamOptions({ gname: "abcdef" }), true);
  assertEquals(validTarStreamOptions({ gname: "å-abcdef" }), false);
  assertEquals(validTarStreamOptions({ gname: "a".repeat(100) }), false);

  assertEquals(validTarStreamOptions({ devmajor: "" }), true);
  assertEquals(validTarStreamOptions({ devmajor: "1234" }), true);
  assertEquals(validTarStreamOptions({ devmajor: "123456789" }), false);

  assertEquals(validTarStreamOptions({ devminor: "" }), true);
  assertEquals(validTarStreamOptions({ devminor: "1234" }), true);
  assertEquals(validTarStreamOptions({ devminor: "123456789" }), false);
});

Deno.test("TarStream() with invalid options", async () => {
  const readable = ReadableStream.from<TarStreamInput>([
    { pathname: "potato", options: { mode: 9 } },
  ]).pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    Error,
    "Invalid TarStreamOptions Provided",
  );
});

Deno.test("TarStream() with mismatching sizes", async () => {
  const text = new TextEncoder().encode("Hello World!");
  const readable = ReadableStream.from<TarStreamInput>([
    {
      pathname: "potato",
      size: text.length + 1,
      readable: ReadableStream.from([text.slice()]),
    },
  ]).pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    RangeError,
    "Provided size did not match bytes read from provided readable",
  );
});

Deno.test("parsePathname() with too long path", async () => {
  const readable = ReadableStream.from<TarStreamInput>([{
    pathname: "0".repeat(300),
  }])
    .pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    RangeError,
    "Pathname cannot exceed 256 bytes",
  );
});

Deno.test("parsePathname() with too long path", async () => {
  const readable = ReadableStream.from<TarStreamInput>([{
    pathname: "0".repeat(160) + "/",
  }])
    .pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    Error,
    "Pathname needs to be split-able on a forward slash separator into [155, 100] bytes respectively",
  );
});
