// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertRejects } from "../testing/asserts.ts";
import {
  getNBytes,
  putVarbig,
  putVarnum,
  readExact,
  readVarbig,
  readVarnum,
  sizeof,
  varbig,
  varbigBytes,
  varnum,
  varnumBytes,
  writeVarbig,
  writeVarnum,
} from "./binary.ts";
import { Buffer } from "../io/buffer.ts";
import { readerFromIterable } from "../streams/reader_from_iterable.ts";

Deno.test("testReadExactMultipleReads", async function () {
  const reader = readerFromIterable([
    new Uint8Array([1]),
    new Uint8Array([2, 3]),
    new Uint8Array([4, 5, 6]),
  ]);
  const scratch = new Uint8Array(4);
  await readExact(reader, scratch);
  assertEquals(scratch, new Uint8Array([1, 2, 3, 4]));
});

Deno.test("testReadExactMultipleReadsDelayed", async function () {
  const reader = readerFromIterable((async function* () {
    yield new Uint8Array([1]);
    await new Promise((r) => setTimeout(r, 1));
    yield new Uint8Array([2, 3]);
    await new Promise((r) => setTimeout(r, 10));
    yield new Uint8Array([4, 5, 6]);
  })());

  const scratch = new Uint8Array(4);
  await readExact(reader, scratch);
  assertEquals(scratch, new Uint8Array([1, 2, 3, 4]));
});

Deno.test("testReadExactThrows", async function () {
  const reader = readerFromIterable([
    new Uint8Array([1]),
    new Uint8Array([2, 3]),
  ]);
  const scratch = new Uint8Array(4);
  await assertRejects(async () => {
    await readExact(reader, scratch);
  }, Deno.errors.UnexpectedEof);
});

Deno.test("testGetNBytes", async function () {
  const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const buff = new Buffer(data.buffer);
  const rslt = await getNBytes(buff, 8);
  assertEquals(rslt, data);
});

Deno.test("testGetNBytesThrows", async function () {
  const data = new Uint8Array([1, 2, 3, 4]);
  const buff = new Buffer(data.buffer);
  await assertRejects(async () => {
    await getNBytes(buff, 8);
  }, Deno.errors.UnexpectedEof);
});

Deno.test("testPutVarbig", function () {
  const buff = new Uint8Array(8);
  putVarbig(buff, 0xffeeddccbbaa9988n);
  assertEquals(
    buff,
    new Uint8Array([0xff, 0xee, 0xdd, 0xcc, 0xbb, 0xaa, 0x99, 0x88]),
  );
});

Deno.test("testPutVarbigLittleEndian", function () {
  const buff = new Uint8Array(8);
  putVarbig(buff, 0x8899aabbccddeeffn, { endian: "little" });
  assertEquals(
    buff,
    new Uint8Array([0xff, 0xee, 0xdd, 0xcc, 0xbb, 0xaa, 0x99, 0x88]),
  );
});

Deno.test("testPutVarnum", function () {
  const buff = new Uint8Array(4);
  putVarnum(buff, 0xffeeddcc);
  assertEquals(buff, new Uint8Array([0xff, 0xee, 0xdd, 0xcc]));
});

Deno.test("testPutVarnumLittleEndian", function () {
  const buff = new Uint8Array(4);
  putVarnum(buff, 0xccddeeff, { endian: "little" });
  assertEquals(buff, new Uint8Array([0xff, 0xee, 0xdd, 0xcc]));
});

Deno.test("testReadVarbig", async function () {
  const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const buff = new Buffer(data.buffer);
  const rslt = await readVarbig(buff);
  assertEquals(rslt, 0x0102030405060708n);
});

Deno.test("testReadVarbigLittleEndian", async function () {
  const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const buff = new Buffer(data.buffer);
  const rslt = await readVarbig(buff, { endian: "little" });
  assertEquals(rslt, 0x0807060504030201n);
});

Deno.test("testReadVarnum", async function () {
  const data = new Uint8Array([1, 2, 3, 4]);
  const buff = new Buffer(data.buffer);
  const rslt = await readVarnum(buff);
  assertEquals(rslt, 0x01020304);
});

Deno.test("testReadVarnumLittleEndian", async function () {
  const data = new Uint8Array([1, 2, 3, 4]);
  const buff = new Buffer(data.buffer);
  const rslt = await readVarnum(buff, { endian: "little" });
  assertEquals(rslt, 0x04030201);
});

Deno.test("testSizeof", function () {
  assertEquals(1, sizeof("int8"));
  assertEquals(1, sizeof("uint8"));
  assertEquals(2, sizeof("int16"));
  assertEquals(2, sizeof("uint16"));
  assertEquals(4, sizeof("int32"));
  assertEquals(4, sizeof("uint32"));
  assertEquals(8, sizeof("int64"));
  assertEquals(8, sizeof("uint64"));
  assertEquals(4, sizeof("float32"));
  assertEquals(8, sizeof("float64"));
});

Deno.test("testVarbig", function () {
  const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const rslt = varbig(data);
  assertEquals(rslt, 0x0102030405060708n);
});

Deno.test("testVarbigLittleEndian", function () {
  const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const rslt = varbig(data, { endian: "little" });
  assertEquals(rslt, 0x0807060504030201n);
});

Deno.test("testVarnum", function () {
  const data = new Uint8Array([1, 2, 3, 4]);
  const rslt = varnum(data);
  assertEquals(rslt, 0x01020304);
});
Deno.test("testVarnumLittleEndian", function () {
  const data = new Uint8Array([1, 2, 3, 4]);
  const rslt = varnum(data, { endian: "little" });
  assertEquals(rslt, 0x04030201);
});

Deno.test("testWriteVarbig", async function () {
  const data = new Uint8Array(8);
  const buff = new Buffer();
  await writeVarbig(buff, 0x0102030405060708n);
  await buff.read(data);
  assertEquals(
    data,
    new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]),
  );
});

Deno.test("testWriteVarbigLittleEndian", async function () {
  const data = new Uint8Array(8);
  const buff = new Buffer();
  await writeVarbig(buff, 0x0807060504030201n, { endian: "little" });
  await buff.read(data);
  assertEquals(
    data,
    new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]),
  );
});

Deno.test("testWriteVarnum", async function () {
  const data = new Uint8Array(4);
  const buff = new Buffer();
  await writeVarnum(buff, 0x01020304);
  await buff.read(data);
  assertEquals(data, new Uint8Array([0x01, 0x02, 0x03, 0x04]));
});

Deno.test("testWriteVarnumLittleEndian", async function () {
  const data = new Uint8Array(4);
  const buff = new Buffer();
  await writeVarnum(buff, 0x04030201, { endian: "little" });
  await buff.read(data);
  assertEquals(data, new Uint8Array([0x01, 0x02, 0x03, 0x04]));
});

Deno.test("testVarbigBytes", function () {
  const rslt = varbigBytes(0x0102030405060708n);
  assertEquals(
    rslt,
    new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]),
  );
});

Deno.test("testVarbigBytesLittleEndian", function () {
  const rslt = varbigBytes(0x0807060504030201n, { endian: "little" });
  assertEquals(
    rslt,
    new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]),
  );
});

Deno.test("testVarnumBytes", function () {
  const rslt = varnumBytes(0x01020304);
  assertEquals(rslt, new Uint8Array([0x01, 0x02, 0x03, 0x04]));
});

Deno.test("testVarnumBytesLittleEndian", function () {
  const rslt = varnumBytes(0x04030201, { endian: "little" });
  assertEquals(rslt, new Uint8Array([0x01, 0x02, 0x03, 0x04]));
});

Deno.test("testVarnumSubarray", function () {
  const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
  const sub = data.subarray(2, 4);
  const rslt = varnum(sub, { dataType: "uint8" });
  assertEquals(rslt, 3);
});
