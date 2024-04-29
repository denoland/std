// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { instantiateWasm } from "./mod.ts";

const webCrypto = globalThis.crypto;

Deno.test("test", async () => {
  const input = new TextEncoder().encode("SHA-384");

  const wasmCrypto = instantiateWasm();
  const wasmDigest = wasmCrypto.digest("SHA-384", input, undefined);

  const webDigest = new Uint8Array(
    await webCrypto.subtle!.digest("SHA-384", input),
  );

  assertEquals(wasmDigest, webDigest);
});
