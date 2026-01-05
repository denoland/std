// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { concat } from "@std/bytes";
import {
  assertValidPath,
  assertValidTarStreamOptions,
  TarStream,
  type TarStreamInput,
  type Uint8Array_,
} from "./tar_stream.ts";
import { assertThrows } from "@std/assert/throws";
import { assertRejects } from "@std/assert/rejects";

Deno.test("TarStream() outputs corrects length", async () => {
  const buffer = await new Response(
    ReadableStream
      .from<TarStreamInput>([
        { type: "directory", path: "./potato" }, // 512
        {
          type: "file",
          path: "./potato/text.txt",
          size: 12,
          readable: ReadableStream
            .from([new TextEncoder().encode("Hello World!")]),
        }, // 1024
        {
          type: "file",
          path: "./potato/deno.json",
          size: (await Deno.stat("deno.json")).size,
          readable: (await Deno.open("deno.json")).readable,
        }, // 512 + ceil(size / 512) * 512
      ]) // 1024
      .pipeThrough(new TarStream()),
  )
    .bytes();

  assertEquals(
    buffer.length,
    512 +
      1024 +
      (512 + Math.ceil((await Deno.stat("deno.json")).size / 512) * 512) +
      1024,
  );
});

Deno.test("TarStream() ends correctly", async () => {
  const buffer = await new Response(
    ReadableStream
      .from<TarStreamInput>([
        { type: "directory", path: "./potato" }, // 512
        {
          type: "file",
          path: "./potato/text.txt",
          size: 12,
          readable: ReadableStream
            .from([new TextEncoder().encode("Hello World!")]),
        }, // 1024
        {
          type: "file",
          path: "./potato/deno.json",
          size: (await Deno.stat("deno.json")).size,
          readable: (await Deno.open("deno.json")).readable,
        }, // 512 + ceil(size / 512) * 512
      ]) // 1024
      .pipeThrough(new TarStream()),
  )
    .bytes();

  assertEquals(buffer.subarray(-1024), new Uint8Array(1024));
});

Deno.test("TarStream() supports byte streams", async () => {
  const mtime = Date.now() / 1000 | 0;
  async function createReadable(): Promise<ReadableStream<Uint8Array_>> {
    return ReadableStream
      .from<TarStreamInput>([
        { type: "directory", path: "./potato", options: { mtime } }, // 512
        {
          type: "file",
          path: "./potato/text.txt",
          size: 12,
          readable: ReadableStream
            .from([new TextEncoder().encode("Hello World!")]),
          options: { mtime },
        }, // 1024
        {
          type: "file",
          path: "./potato/deno.json",
          size: (await Deno.stat("deno.json")).size,
          readable: (await Deno.open("deno.json")).readable,
          options: { mtime },
        }, // 512 + ceil(size / 512) * 512
      ]) // 1024
      .pipeThrough(new TarStream());
  }

  const expected = await new Response(await createReadable()).bytes();
  for (let i = 1; i <= 1025; ++i) {
    const reader = (await createReadable()).getReader({ mode: "byob" });
    const chunks: Uint8Array_[] = [];
    while (true) {
      const { done, value } = await reader.read(new Uint8Array(i), { min: i });
      assert(value != undefined);
      chunks.push(value);
      if (done) break;
    }
    const actual = concat(chunks);
    assertEquals(actual, expected, `Buffer Size: ${i}`);
  }
});

Deno.test("assertValidTarStreamOptions()", () => {
  assertValidTarStreamOptions({});

  assertValidTarStreamOptions({ mode: 0o664 });
  assertThrows(() => assertValidTarStreamOptions({ mode: NaN }));
  assertThrows(() => assertValidTarStreamOptions({ mode: -0o664 }));
  assertThrows(() => assertValidTarStreamOptions({ mode: 0o1111111 }));

  assertValidTarStreamOptions({ uid: 0o664 });
  assertThrows(() => assertValidTarStreamOptions({ uid: NaN }));
  assertThrows(() => assertValidTarStreamOptions({ uid: -0o664 }));
  assertThrows(() => assertValidTarStreamOptions({ uid: 0o1111111 }));

  assertValidTarStreamOptions({ gid: 0o664 });
  assertThrows(() => assertValidTarStreamOptions({ gid: NaN }));
  assertThrows(() => assertValidTarStreamOptions({ gid: -0o664 }));
  assertThrows(() => assertValidTarStreamOptions({ gid: 0o1111111 }));

  assertValidTarStreamOptions({ mtime: Math.floor(Date.now() / 1000) });
  assertThrows(() => assertValidTarStreamOptions({ mtime: NaN }));
  assertThrows(() =>
    assertValidTarStreamOptions({ mtime: -Math.floor(Date.now() / 1000) })
  );
  assertThrows(() => assertValidTarStreamOptions({ mtime: Date.now() }));

  assertValidTarStreamOptions({ uname: "abc" });
  assertThrows(() => assertValidTarStreamOptions({ uname: "a".repeat(32) }));
  assertThrows(() =>
    assertValidTarStreamOptions({ uname: "\xF0\x9F\x92\xa9" })
  );

  assertValidTarStreamOptions({ gname: "abc" });
  assertThrows(() => assertValidTarStreamOptions({ gname: "a".repeat(32) }));
  assertThrows(() =>
    assertValidTarStreamOptions({ gname: "\xF0\x9F\x92\xa9" })
  );

  assertValidTarStreamOptions({ devmajor: "abc" });
  assertThrows(() => assertValidTarStreamOptions({ devmajor: "a".repeat(9) }));

  assertValidTarStreamOptions({ devminor: "abc" });
  assertThrows(() => assertValidTarStreamOptions({ devminor: "a".repeat(9) }));
});

Deno.test("assertValidPath()", () => {
  assertValidPath("./potato");
  assertThrows(
    () => assertValidPath("a".repeat(300)),
    RangeError,
    "Cannot parse the path as the path length cannot exceed 256 bytes: The path length is 300",
  );
  assertThrows(
    () => assertValidPath("a".repeat(120)),
    RangeError,
    "Cannot parse the path as the file cannot exceed 100 bytes: The filename length is 120",
  );
  assertValidPath("a".repeat(75) + "/" + "b".repeat(75));
  assertThrows(
    () => assertValidPath("a".repeat(160) + "/" + "b".repeat(75)),
    TypeError,
    "Cannot parse the path as the path needs to be split-able on a forward slash separator into [155, 100] bytes respectively",
  );
});

Deno.test("TarStream() with negative size", async () => {
  await assertRejects(
    async () =>
      await new Response(
        ReadableStream
          .from<TarStreamInput>([
            {
              type: "file",
              path: "./potato/text.txt",
              size: -12,
              readable: ReadableStream.from([
                new TextEncoder().encode("Hello World!"),
              ]),
            },
          ])
          .pipeThrough(new TarStream()),
      )
        .bytes(),
    RangeError,
    "Cannot add to the tar archive: The size cannot exceed 64 Gibs",
  );
});

Deno.test("TarStream() with to big size", async () => {
  await assertRejects(
    async () =>
      await new Response(
        ReadableStream
          .from<TarStreamInput>([
            {
              type: "file",
              path: "./potato/text.txt",
              size: 8 ** 12 + 7,
              readable: ReadableStream.from([
                new TextEncoder().encode("Hello World!"),
              ]),
            },
          ])
          .pipeThrough(new TarStream()),
      )
        .bytes(),
    RangeError,
    "Cannot add to the tar archive: The size cannot exceed 64 Gibs",
  );
});

Deno.test("TarStream() with NaN size", async () => {
  await assertRejects(
    async () =>
      await new Response(
        ReadableStream
          .from<TarStreamInput>([
            {
              type: "file",
              path: "./potato/text.txt",
              size: NaN,
              readable: ReadableStream.from([
                new TextEncoder().encode("Hello World!"),
              ]),
            },
          ])
          .pipeThrough(new TarStream()),
      )
        .bytes(),
    RangeError,
    "Cannot add to the tar archive: The size cannot exceed 64 Gibs",
  );
});

Deno.test("TarStream() with mismatching sizes", async () => {
  await assertRejects(
    async () =>
      await new Response(
        ReadableStream
          .from<TarStreamInput>([
            {
              type: "file",
              path: "./potato/text.txt",
              size: 12,
              readable: ReadableStream.from([
                new TextEncoder().encode("Hello World!~"),
              ]),
            },
          ])
          .pipeThrough(new TarStream()),
      )
        .bytes(),
    RangeError,
    "Cannot add to the tar archive: The provided size (12) did not match bytes read from provided readable (13)",
  );
});

Deno.test("TarStream() decoding header", async () => {
  const mtime = Math.floor(Date.now() / 1000);
  const buffer = await new Response(
    ReadableStream
      .from<TarStreamInput>([{
        type: "directory",
        path: "a".repeat(75) + "/" + "b".repeat(75),
        options: {
          mode: 0o123,
          uid: 0o456,
          gid: 0o701,
          mtime,
          uname: "abc",
          gname: "def",
          devmajor: "123",
          devminor: "456",
        },
      }])
      .pipeThrough(new TarStream()),
  )
    .bytes();
  const encode = function () {
    const encoder = new TextEncoder();
    return encoder.encode.bind(encoder);
  }();

  // name
  assertEquals(
    buffer.subarray(0, 100),
    encode("b".repeat(75) + "\0".repeat(25)),
  );
  // mode
  assertEquals(
    buffer.subarray(100, 108),
    encode((0o123).toString(8).padStart(6, "0") + " \0"),
  );
  // uid
  assertEquals(
    buffer.subarray(108, 116),
    encode((0o456).toString(8).padStart(6, "0") + " \0"),
  );
  // gid
  assertEquals(
    buffer.subarray(116, 124),
    encode((0o701).toString(8).padStart(6, "0") + " \0"),
  );
  // size
  assertEquals(
    buffer.subarray(124, 136),
    encode((0).toString(8).padStart(11, "0") + " "),
  );
  // mtime
  assertEquals(
    buffer.subarray(136, 148),
    encode(mtime.toString(8).padStart(11, "0") + " "),
  );
  // checksum
  const checksum = buffer.slice(148, 156);
  buffer.fill(32, 148, 156);
  assertEquals(
    checksum,
    encode(
      buffer
        .subarray(0, 512)
        .reduce((x, y) => x + y)
        .toString(8)
        .padStart(6, "0") + "\0 ",
    ),
  );
  // typeflag
  assertEquals(buffer[156], 53);
  // linkname
  assertEquals(buffer.subarray(157, 257), new Uint8Array(100));
  // magic
  assertEquals(buffer.subarray(257, 263), encode("ustar\0"));
  // version
  assertEquals(buffer.subarray(263, 265), encode("00"));
  // uname
  assertEquals(
    buffer.subarray(265, 297),
    encode("abc" + "\0".repeat(28) + "\0"),
  );
  // gname
  assertEquals(
    buffer.subarray(297, 329),
    encode("def" + "\0".repeat(28) + "\0"),
  );
  // devmajor
  assertEquals(
    buffer.subarray(329, 337),
    encode("123" + "\0".repeat(5)),
  );
  // devminor
  assertEquals(
    buffer.subarray(337, 345),
    encode("456" + "\0".repeat(5)),
  );
  // prefix
  assertEquals(
    buffer.subarray(345, 500),
    encode("a".repeat(75) + "\0".repeat(80)),
  );
  // pad
  assertEquals(
    buffer.subarray(500, 512),
    new Uint8Array(12),
  );
});
