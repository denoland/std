// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import {
  assertEquals,
  assertMatch,
  assertStrictEquals,
} from "../../testing/asserts.ts";
import { read } from "./_fs_read.ts";
import { open } from "./_fs_open.ts";
import { Buffer } from "../buffer.ts";
import * as path from "../../path/mod.ts";
import { closeSync } from "./_fs_close.ts";

async function readTest(
  testData: string,
  buffer: Buffer | Uint8Array,
  offset: number,
  length: number,
  position: number | null = null,
  expected: (fd: number, bytesRead: number, data: Buffer) => void,
) {
  let fd1: number = 0;
  await new Promise<any>((resolve, reject) => {
    open(testData, "r", (err, fd) => {
      if (err) reject(err);
      read(fd, buffer, offset, length, position, (err, bytesRead, data) => {
        if (err) reject(err);
        resolve({ fd, bytesRead, data });
      });
    });
  })
    .then(({ fd, bytesRead, data }) => {
      fd1 = fd;
      expected(fd, bytesRead, data);
    })
    .finally(() => closeSync(fd1));
}

Deno.test({
  name: "readSuccess",
  async fn() {
    const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
    const testData = path.resolve(moduleDir, "testdata", "hello.txt");
    const buf = Buffer.alloc(1024);
    await readTest(
      testData,
      buf,
      buf.byteOffset,
      buf.byteLength,
      null,
      (_fd, bytesRead, data) => {
        assertStrictEquals(bytesRead, 11);
        assertMatch(data.toString(), /hello world/);
      },
    );
  },
});

Deno.test({
  name:
    "[std/node/fs] Read only five bytes, so that the position moves to five",
  async fn() {
    const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
    const testData = path.resolve(moduleDir, "testdata", "hello.txt");
    const buf = Buffer.alloc(5);
    await readTest(
      testData,
      buf,
      buf.byteOffset,
      5,
      null,
      (_fd, bytesRead, data) => {
        assertStrictEquals(bytesRead, 5);
        assertEquals(data.toString(), "hello");
      },
    );
  },
});

Deno.test({
  name:
    "[std/node/fs] Read only five bytes, specifies where to begin reading from in the file",
  async fn() {
    const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
    const testData = path.resolve(moduleDir, "testdata", "hello.txt");
    const buf = Buffer.alloc(11);
    await readTest(
      testData,
      buf,
      buf.byteOffset,
      buf.byteLength,
      6,
      (_fd, bytesRead, data) => {
        assertStrictEquals(bytesRead, 5);
        assertEquals(
          data,
          Buffer.from([119, 111, 114, 108, 100, 0, 0, 0, 0, 0, 0]),
        );
      },
    );
  },
});
