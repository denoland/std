// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert, assertEquals } from "../testing/asserts.ts";
import { Buffer } from "./buffer.ts";
import { createHash, getHashes, randomUUID } from "./crypto.ts";
import { Readable } from "./stream.ts";

Deno.test("[node/crypto.Hash] basic usage - buffer output", () => {
  const d = createHash("sha1").update("abc").update("def").digest();
  assertEquals(
    d,
    Buffer.from([
      0x1f,
      0x8a,
      0xc1,
      0xf,
      0x23,
      0xc5,
      0xb5,
      0xbc,
      0x11,
      0x67,
      0xbd,
      0xa8,
      0x4b,
      0x83,
      0x3e,
      0x5c,
      0x5,
      0x7a,
      0x77,
      0xd2,
    ]),
  );
});

Deno.test("[node/crypto.Hash] basic usage - hex output", () => {
  const d = createHash("sha1").update("abc").update("def").digest("hex");
  assertEquals(d, "1f8ac10f23c5b5bc1167bda84b833e5c057a77d2");
});

Deno.test("[node/crypto.Hash] basic usage - base64 output", () => {
  const d = createHash("sha1").update("abc").update("def").digest("base64");
  assertEquals(d, "H4rBDyPFtbwRZ72oS4M+XAV6d9I=");
});

Deno.test("[node/crypto.Hash] basic usage - base64url output", () => {
  const d = createHash("sha1").update("abc").update("def").digest("base64url");
  assertEquals(d, "H4rBDyPFtbwRZ72oS4M-XAV6d9I");
});

Deno.test("[node/crypto.Hash] streaming usage", async () => {
  const source = Readable.from(["abc", "def"]);
  const hash = createHash("sha1");
  const dest = source.pipe(hash);
  const result = await new Promise((resolve, _) => {
    let buffer = Buffer.from([]);
    dest.on("data", (data) => {
      buffer = Buffer.concat([buffer, data]);
    });
    dest.on("end", () => {
      resolve(buffer);
    });
  });
  assertEquals(
    result,
    Buffer.from([
      0x1f,
      0x8a,
      0xc1,
      0xf,
      0x23,
      0xc5,
      0xb5,
      0xbc,
      0x11,
      0x67,
      0xbd,
      0xa8,
      0x4b,
      0x83,
      0x3e,
      0x5c,
      0x5,
      0x7a,
      0x77,
      0xd2,
    ]),
  );
});

Deno.test("[node/crypto.getHashes]", () => {
  for (const algorithm of getHashes()) {
    const d = createHash(algorithm).update("abc").digest();
    assert(d instanceof Buffer);
    assert(d.length > 0);
  }
});

Deno.test("[node/crypto.getRandomUUID] works the same way as Web Crypto API", () => {
  assertEquals(randomUUID().length, crypto.randomUUID().length);
  assertEquals(typeof randomUUID(), typeof crypto.randomUUID());
});
