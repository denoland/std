// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { digest } from "./mod.ts";

const webCrypto = globalThis.crypto;

Deno.test("test", async () => {
  const input = new TextEncoder().encode("SHA-384");

  const wasmDigest = digest("SHA-384", input, undefined);

  const webDigest = new Uint8Array(
    await webCrypto.subtle!.digest("SHA-384", input),
  );

  assertEquals(wasmDigest, webDigest);
});
