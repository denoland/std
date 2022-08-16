# crypto

Extensions to the WebCrypto interface, which provides additional encryption
algorithms that are not part of the web standard, as well as a
`subtle.digest()`, `subtle.digestSync()`, and `subtle.timingSafeEqual()` methods
which provide additional functionality not covered by web crypto.

It also includes some utilities for key management.

## `crypto` usage

The `crypto` export provides an enhanced version of the built-in
[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
providing additional cryptographic algorithms using the same interface as the
Web Crypto API, but also delegating to the built in APIs when possible.

```ts
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

// This will use a bundled Wasm/Rust implementation.
console.log(
  new Uint8Array(
    await crypto.subtle.digest(
      "BLAKE3",
      new TextEncoder().encode("hello world"),
    ),
  ),
);
```

### Supported algorithms

Here is a list of supported algorithms. If the algorithm name in WebCrypto and
Wasm/Rust is the same, this library prefers to use algorithms that are supported
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

Wasm/Rust

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

## Timing safe comparison

When checking the values of cryptographic hashes are equal, default comparisons
can be susceptible to timing based attacks, where attacker is able to find out
information about the host system by repeatedly checking response times to to
equality comparisons of values.

It is likely some form of timing safe equality will make its way to the
WebCrypto standard (see:
[w3c/webcrypto#270](https://github.com/w3c/webcrypto/issues/270)), but until
that time, `timingSafeEqual()` is provided:

```ts
import { crypto } from "https://deno.land/std@$STD_VERSION/crypto/mod.ts";
import { assert } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const a = await crypto.subtle.digest(
  "SHA-384",
  new TextEncoder().encode("hello world"),
);
const b = await crypto.subtle.digest(
  "SHA-384",
  new TextEncoder().encode("hello world"),
);
const c = await crypto.subtle.digest(
  "SHA-384",
  new TextEncoder().encode("hello deno"),
);

assert(crypto.subtle.timingSafeEqual(a, b));
assert(!crypto.subtle.timingSafeEqual(a, c));
```

In addition to the method being part of the `crypto.subtle` interface, it is
also loadable directly:

```ts
import { timingSafeEqual } from "https://deno.land/std@$STD_VERSION/crypto/timing_safe_equal.ts";
import { assert } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";

const a = await crypto.subtle.digest(
  "SHA-384",
  new TextEncoder().encode("hello world"),
);
const b = await crypto.subtle.digest(
  "SHA-384",
  new TextEncoder().encode("hello world"),
);

assert(timingSafeEqual(a, b));
```

## `KeyStack` usage

The `KeyStack` export implements the `KeyRing` interface for managing rotatable
keys for signing data to prevent tampering, like with HTTP cookies.

```ts
import { KeyStack } from "https://deno.land/std@$STD_VERSION/crypto/keystack.ts";

const keyStack = new KeyStack(["hello", "world"]);
const digest = await keyStack.sign("some data");

const rotatedStack = new KeyStack(["deno", "says", "hello", "world"]);
await rotatedStack.verify("some data", digest); // true
```
