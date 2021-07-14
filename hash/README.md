# std/hash

Provides implementations of several common cryptographic hash algorithms, behind
a common interface.

## Usage

Hash inputs (messages) may be ArrayBuffers, TypedArrays, or strings (which will
be encoded as UTF-8).

### One-of digests

You can call `digest` if you just need the binary digest of a value.

```ts
import * as hash from "https://deno.land/std@$STD_VERSION/hash/mod.ts";

const digest: Uint8Array = hash.digest("sha384", "hello world");
// ...
```

### Creating new Hasher instance

If you need something more complicated, you can create a new Hasher instance by
calling `createHasher`.

```ts
import { createHasher } from "https://deno.land/std@$STD_VERSION/hash/mod.ts";

const hash = createHasher("sha384");
// ...
```

### Using Hasher instances

You can use the `update` method as many times as neccessary to feed
input/message data into your hasher instance. You can call the `digest` method
to get the binary digest of the current state.

```ts
import { createHash } from "https://deno.land/std@$STD_VERSION/hash/mod.ts";

const hash = createHash("sha384");
hash.update("Your data here");
const final = hash.digest(); // returns a Uint8Array.
```

You can get the digest as a hexadecimal or Base64 string with the `toString`
method.

```ts
import { createHash } from "https://deno.land/std@$STD_VERSION/hash/mod.ts";

const hash = createHash("sha384");
hash.update("Your data here");
const hashInHex = hash.toString();
const hashInBase64 = hash.toString({ encoding: "base64" });
```

Other methods are described
[in the docs](https://doc.deno.land/https/deno.land/std/hash/mod.ts).

### Supported algorithms

> ⚠️ **Warning:** Many of these supported algorithms have known security
> weaknesses, but are included in this module as they may be required for
> compatibility with existing systems. If you are free to pick an algorithm, be
> sure you're using one that doesn't have any known weaknesses that could
> compromise your design. If you're not sure, `sha384` is usually a safe choice:
> it's one of the most widely-supported algorithms that is still believed to be
> generally secure.

The following hash algorithms are supported:

- [`sha1`][FIPS-180-4]
- [`sha224`][FIPS-180-4]
- [`sha256`][FIPS-180-4]
- [`sha384`][FIPS-180-4]
- [`sha512`][FIPS-180-4]
- [`sha3-224`][FIPS-202]
- [`sha3-256`][FIPS-202]
- [`sha3-384`][FIPS-202]
- [`sha3-512`][FIPS-202]
- [`shake128`][FIPS-202] (supports variable-length digests)
- [`shake256`][FIPS-202] (supports variable-length digests)
- [`keccak224`][KECCAK]
- [`keccak256`][KECCAK]
- [`keccak384`][KECCAK]
- [`keccak512`][KECCAK]
- [`blake2b`][BLAKE2]
- [`blake2s`][BLAKE2]
- [`blake3`][BLAKE3] (supports variable-length digests)
- [`md2`][RFC-1319]
- [`md4`][RFC-1186]
- [`md5`][RFC-1321]
- [`ripemd160`][RIPEMD-160]
- [`ripemd320`][RIPEMD-160]

[BLAKE2]: https://www.blake2.net/
[BLAKE3]: https://blake3.io/
[FIPS-180-4]: http://dx.doi.org/10.6028/NIST.FIPS.180-4
[FIPS-202]: http://dx.doi.org/10.6028/NIST.FIPS.202
[KECCAK]: https://keccak.team/keccak.html
[RFC-1186]: https://www.rfc-editor.org/rfc/rfc1186.html
[RFC-1319]: https://www.rfc-editor.org/rfc/rfc1319.html
[RFC-1321]: https://www.rfc-editor.org/rfc/rfc1321.html
[RIPEMD-160]: https://homes.esat.kuleuven.be/~bosselae/ripemd160/pdf/AB-9601/AB-9601.pdf
