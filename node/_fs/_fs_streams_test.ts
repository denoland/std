// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { createReadStream, ReadStream } from "./_fs_streams.ts";
import * as path from "../../path/mod.ts";
import { assertEquals } from "../../testing/asserts.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testData = path.resolve(moduleDir, "testdata", "hello.txt");

Deno.test({
  name: "[node/fs.ReadStream] Read a chunk of data using 'ReadStream()'",
  fn() {
    const readable = ReadStream(testData);

    let data: Uint8Array;
    readable.on("data", (chunk: Uint8Array) => {
      data = chunk;
    });

    readable.on("close", () => {
      assertEquals(new TextDecoder().decode(data as Uint8Array), "hello world");
    });
  },
});

Deno.test({
  name: "[node/fs.ReadStream] Read a chunk of data using 'new ReadStream()'",
  fn() {
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    const readable = new ReadStream(testData);

    let data: Uint8Array;
    readable.on("data", (chunk: Uint8Array) => {
      data = chunk;
    });

    readable.on("close", () => {
      assertEquals(new TextDecoder().decode(data as Uint8Array), "hello world");
    });
  },
});

Deno.test({
  name:
    "[node/fs.createReadStream] Read a chunk of data using 'creatReadStream()'",
  fn() {
    const readable = createReadStream(testData);

    let data: Uint8Array;
    readable.on("data", (chunk: Uint8Array) => {
      data = chunk;
    });

    readable.on("close", () => {
      assertEquals(new TextDecoder().decode(data as Uint8Array), "hello world");
    });
  },
});

Deno.test({
  name:
    "[node/fs.createReadStream] Read a chunk of data using 'new createReadStream()'",
  fn() {
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    const readable = new createReadStream(testData);

    let data: Uint8Array;
    readable.on("data", (chunk: Uint8Array) => {
      data = chunk;
    });

    readable.on("close", () => {
      assertEquals(new TextDecoder().decode(data as Uint8Array), "hello world");
    });
  },
});

Deno.test({
  name: "[node/fs.createReadStream] Read a chunk of data with options",
  fn() {
    const readable = createReadStream(testData, { encoding: "utf8" });

    let data: string;
    readable.on("data", (chunk: string) => {
      data = chunk;
    });

    readable.on("close", () => {
      assertEquals(data, "hello world");
    });
  },
});

Deno.test({
  name: "[node/fs.createReadStream] Call parent function",
  fn() {
    const readable = createReadStream(testData);
    readable.setEncoding("utf8");

    let data: string;
    readable.on("data", (chunk: string) => {
      data = chunk;
    });

    readable.on("close", () => {
      assertEquals(data, "hello world");
    });
  },
});

Deno.test({
  name: "[node/fs.createReadStream] Access parent property",
  fn() {
    const readable = createReadStream(testData);

    readable.on("data", () => null);

    readable.on("close", () => {
      assertEquals(readable.readableEnded, true);
    });
  },
});

Deno.test({
  name: "[node/fs.createReadStream] Read data",
  fn() {
    const readable = createReadStream(testData);

    const data: (Uint8Array | null)[] = [];
    readable.on("readable", function () {
      data.push(readable.read());
    });

    readable.on("close", () => {
      assertEquals(
        new TextDecoder().decode(data[0] as Uint8Array),
        "hello world",
      );
      assertEquals(data[1], null);
    });
  },
});

Deno.test({
  name: "[node/fs.createReadStream] Read given amount of data",
  fn() {
    const readable = createReadStream(testData);

    const data: (Uint8Array | null)[] = [];
    readable.on("readable", function () {
      data.push(readable.read(5));
      data.push(readable.read());
    });

    readable.on("close", () => {
      assertEquals(new TextDecoder().decode(data[0] as Uint8Array), "hello");
      assertEquals(new TextDecoder().decode(data[1] as Uint8Array), " world");
      assertEquals(data[2], null);
    });
  },
});

Deno.test({
  name: "[node/fs.createReadStream] Destroy the stream",
  fn() {
    const readable = createReadStream(testData);

    const data: (Uint8Array | null)[] = [];
    readable.on("readable", function () {
      data.push(readable.read(5));
      readable.destroy();
    });

    readable.on("close", () => {
      assertEquals(new TextDecoder().decode(data[0] as Uint8Array), "hello");
      assertEquals(data.length, 1);
    });
  },
});

Deno.test({
  name: "[node/fs.createReadStream] Destroy the stream with an error",
  fn() {
    const readable = createReadStream(testData);

    const data: (Uint8Array | null)[] = [];
    readable.on("readable", function () {
      data.push(readable.read(5));
      readable.destroy(Error("destroy has been called."));
    });

    readable.on("close", () => {
      assertEquals(new TextDecoder().decode(data[0] as Uint8Array), "hello");
      assertEquals(data.length, 1);
    });

    readable.on("error", (err: Error) => {
      assertEquals(err.name, "Error");
      assertEquals(err.message, "destroy has been called.");
    });
  },
});
