// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertNotEquals, assertRejects } from "@std/assert";
import { decryptAesGcm, encryptAesGcm } from "./unstable_aes_gcm.ts";

const encoder = new TextEncoder();

function generateKey(
  length: 128 | 256,
): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length },
    true,
    ["encrypt", "decrypt"],
  );
}

Deno.test("encryptAesGcm()/decryptAesGcm() round-trips empty plaintext", async () => {
  const key = await generateKey(256);
  const plaintext = new Uint8Array(0);
  const encrypted = await encryptAesGcm(key, plaintext);
  const decrypted = await decryptAesGcm(key, encrypted);
  assertEquals(decrypted, plaintext);
});

Deno.test("encryptAesGcm()/decryptAesGcm() round-trips non-empty plaintext", async () => {
  const key = await generateKey(256);
  const plaintext = crypto.getRandomValues(new Uint8Array(1024));
  const encrypted = await encryptAesGcm(key, plaintext);
  const decrypted = await decryptAesGcm(key, encrypted);
  assertEquals(decrypted, plaintext);
});

Deno.test("encryptAesGcm() output length is 12 + plaintext.length + 16", async () => {
  const key = await generateKey(256);
  for (const size of [0, 1, 256]) {
    const plaintext = new Uint8Array(size);
    const encrypted = await encryptAesGcm(key, plaintext);
    assertEquals(encrypted.byteLength, 12 + size + 16);
  }
});

Deno.test("encryptAesGcm() generates different nonces per call", async () => {
  const key = await generateKey(256);
  const plaintext = encoder.encode("hello");
  const a = await encryptAesGcm(key, plaintext);
  const b = await encryptAesGcm(key, plaintext);
  assertNotEquals(a.subarray(0, 12), b.subarray(0, 12));
});

Deno.test("encryptAesGcm()/decryptAesGcm() round-trips with matching additionalData", async () => {
  const key = await generateKey(256);
  const plaintext = encoder.encode("secret");
  const aad = encoder.encode("metadata");
  const encrypted = await encryptAesGcm(key, plaintext, {
    additionalData: aad,
  });
  const decrypted = await decryptAesGcm(key, encrypted, {
    additionalData: aad,
  });
  assertEquals(decrypted, plaintext);
});

Deno.test("decryptAesGcm() rejects with wrong additionalData", async () => {
  const key = await generateKey(256);
  const encrypted = await encryptAesGcm(key, encoder.encode("secret"), {
    additionalData: encoder.encode("correct"),
  });
  await assertRejects(
    () =>
      decryptAesGcm(key, encrypted, {
        additionalData: encoder.encode("wrong"),
      }),
    DOMException,
  );
});

Deno.test("decryptAesGcm() rejects when additionalData expected but not provided", async () => {
  const key = await generateKey(256);
  const encrypted = await encryptAesGcm(key, encoder.encode("secret"), {
    additionalData: encoder.encode("metadata"),
  });
  await assertRejects(
    () => decryptAesGcm(key, encrypted),
    DOMException,
  );
});

Deno.test("decryptAesGcm() rejects on tampered ciphertext", async () => {
  const key = await generateKey(256);
  const encrypted = await encryptAesGcm(key, encoder.encode("hello"));
  encrypted[14]! ^= 0xff;
  await assertRejects(
    () => decryptAesGcm(key, encrypted),
    DOMException,
  );
});

Deno.test("decryptAesGcm() throws RangeError for data shorter than 28 bytes", async () => {
  const key = await generateKey(256);
  for (const size of [0, 1, 12, 27]) {
    await assertRejects(
      () => decryptAesGcm(key, new Uint8Array(size)),
      RangeError,
      `expected at least`,
    );
  }
});

Deno.test("decryptAesGcm() rejects with a different key", async () => {
  const key1 = await generateKey(256);
  const key2 = await generateKey(256);
  const encrypted = await encryptAesGcm(key1, encoder.encode("hello"));
  await assertRejects(
    () => decryptAesGcm(key2, encrypted),
    DOMException,
  );
});

Deno.test("encryptAesGcm() output is valid Web Crypto AES-GCM", async () => {
  const key = await generateKey(256);
  const plaintext = encoder.encode("interop test");
  const encrypted = await encryptAesGcm(key, plaintext);

  const nonce = encrypted.subarray(0, 12);
  const ciphertextAndTag = encrypted.subarray(12);

  const decrypted = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: nonce, tagLength: 128 },
      key,
      ciphertextAndTag,
    ),
  );
  assertEquals(decrypted, plaintext);
});

Deno.test("decryptAesGcm() decrypts manually constructed wire format", async () => {
  const key = await generateKey(256);
  const plaintext = encoder.encode("manual wire format");
  const nonce = crypto.getRandomValues(new Uint8Array(12));

  const ciphertextAndTag = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce, tagLength: 128 },
      key,
      plaintext,
    ),
  );

  const wire = new Uint8Array(12 + ciphertextAndTag.byteLength);
  wire.set(nonce);
  wire.set(ciphertextAndTag, 12);

  const decrypted = await decryptAesGcm(key, wire);
  assertEquals(decrypted, plaintext);
});

Deno.test("encryptAesGcm()/decryptAesGcm() works with AES-128", async () => {
  const key = await generateKey(128);
  const plaintext = encoder.encode("AES-128 test");
  const encrypted = await encryptAesGcm(key, plaintext);
  const decrypted = await decryptAesGcm(key, encrypted);
  assertEquals(decrypted, plaintext);
});

Deno.test("encryptAesGcm()/decryptAesGcm() round-trips ArrayBuffer inputs", async () => {
  const key = await generateKey(256);
  const plaintext = encoder.encode("arraybuffer test");
  const encrypted = await encryptAesGcm(key, plaintext.buffer as ArrayBuffer);
  const decrypted = await decryptAesGcm(
    key,
    encrypted.buffer as ArrayBuffer,
  );
  assertEquals(decrypted, plaintext);
});

Deno.test("encryptAesGcm()/decryptAesGcm() round-trips DataView inputs", async () => {
  const key = await generateKey(256);
  const plaintext = encoder.encode("dataview test");
  const plaintextView = new DataView(
    plaintext.buffer as ArrayBuffer,
    plaintext.byteOffset,
    plaintext.byteLength,
  );
  const encrypted = await encryptAesGcm(key, plaintextView);
  const encryptedView = new DataView(
    encrypted.buffer as ArrayBuffer,
    encrypted.byteOffset,
    encrypted.byteLength,
  );
  const decrypted = await decryptAesGcm(key, encryptedView);
  assertEquals(decrypted, plaintext);
});
