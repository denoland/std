// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { concat } from "@std/bytes";
import {
  assertValidTarStreamOptions,
  TarStream,
  type TarStreamInput,
} from "./tar_stream.ts";
import { UntarStream } from "./untar_stream.ts";

Deno.test("TarStream() with default stream", async () => {
  const text = new TextEncoder().encode("Hello World!");

  const reader = ReadableStream.from<TarStreamInput>([
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
      type: "file",
      path: "name",
      size: -text.length,
      readable: ReadableStream.from([text.slice()]),
    },
  ])
    .pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    RangeError,
    "Cannot add to the tar archive: The size cannot exceed 64 Gibs",
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
      type: "file",
      path: "name",
      size,
      readable: ReadableStream.from(iterable),
    },
  ])
    .pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    RangeError,
    "Cannot add to the tar archive: The size cannot exceed 64 Gibs",
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
      type: "file",
      path: "name",
      size,
      readable: ReadableStream.from(iterable),
    },
  ])
    .pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    RangeError,
    "Cannot add to the tar archive: The size cannot exceed 64 Gibs",
  );
});

Deno.test("parsePath()", async () => {
  const readable = ReadableStream.from<TarStreamInput>([
    {
      type: "directory",
      path:
        "./Veeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeery/LongPath",
    },
    {
      type: "directory",
      path:
        "./some random path/with/loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong/path",
    },
    {
      type: "directory",
      path:
        "./some random path/with/loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong/file",
    },
    {
      type: "directory",
      path:
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
  for await (const tarEntry of readable) {
    assertEquals(tarEntry.path, output.shift());
    tarEntry.readable?.cancel();
  }
});

Deno.test("validTarStreamOptions()", () => {
  assertValidTarStreamOptions({});

  assertValidTarStreamOptions({ mode: 0o0 });
  assertThrows(
    () => assertValidTarStreamOptions({ mode: 0o1111111 }),
    TypeError,
    "Cannot add to the tar archive: Invalid Mode provided",
  );

  assertValidTarStreamOptions({ uid: 0o0 });
  assertThrows(
    () => assertValidTarStreamOptions({ uid: 0o1111111 }),
    TypeError,
    "Cannot add to the tar archive: Invalid UID provided",
  );

  assertValidTarStreamOptions({ gid: 0o0 });
  assertThrows(
    () => assertValidTarStreamOptions({ gid: 0o1111111 }),
    TypeError,
    "Cannot add to the tar archive: Invalid GID provided",
  );

  assertValidTarStreamOptions({ mtime: 0o0 });
  assertThrows(
    () => assertValidTarStreamOptions({ mtime: NaN }),
    TypeError,
    "Cannot add to the tar archive: Invalid MTime provided",
  );
  assertValidTarStreamOptions({
    mtime: Math.floor(new Date().getTime() / 1000),
  });
  assertThrows(
    () => assertValidTarStreamOptions({ mtime: new Date().getTime() }),
    TypeError,
    "Cannot add to the tar archive: Invalid MTime provided",
  );

  assertValidTarStreamOptions({ uname: "" });
  assertValidTarStreamOptions({ uname: "abcdef" });
  assertThrows(
    () => assertValidTarStreamOptions({ uname: "å-abcdef" }),
    TypeError,
    "Cannot add to the tar archive: Invalid UName provided",
  );
  assertThrows(
    () => assertValidTarStreamOptions({ uname: "a".repeat(100) }),
    TypeError,
    "Cannot add to the tar archive: Invalid UName provided",
  );

  assertValidTarStreamOptions({ gname: "" });
  assertValidTarStreamOptions({ gname: "abcdef" });
  assertThrows(
    () => assertValidTarStreamOptions({ gname: "å-abcdef" }),
    TypeError,
    "Cannot add to the tar archive: Invalid GName provided",
  );
  assertThrows(
    () => assertValidTarStreamOptions({ gname: "a".repeat(100) }),
    TypeError,
    "Cannot add to the tar archive: Invalid GName provided",
  );

  assertValidTarStreamOptions({ devmajor: "" });
  assertValidTarStreamOptions({ devmajor: "1234" });
  assertThrows(
    () => assertValidTarStreamOptions({ devmajor: "123456789" }),
    TypeError,
    "Cannot add to the tar archive: Invalid DevMajor provided",
  );

  assertValidTarStreamOptions({ devminor: "" });
  assertValidTarStreamOptions({ devminor: "1234" });
  assertThrows(
    () => assertValidTarStreamOptions({ devminor: "123456789" }),
    TypeError,
    "Cannot add to the tar archive: Invalid DevMinor provided",
  );
});

Deno.test("TarStream() with invalid options", async () => {
  const readable = ReadableStream.from<TarStreamInput>([
    { type: "directory", path: "potato", options: { mode: 0o1111111 } },
  ]).pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    TypeError,
    "Cannot add to the tar archive: Invalid Mode provided",
  );
});

Deno.test("TarStream() with mismatching sizes", async () => {
  const text = new TextEncoder().encode("Hello World!");
  const readable = ReadableStream.from<TarStreamInput>([
    {
      type: "file",
      path: "potato",
      size: text.length + 1,
      readable: ReadableStream.from([text.slice()]),
    },
  ]).pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    RangeError,
    "Cannot add to the tar archive: The provided size (13) did not match bytes read from provided readable (12)",
  );
});

Deno.test("TarStream() with empty buffers", async () => {
  const text = new TextEncoder().encode("Hello World!");
  const readable = ReadableStream.from<TarStreamInput>([
    {
      type: "file",
      path: "potato",
      size: text.length,
      readable: ReadableStream.from([new Uint8Array(), text, new Uint8Array()]),
    },
  ]).pipeThrough(new TarStream());

  assertEquals((await new Response(readable).bytes()).length % 512, 0);
});

Deno.test("parsePath() with too long path", async () => {
  const readable = ReadableStream.from<TarStreamInput>([{
    type: "directory",
    path: "0".repeat(300),
  }])
    .pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    RangeError,
    "Cannot parse the path as the path length cannot exceed 256 bytes: The path length is 300",
  );
});

Deno.test("parsePath() with too long path", async () => {
  const readable = ReadableStream.from<TarStreamInput>([{
    type: "directory",
    path: "0".repeat(160) + "/",
  }])
    .pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    TypeError,
    "Cannot parse the path as the path needs to be split-able on a forward slash separator into [155, 100] bytes respectively",
  );
});
