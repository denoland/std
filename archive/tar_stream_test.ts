// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import {
  assertValidTarStreamOptions,
  TarStream,
  type TarStreamInput,
} from "./tar_stream.ts";
import { assertEquals, assertRejects, assertThrows } from "../assert/mod.ts";
import { UntarStream } from "./untar_stream.ts";
import { concat } from "../bytes/mod.ts";

Deno.test("TarStream() with default stream", async () => {
  const text = new TextEncoder().encode("Hello World!");

  const reader = ReadableStream.from<TarStreamInput>([
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
      path: "./potato",
    },
    {
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
      path:
        "./Veeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeery/LongPath",
    },
    {
      path:
        "./some random path/with/loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong/path",
    },
    {
      path:
        "./some random path/with/loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong/file",
    },
    {
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

  assertValidTarStreamOptions({ mode: 0 });
  assertThrows(
    () => assertValidTarStreamOptions({ mode: 8 }),
    TypeError,
    "Invalid Mode Provided",
  );
  assertThrows(
    () => assertValidTarStreamOptions({ mode: 1111111 }),
    TypeError,
    "Invalid Mode Provided",
  );

  assertValidTarStreamOptions({ uid: 0 });
  assertThrows(
    () => assertValidTarStreamOptions({ uid: 8 }),
    TypeError,
    "Invalid UID Provided",
  );
  assertThrows(
    () => assertValidTarStreamOptions({ uid: 1111111 }),
    TypeError,
    "Invalid UID Provided",
  );

  assertValidTarStreamOptions({ gid: 0 });
  assertThrows(
    () => assertValidTarStreamOptions({ gid: 8 }),
    TypeError,
    "Invalid GID Provided",
  );
  assertThrows(
    () => assertValidTarStreamOptions({ gid: 1111111 }),
    TypeError,
    "Invalid GID Provided",
  );

  assertValidTarStreamOptions({ mtime: 0 });
  assertThrows(
    () => assertValidTarStreamOptions({ mtime: NaN }),
    TypeError,
    "Invalid MTime Provided",
  );
  assertValidTarStreamOptions({
    mtime: Math.floor(new Date().getTime() / 1000),
  });
  assertThrows(
    () => assertValidTarStreamOptions({ mtime: new Date().getTime() }),
    TypeError,
    "Invalid MTime Provided",
  );

  assertValidTarStreamOptions({ uname: "" });
  assertValidTarStreamOptions({ uname: "abcdef" });
  assertThrows(
    () => assertValidTarStreamOptions({ uname: "å-abcdef" }),
    TypeError,
    "Invalid UName Provided",
  );
  assertThrows(
    () => assertValidTarStreamOptions({ uname: "a".repeat(100) }),
    TypeError,
    "Invalid UName Provided",
  );

  assertValidTarStreamOptions({ gname: "" });
  assertValidTarStreamOptions({ gname: "abcdef" });
  assertThrows(
    () => assertValidTarStreamOptions({ gname: "å-abcdef" }),
    TypeError,
    "Invalid GName Provided",
  );
  assertThrows(
    () => assertValidTarStreamOptions({ gname: "a".repeat(100) }),
    TypeError,
    "Invalid GName Provided",
  );

  assertValidTarStreamOptions({ devmajor: "" });
  assertValidTarStreamOptions({ devmajor: "1234" });
  assertThrows(
    () => assertValidTarStreamOptions({ devmajor: "123456789" }),
    TypeError,
    "Invalid DevMajor Provided",
  );

  assertValidTarStreamOptions({ devminor: "" });
  assertValidTarStreamOptions({ devminor: "1234" });
  assertThrows(
    () => assertValidTarStreamOptions({ devminor: "123456789" }),
    TypeError,
    "Invalid DevMinor Provided",
  );
});

Deno.test("TarStream() with invalid options", async () => {
  const readable = ReadableStream.from<TarStreamInput>([
    { path: "potato", options: { mode: 9 } },
  ]).pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    TypeError,
    "Invalid Mode Provided",
  );
});

Deno.test("TarStream() with mismatching sizes", async () => {
  const text = new TextEncoder().encode("Hello World!");
  const readable = ReadableStream.from<TarStreamInput>([
    {
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

Deno.test("parsePath() with too long path", async () => {
  const readable = ReadableStream.from<TarStreamInput>([{
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
    path: "0".repeat(160) + "/",
  }])
    .pipeThrough(new TarStream());

  await assertRejects(
    () => Array.fromAsync(readable),
    TypeError,
    "Cannot parse the path as the path needs to be split-able on a forward slash separator into [155, 100] bytes respectively",
  );
});
