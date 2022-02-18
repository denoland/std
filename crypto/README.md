# crypto

## Usage

```typescript
import { crypto } from "https://deno.land/std@$STD_VERSION/crypto/mod.ts";

// This will delegate to the runtime's WebCrypto implementation.
console.log(
  new Uint8Array(
    await crypto.subtle.digest(
      "SHA-384",
      new TextEncoder().encode("hello world"),
    ),
  ),
);

// This will use a bundled WASM/Rust implementation.
console.log(
  new Uint8Array(
    await crypto.subtle.digest(
      "BLAKE3",
      new TextEncoder().encode("hello world"),
    ),
  ),
);
```

## Supported algorithms

Here is a list of supported algorithms. If the algorithm name in WebCrypto and
WASM/Rust is the same, this library prefers to use algorithms that are supported
by WebCrypto.

WebCrypto

```ts
// https://deno.land/std/crypto/mod.ts
const webCryptoDigestAlgorithms = [
  "SHA-384",
  "SHA-256",
  "SHA-512",
  // insecure (length-extendable and collidable):
  "SHA-1",
] as const;
```

WASM/Rust

```ts
// https://deno.land/std/_wasm_crypto/mod.ts
export const digestAlgorithms = [
  "BLAKE2B-256",
  "BLAKE2B-384",
  "BLAKE2B",
  "BLAKE2S",
  "BLAKE3",
  "KECCAK-224",
  "KECCAK-256",
  "KECCAK-384",
  "KECCAK-512",
  "SHA-384",
  "SHA3-224",
  "SHA3-256",
  "SHA3-384",
  "SHA3-512",
  "SHAKE128",
  "SHAKE256",
  "TIGER",
  // insecure (length-extendable):
  "RIPEMD-160",
  "SHA-224",
  "SHA-256",
  "SHA-512",
  // insecure (collidable and length-extendable):
  "MD5",
  "SHA-1",
] as const;
```
