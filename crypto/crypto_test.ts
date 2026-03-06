// Copyright 2018-2026 the Deno authors. MIT license.
import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertNotEquals,
  assertRejects,
  assertThrows,
  fail,
} from "@std/assert";
import {
  crypto as stdCrypto,
  DIGEST_ALGORITHM_NAMES,
  type DigestAlgorithmName,
} from "./mod.ts";
import { repeat } from "@std/bytes/repeat";
import { encodeHex } from "@std/encoding/hex";
import { partition } from "@std/collections/partition";

const webCrypto = globalThis.crypto;

Deno.test(
  "digest() handles different ways to perform the same operation should produce the same result",
  async () => {
    const inputString = "taking the hobbits to isengard";
    const inputBytes = new TextEncoder().encode(inputString);
    const inputPieces = [inputBytes.slice(0, 8), inputBytes.slice(8)];

    const emptyDigest =
      "38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b";
    const expectedDigest =
      "ae30c171b2b5a047b7986c185564407672441934a356686e6df3a8284f35214448c40738e65b8c308e38b068eed91676";

    assertEquals(
      encodeHex(stdCrypto.subtle.digestSync("SHA-384", inputBytes)),
      expectedDigest,
    );

    assertEquals(
      encodeHex(
        await stdCrypto.subtle.digest(
          "SHA-384",
          ReadableStream.from([inputBytes]),
        ),
      ),
      expectedDigest,
    );

    assertEquals(
      encodeHex(
        await stdCrypto.subtle.digest(
          "SHA-384",
          new Blob([inputBytes]).stream(),
        ),
      ),
      expectedDigest,
    );

    assertEquals(
      encodeHex(stdCrypto.subtle.digestSync("SHA-384", [inputBytes])),
      expectedDigest,
    );

    type Uint8Array_ = ReturnType<Uint8Array["slice"]>;

    assertEquals(
      encodeHex(
        await stdCrypto.subtle.digest(
          "SHA-384",
          (async function* () {
            yield new Uint16Array();
            yield inputPieces[0] as Uint8Array_;
            yield new ArrayBuffer(0);
            yield inputPieces[1] as Uint8Array_;
          })(),
        ),
      ),
      expectedDigest,
    );

    assertEquals(
      encodeHex(
        stdCrypto.subtle.digestSync(
          "SHA-384",
          (function* () {
            yield new ArrayBuffer(0);
            yield* inputPieces;
            yield new Int8Array();
          })(),
        ),
      ),
      expectedDigest,
    );

    assertEquals(
      encodeHex(
        await stdCrypto.subtle.digest(
          "SHA-384",
          (function* () {
            yield inputBytes;
          })(),
        ),
      ),
      expectedDigest,
    );

    assertEquals(
      encodeHex(await webCrypto.subtle!.digest("SHA-384", inputBytes)),
      expectedDigest,
    );

    assertEquals(
      encodeHex(stdCrypto.subtle.digestSync("SHA-384", new ArrayBuffer(0))),
      emptyDigest,
    );

    assertEquals(
      encodeHex(await stdCrypto.subtle.digest("SHA-384", new ArrayBuffer(0))),
      emptyDigest,
    );
  },
);

Deno.test("digest() returns an ArrayBuffer", async () => {
  const inputString = "taking the hobbits to isengard";
  const inputBytes = new TextEncoder().encode(inputString);

  assert(
    (await stdCrypto.subtle.digest(
      "BLAKE3",
      inputBytes,
    )) instanceof ArrayBuffer,
  );

  assert(
    (await stdCrypto.subtle.digest(
      "BLAKE3",
      (function* () {
        yield inputBytes;
      })(),
    )) instanceof ArrayBuffer,
  );

  assert(
    (await stdCrypto.subtle.digest(
      "BLAKE3",
      (async function* () {
        yield inputBytes;
      })(),
    )) instanceof ArrayBuffer,
  );

  assert(
    (await stdCrypto.subtle.digest(
      "BLAKE3",
      ReadableStream.from([inputBytes]),
    )) instanceof ArrayBuffer,
  );
});

Deno.test("digest() handles length option", async (t) => {
  const inputString = "taking the hobbits to isengard";
  const inputBytes = new TextEncoder().encode(inputString);

  const [supportedAlgorithmNames, unsupportedAlgorithmNames] = partition(
    DIGEST_ALGORITHM_NAMES,
    (name) => ["BLAKE3", "SHAKE128", "SHAKE256"].includes(name),
  );

  const [unsupportedAlgorithmNamesIgnore, unsupportedAlgorithmNamesThrow] =
    partition(
      unsupportedAlgorithmNames,
      (name) => ["SHA-1", "SHA-256", "SHA-384", "SHA-512"].includes(name),
    );

  for (const name of supportedAlgorithmNames) {
    await t.step(`${name} supports length option (async)`, async () => {
      assertEquals(
        new Uint8Array(
          await stdCrypto.subtle.digest({ name, length: 0 }, inputBytes),
        ),
        new Uint8Array(0),
      );
    });
  }

  for (const name of unsupportedAlgorithmNamesThrow) {
    await t.step(`${name} does not support length option (async)`, async () => {
      await assertRejects(
        () => stdCrypto.subtle.digest({ name, length: 0 }, inputBytes),
        TypeError,
        "non-default length specified for non-extendable algorithm",
      );
    });
  }

  for (const name of unsupportedAlgorithmNamesIgnore) {
    await t.step(`${name} ignores length option (async)`, async () => {
      assertNotEquals(
        new Uint8Array(
          await stdCrypto.subtle.digest({ name, length: 0 }, inputBytes),
        ).length,
        0,
      );
    });
  }

  for (const name of supportedAlgorithmNames) {
    await t.step(`${name} supports length option (sync)`, () => {
      assertEquals(
        new Uint8Array(
          stdCrypto.subtle.digestSync({ name, length: 0 }, inputBytes),
        ),
        new Uint8Array(0),
      );
    });
  }

  for (const name of unsupportedAlgorithmNamesThrow) {
    await t.step(`${name} does not support length option (sync)`, () => {
      assertThrows(
        () => stdCrypto.subtle.digestSync({ name, length: 0 }, inputBytes),
        TypeError,
        "non-default length specified for non-extendable algorithm",
      );
    });
  }

  assertEquals(
    new Uint8Array(
      await stdCrypto.subtle.digest({ name: "BLAKE3", length: 6 }, inputBytes),
    ),
    new Uint8Array([167, 193, 151, 192, 40, 100]),
  );
});

Deno.test("digest() keeps memory usage reasonable with large inputs", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "--no-lock", "crypto/testdata/digest_large_inputs.ts"],
    stderr: "inherit",
  });

  const { success, stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(success, true, "test subprocess failed");
  const {
    heapBytesInitial,
    smallDigest,
    heapBytesAfterSmall,
    largeDigest,
    heapBytesAfterLarge,
  }: {
    heapBytesInitial: number;
    smallDigest: string;
    heapBytesAfterSmall: number;
    largeDigest: string;
    heapBytesAfterLarge: number;
  } = JSON.parse(output);

  assertEquals(
    smallDigest,
    "4d006976636a8696d909a630a4081aad4d7c50f81afdee04020bf05086ab6a55",
    `test subprocess returned wrong hash (${smallDigest})`,
  );
  assertEquals(
    largeDigest,
    "64fee39c5a30a8af6287b4862eed4af93c2c3fde42d10c5350ac82237c2804b5",
    `test subprocess returned wrong hash (${largeDigest})`,
  );

  // Heap should stay under 2MB even though we provided a 64MB input.
  assert(
    heapBytesInitial < 2_000_000,
    `Wasm heap was too large initially: ${
      (heapBytesInitial / 1_000_000).toFixed(1)
    } MB`,
  );
  assert(
    heapBytesAfterSmall < 2_000_000,
    `Wasm heap was too large after small input: ${
      (heapBytesAfterSmall / 1_000_000).toFixed(1)
    } MB`,
  );
  assert(
    heapBytesAfterLarge < 2_000_000,
    `Wasm heap was too large after large input: ${
      (heapBytesAfterLarge / 1_000_000).toFixed(1)
    } MB`,
  );
});

Deno.test("digest() keeps memory usage reasonable with many calls", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "--no-lock", "crypto/testdata/digest_many_calls.ts"],
    stderr: "inherit",
  });
  const { stdout, success } = await command.output();
  const output = new TextDecoder().decode(stdout);

  assert(success);
  const {
    heapBytesInitial,
    heapBytesFinal,
    stateFinal,
  }: {
    heapBytesInitial: number;
    heapBytesFinal: number;
    stateFinal: string;
  } = JSON.parse(output);

  assert(
    heapBytesInitial < 2_000_000,
    `Wasm heap was too large initially: ${
      (heapBytesInitial / 1_000_000).toFixed(1)
    } MB`,
  );
  assert(
    heapBytesFinal < 2_000_000,
    `Wasm heap was too large after many digests: ${
      (heapBytesFinal / 1_000_000).toFixed(1)
    } MB`,
  );
  assertEquals(
    stateFinal,
    "bad332864a0cd62866c18ac5623585b4b8e4fa029661e909c82ada8c06bc34d6",
    `test subprocess returned wrong hash (${stateFinal})`,
  );
});

Deno.test("digest() throws on invalid input", async () => {
  const inputString = "taking the hobbits to isengard";
  const inputBytes = new TextEncoder().encode(inputString);

  await assertRejects(
    async () => await stdCrypto.subtle.digest("BLAKE2B", {} as Iterable<never>),
    TypeError,
    "data must be a BufferSource or [Async]Iterable<BufferSource>",
  );

  await assertRejects(
    async () =>
      await stdCrypto.subtle.digest(
        "BLAKE2B",
        (async function* () {
          yield undefined;
        })() as AsyncIterable<BufferSource>,
      ),
    TypeError,
    "Cannot digest the data: A chunk is not ArrayBuffer nor ArrayBufferView",
  );

  await assertRejects(
    async () =>
      await stdCrypto.subtle.digest("BLAK" as DigestAlgorithmName, inputBytes),
    DOMException,
    "Unrecognized algorithm name",
  );
});

Deno.test("digestSync() throws on invalid input", () => {
  const inputString = "taking the hobbits to isengard";
  const inputBytes = new TextEncoder().encode(inputString);

  assertThrows(
    () => stdCrypto.subtle.digestSync("BLAKE2B", {} as Iterable<never>),
    TypeError,
    "data must be a BufferSource or Iterable<BufferSource>",
  );

  assertThrows(
    () =>
      stdCrypto.subtle.digestSync(
        "BLAKE2B",
        (function* () {
          yield undefined;
        })() as Iterable<BufferSource>,
      ),
    TypeError,
    "Cannot digest the data: A chunk is not ArrayBuffer nor ArrayBufferView",
  );

  assertThrows(
    () =>
      stdCrypto.subtle.digestSync("BLAK" as DigestAlgorithmName, inputBytes),
    TypeError,
    "unsupported algorithm",
  );
});

// Simple periodic data, but the periods shouldn't line up with any block
// or chunk sizes.
const aboutAMeg = repeat(
  new Uint8Array(1237).fill(0).map((_, i) => i % 251),
  839,
);

// The test input pattern used in BLAKE3's official test vectors.
const blake3TestInput = new Uint8Array(1_000_000).fill(0).map((_, i) =>
  i % 251
);

// These should all be equivalent views
const slicedView = new Int16Array(aboutAMeg.buffer, 226, 494443);
const dataView = new DataView(aboutAMeg.buffer, 226, 16 / 8 * 494443);
const slicedCopy = new Uint8Array(
  aboutAMeg.subarray(226, 226 + 16 / 8 * 494443),
);
const bufferCopy = slicedCopy.buffer;

// Test result when an error is expected for all algorithms.
const allErrors = {
  BLAKE2B: Error,
  "BLAKE2B-128": Error,
  "BLAKE2B-160": Error,
  "BLAKE2B-224": Error,
  "BLAKE2B-256": Error,
  "BLAKE2B-384": Error,
  BLAKE2S: Error,
  BLAKE3: Error,
  "KECCAK-224": Error,
  "KECCAK-256": Error,
  "KECCAK-384": Error,
  "KECCAK-512": Error,
  MD4: Error,
  MD5: Error,
  "RIPEMD-160": Error,
  "SHA-1": Error,
  "SHA-224": Error,
  "SHA-256": Error,
  "SHA3-224": Error,
  "SHA3-256": Error,
  "SHA3-384": Error,
  "SHA3-512": Error,
  "SHA-384": Error,
  "SHA-512": Error,
  SHAKE128: Error,
  SHAKE256: Error,
  TIGER: Error,
  FNV32: Error,
  FNV32A: Error,
  FNV64: Error,
  FNV64A: Error,
} as const;

// Test inputs and expected results for each algorithm.
const digestCases: [
  // Caption for test error messages.
  string,
  // The input messages pieces, all expected to produce the same hash
  // (presumably the same value but in different representations).
  (BufferSource | string)[][],
  // The digest options being used (typically none, {}).
  { length?: number },
  // The expected digest output for each hash algorithm, or an Error type if the
  // algorithm isn't expected to this input.
  Record<DigestAlgorithmName, string | ErrorConstructor>,
][] = [
  ["Empty", [[], [""], [new ArrayBuffer(0), new BigInt64Array(0)]], {}, {
    BLAKE2B:
      "786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce",
    "BLAKE2B-128": "cae66941d9efbd404e4d88758ea67670",
    "BLAKE2B-160": "3345524abf6bbe1809449224b5972c41790b6cf2",
    "BLAKE2B-224": "836cc68931c2e4e3e838602eca1902591d216837bafddfe6f0c8cb07",
    "BLAKE2B-256":
      "0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8",
    "BLAKE2B-384":
      "b32811423377f52d7862286ee1a72ee540524380fda1724a6f25d7978c6fd3244a6caf0498812673c5e05ef583825100",
    BLAKE2S: "69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9",
    BLAKE3: "af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262",
    "KECCAK-224": "f71837502ba8e10837bdd8d365adb85591895602fc552b48b7390abd",
    "KECCAK-256":
      "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "KECCAK-384":
      "2c23146a63a29acf99e73b88f8c24eaa7dc60aa771780ccc006afbfa8fe2479b2dd2b21362337441ac12b515911957ff",
    "KECCAK-512":
      "0eab42de4c3ceb9235fc91acffe746b29c29a8c366b7c60e4e67c466f36a4304c00fa9caf9d87976ba469bcbe06713b435f091ef2769fb160cdab33d3670680e",
    MD4: "31d6cfe0d16ae931b73c59d7e0c089c0",
    MD5: "d41d8cd98f00b204e9800998ecf8427e",
    "RIPEMD-160": "9c1185a5c5e9fc54612808977ee8f548b2258d31",
    "SHA-1": "da39a3ee5e6b4b0d3255bfef95601890afd80709",
    "SHA-224": "d14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f",
    "SHA-256":
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "SHA3-224": "6b4e03423667dbb73b6e15454f0eb1abd4597f9a1b078e3f5b5a6bc7",
    "SHA3-256":
      "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
    "SHA3-384":
      "0c63a75b845e4f7d01107d852e4c2485c51a50aaaa94fc61995e71bbee983a2ac3713831264adb47fb6bd1e058d5f004",
    "SHA3-512":
      "a69f73cca23a9ac5c8b567dc185a756e97c982164fe25859e0d1dcc1475c80a615b2123af1f5f94c11e3e9402c3ac558f500199d95b6d3e301758586281dcd26",
    "SHA-384":
      "38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b",
    "SHA-512":
      "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
    SHAKE128:
      "7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef26",
    SHAKE256:
      "46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762fd75dc4ddd8c0f200cb05019d67b592f6fc821c49479ab48640292eacb3b7c4be",
    TIGER: "3293ac630c13f0245f92bbb1766e16167a4e58492dde73f3",
    FNV32: "811c9dc5",
    FNV32A: "811c9dc5",
    FNV64: "cbf29ce484222325",
    FNV64A: "cbf29ce484222325",
  }],

  [
    "One zero byte",
    [["\x00"], ["", "\x00", "", ""], [new ArrayBuffer(1)], [
      new Uint8ClampedArray(1),
    ]],
    {},
    {
      BLAKE2B:
        "2fa3f686df876995167e7c2e5d74c4c7b6e48f8068fe0e44208344d480f7904c36963e44115fe3eb2a3ac8694c28bcb4f5a0f3276f2e79487d8219057a506e4b",
      "BLAKE2B-128": "7025e075d5e2f6cde3cc051a31f07660",
      "BLAKE2B-160": "082ad992fb76871c33a1b9993a082952feaca5e6",
      "BLAKE2B-224": "0d94e174732ef9aae73f395ab44507bfa983d65023c11a951f0c32e4",
      "BLAKE2B-256":
        "03170a2e7597b7b7e3d84c05391d139a62b157e78786d8c082f29dcf4c111314",
      "BLAKE2B-384":
        "cc01088536f784f0bb769e41c4957b6d0cde1fcc8cf1d91fc477d4dd6e3fbfcd43d1698d146f348b2c36a339682bec3f",
      BLAKE2S:
        "e34d74dbaf4ff4c6abd871cc220451d2ea2648846c7757fbaac82fe51ad64bea",
      BLAKE3:
        "2d3adedff11b61f14c886e35afa036736dcd87a74d27b5c1510225d0f592e213",
      "KECCAK-224": "b7e52d015afb9bb56c19955720964f1a68b1aba96a7a9454472927be",
      "KECCAK-256":
        "bc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a",
      "KECCAK-384":
        "9265ed0d889a1327114cffa6fa682dce051855e24f9393a3faa7e4791124c9db1abef28f95f677134edefc63b02066d9",
      "KECCAK-512":
        "40f0a44b4452c44baf401b49411f861caac716ba87be7d6894757f1114fcec44a4d4a9f44bcab569fabc676e761fe9d097dd191d5d9c71d66250b3e867071553",
      MD4: "47c61a0fa8738ba77308a8a600f88e4b",
      MD5: "93b885adfe0da089cdf634904fd59f71",
      "RIPEMD-160": "c81b94933420221a7ac004a90242d8b1d3e5070d",
      "SHA-1": "5ba93c9db0cff93f52b521d7420e43f6eda2784f",
      "SHA-224": "fff9292b4201617bdc4d3053fce02734166a683d7d858a7f5f59b073",
      "SHA-256":
        "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
      "SHA3-224": "bdd5167212d2dc69665f5a8875ab87f23d5ce7849132f56371a19096",
      "SHA3-256":
        "5d53469f20fef4f8eab52b88044ede69c77a6a68a60728609fc4a65ff531e7d0",
      "SHA3-384":
        "127677f8b66725bbcb7c3eae9698351ca41e0eb6d66c784bd28dcdb3b5fb12d0c8e840342db03ad1ae180b92e3504933",
      "SHA3-512":
        "7127aab211f82a18d06cf7578ff49d5089017944139aa60d8bee057811a15fb55a53887600a3eceba004de51105139f32506fe5b53e1913bfa6b32e716fe97da",
      "SHA-384":
        "bec021b4f368e3069134e012c2b4307083d3a9bdd206e24e5f0d86e13d6636655933ec2b413465966817a9c208a11717",
      "SHA-512":
        "b8244d028981d693af7b456af8efa4cad63d282e19ff14942c246e50d9351d22704a802a71c3580b6370de4ceb293c324a8423342557d4e5c38438f0e36910ee",
      SHAKE128:
        "0b784469a0628e03861cd8a196dfafa0e9e8056d04cddcc49f0746b9ad43ccb2",
      SHAKE256:
        "b8d01df855f7075882c636f6ddeacf41e5de0bbf30042ef0a86e36f4b8600d546c516501a6a3c821678d3d9943fa9e74b9b99fccd47aecc91dd1f4946b8355b3",
      TIGER: "5d9ed00a030e638bdb753a6a24fb900e5a63b8e73e6c25b6",
      FNV32: "050c5d1f",
      FNV32A: "050c5d1f",
      FNV64: "af63bd4c8601b7df",
      FNV64A: "af63bd4c8601b7df",
    },
  ],

  ['The character "a"', [["a"], ["", "a"]], {}, {
    BLAKE2B:
      "333fcb4ee1aa7c115355ec66ceac917c8bfd815bf7587d325aec1864edd24e34d5abe2c6b1b5ee3face62fed78dbef802f2a85cb91d455a8f5249d330853cb3c",
    "BLAKE2B-128": "27c35e6e9373877f29e562464e46497e",
    "BLAKE2B-160": "948caa2db61bc4cdb4faf7740cd491f195043914",
    "BLAKE2B-224": "c05d5ea0257c7a4604122b8e99a0093f89d0797ef06a7f0af65a3560",
    "BLAKE2B-256":
      "8928aae63c84d87ea098564d1e03ad813f107add474e56aedd286349c0c03ea4",
    "BLAKE2B-384":
      "7d40de16ff771d4595bf70cbda0c4ea0a066a6046fa73d34471cd4d93d827d7c94c29399c50de86983af1ec61d5dcef0",
    BLAKE2S: "4a0d129873403037c2cd9b9048203687f6233fb6738956e0349bd4320fec3e90",
    BLAKE3: "17762fddd969a453925d65717ac3eea21320b66b54342fde15128d6caf21215f",
    "KECCAK-224": "7cf87d912ee7088d30ec23f8e7100d9319bff090618b439d3fe91308",
    "KECCAK-256":
      "3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb",
    "KECCAK-384":
      "85e964c0843a7ee32e6b5889d50e130e6485cffc826a30167d1dc2b3a0cc79cba303501a1eeaba39915f13baab5abacf",
    "KECCAK-512":
      "9c46dbec5d03f74352cc4a4da354b4e9796887eeb66ac292617692e765dbe400352559b16229f97b27614b51dbfbbb14613f2c10350435a8feaf53f73ba01c7c",
    MD4: "bde52cb31de33e46245e05fbdbd6fb24",
    MD5: "0cc175b9c0f1b6a831c399e269772661",
    "RIPEMD-160": "0bdc9d2d256b3ee9daae347be6f4dc835a467ffe",
    "SHA-1": "86f7e437faa5a7fce15d1ddcb9eaeaea377667b8",
    "SHA-224": "abd37534c7d9a2efb9465de931cd7055ffdb8879563ae98078d6d6d5",
    "SHA-256":
      "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
    "SHA3-224": "9e86ff69557ca95f405f081269685b38e3a819b309ee942f482b6a8b",
    "SHA3-256":
      "80084bf2fba02475726feb2cab2d8215eab14bc6bdd8bfb2c8151257032ecd8b",
    "SHA3-384":
      "1815f774f320491b48569efec794d249eeb59aae46d22bf77dafe25c5edc28d7ea44f93ee1234aa88f61c91912a4ccd9",
    "SHA3-512":
      "697f2d856172cb8309d6b8b97dac4de344b549d4dee61edfb4962d8698b7fa803f4f93ff24393586e28b5b957ac3d1d369420ce53332712f997bd336d09ab02a",
    "SHA-384":
      "54a59b9f22b0b80880d8427e548b7c23abd873486e1f035dce9cd697e85175033caa88e6d57bc35efae0b5afd3145f31",
    "SHA-512":
      "1f40fc92da241694750979ee6cf582f2d5d7d28e18335de05abc54d0560e0f5302860c652bf08d560252aa5e74210546f369fbbbce8c12cfc7957b2652fe9a75",
    SHAKE128:
      "85c8de88d28866bf0868090b3961162bf82392f690d9e4730910f4af7c6ab3ee",
    SHAKE256:
      "867e2cb04f5a04dcbd592501a5e8fe9ceaafca50255626ca736c138042530ba436b7b1ec0e06a279bc790733bb0aee6fa802683c7b355063c434e91189b0c651",
    TIGER: "77befbef2e7ef8ab2ec8f93bf587a7fc613e247f5f247809",
    FNV32: "050c5d7e",
    FNV32A: "e40c292c",
    FNV64: "af63bd4c8601b7be",
    FNV64A: "af63dc4c8601ec8c",
  }],

  [
    'The character "a" followed by a zero byte',
    [["a\x00"], ["", "a\x00"]],
    {},
    {
      BLAKE2B:
        "05970b95468b0b1941066ff189091493e73859ce41cde5ad08118e93ea1d81a57a144296a26a9fe7781481bde97b886725e36e30b305d8bd5cce1ae36bf1564a",
      "BLAKE2B-128": "396660e76c84bb7786f979f10b58fa79",
      "BLAKE2B-160": "de302e90cb156cb45d58cdf8f5a1a15ed9362c74",
      "BLAKE2B-224": "7041c42bdd8dc5e46357e4ae3d43ae419fe90e0f7806ad6ba6befe0d",
      "BLAKE2B-256":
        "d2373b17cd8a8e19e39f52fa4905a274f93805fbb8bb4c7f3cb4b2cd6708ec8a",
      "BLAKE2B-384":
        "637fe31d1e955760ef31043d525d9321826a778ddbe82fcde45a9839424138096675e2f87e36b53ab223a7fd254198fd",
      BLAKE2S:
        "ccf69953dbc8db243e506bb559f512cadc5c78ff8414a68891d06e9c22be6a4a",
      BLAKE3:
        "7eb5f2760c891ddc18f5a287558fc48767d7a5d5895c51c980a8b7380c26d5a4",
      "KECCAK-224": "1b914ebf869b542b9d8440e07ca1dfe5da48ebb1c563e928ded523c3",
      "KECCAK-256":
        "a3fe1181ce8d13858f6f383445749f49a3ae8b0cab89823918bab81153ca4300",
      "KECCAK-384":
        "028bf394389395fe49cda14bee0b5b54333babd65a9861e57c882b9ec7d752800a0a9d7abba9fdfe1c0f7dbe17378bab",
      "KECCAK-512":
        "50470286ea9f645134c527432303a7187a2a1451956148a1228d94b33edbf35ba9146301e43ddb84491469ccf1ca72cec501032df5e16958232a24ba90a93fb0",
      MD4: "186cb09181e2c2ecaac768c47c729904",
      MD5: "4144e195f46de78a3623da7364d04f11",
      "RIPEMD-160": "3213d398bb951aa09625539093524fa528848bd0",
      "SHA-1": "0a04b971b03da607ce6c455184037b660ca89f78",
      "SHA-224": "3118199937a95dd0dd06a74ac0bf1517e958f08ae87ef9d7e89f139a",
      "SHA-256":
        "ffe9aaeaa2a2d5048174df0b80599ef0197ec024c4b051bc9860cff58ef7f9f3",
      "SHA3-224": "853ee21e10638dd5d5a30ad979d7c0d1b91145fec39c8197637ce9d8",
      "SHA3-256":
        "39fdad608c5b60008da2f12414441f5f664472792c8bc1567a9fbae617800604",
      "SHA3-384":
        "03f38a5f45cd7742b1529999f875d9896d73030cad2a037b5ba56271cd140c6c4f5997a033e890ecbcf72ce7d5cab512",
      "SHA3-512":
        "8d9b65030b4721341fcff7d39811d5acbd65c730500b4a0c58aaa5150b5ec490d3508edda2d3a8a4f32a5428e39c64dc9ebf2b44edfab27863221c8b633d3fc6",
      "SHA-384":
        "defb4711c812122ba180a2ece74cfcd86dd959451cd3bc2afb672fa8a815ccc2bee6ccc03816016570d340ec992b0f0c",
      "SHA-512":
        "5c2ca3d50f46ece6066c53bd1a490cbe5f72d2738ae9417332e91e5c3f75205c639d71a9a41d67d965fa137dddf439e0ab9443a6ea44915e90d8b5b566d1c076",
      SHAKE128:
        "fa08163f906dc8a84cdf845785be46837da40e540b7ceca070dcac22ff0e1656",
      SHAKE256:
        "73b228e796a8df50b7730fbc43d9e4a2fe13a5ef27d921b97378dd6ce6a90eaefd2c4365b6adf533ec4873c58201d5075dd3b22f712eeb02aed0fc863a8641d3",
      TIGER: "5b548919bc71cca542473494052a8fab1b68c62be0f76985",
      FNV32: "70772d5a",
      FNV32A: "2b24d044",
      FNV64: "08326707b4eb37da",
      FNV64A: "089be207b544f1e4",
    },
  ],

  ['The string "ab"', [["ab"], ["a", "b"]], {}, {
    BLAKE2B:
      "b32c0573d242b3a987d8f66bd43266b7925cefab3a854950641a81ef6a3f4b97928443850545770f64abac2a75f18475653fa3d9a52c66a840da3b8617ae9607",
    "BLAKE2B-128": "3dc9ae220222e2e156b2a5abb60d01c7",
    "BLAKE2B-160": "e389cc624c1a0ef9229b53472c803dfe61d66eb4",
    "BLAKE2B-224": "2aa7d7118a3db6c9561ca3cde64aaa29f006e7d479aa2897280c741b",
    "BLAKE2B-256":
      "f65a5e77ff5e2690ad316b7b9fc28dd90cc5c9a37e617ac3eee1403de3cf9a55",
    "BLAKE2B-384":
      "3e07b630c7b43bfcc13733c3eaf42c84e358652bb0f47657aecae88b34eb77b97b59aeb0a8aba859d7e3e6bfa323da13",
    BLAKE2S: "19c3ebeed2ee90063cb5a8a4dd700ed7e5852dfc6108c84fac85888682a18f0e",
    BLAKE3: "2dc99999a6aaef3f20349d2ed4057a2b54419545dabb809e6381de1bad8337e2",
    "KECCAK-224": "54927ada38dd4928ba3bc8d40059dbe1ba68ed7f8e3a6fb3b41492f3",
    "KECCAK-256":
      "67fad3bfa1e0321bd021ca805ce14876e50acac8ca8532eda8cbf924da565160",
    "KECCAK-384":
      "d1112a0665627802eb0ff3225564b9cf6e99e1d58867a093095d16894e868549091d37e109da5c3bd671b39625e73591",
    "KECCAK-512":
      "b4828cc4e3fe9e5bc17013579be02b2a900c7afd7084c1f29450fcb267dcf1bc4def62a2cbefda507735547c203a3699f8a0d972fd13139dd73af0a3c30501e7",
    MD4: "ec388dd78999dfc7cf4632465693b6bf",
    MD5: "187ef4436122d1cc2f40dc2b92f0eba0",
    "RIPEMD-160": "8576c67fcdf6c5d2f648efa58a32856b957f401a",
    "SHA-1": "da23614e02469a0d7c7bd1bdab5c9c474b1904dc",
    "SHA-224": "db3cda86d4429a1d39c148989566b38f7bda0156296bd364ba2f878b",
    "SHA-256":
      "fb8e20fc2e4c3f248c60c39bd652f3c1347298bb977b8b4d5903b85055620603",
    "SHA3-224": "09d27a15bcbab5da828d84dbd66062e5d37049f9b165a65dc581e853",
    "SHA3-256":
      "5c828b33397f4762922e39a60c35699d2550466a52dd15ed44da37eb0bdc61e6",
    "SHA3-384":
      "dc30f83fefe3396fa0bd9709bcad28394386aa4e28ae881dc6617b361b16b969fb6a50a109068f13127b6deffbc82d4b",
    "SHA3-512":
      "01c87b5e8f094d8725ed47be35430de40f6ab6bd7c6641a4ecf0d046c55cb468453796bb61724306a5fb3d90fbe3726a970e5630ae6a9cf9f30d2aa062a0175e",
    "SHA-384":
      "c7be03ba5bcaa384727076db0018e99248e1a6e8bd1b9ef58a9ec9dd4eeebb3f48b836201221175befa74ddc3d35afdd",
    "SHA-512":
      "2d408a0717ec188158278a796c689044361dc6fdde28d6f04973b80896e1823975cdbf12eb63f9e0591328ee235d80e9b5bf1aa6a44f4617ff3caf6400eb172d",
    SHAKE128:
      "3590d7cf18ba3fea38f3a8df51ef85c16bb3ded30b3480134e940212ffa31208",
    SHAKE256:
      "effb6ac214e5d8dbd7e15272e8ed64565fa4a0feda65f13f2fe38f1c24e11fa8c837e99c2437afc571e9ca38dee96998eb3ffde353b5dad6a49360f5871353c2",
    TIGER: "c8ba0c91823f24eb1516c30d110c46474c0509a77c7275ef",
    FNV32: "70772d38",
    FNV32A: "4d2505ca",
    FNV64: "08326707b4eb37b8",
    FNV64A: "089c4407b545986a",
  }],

  ['The string "abc"', [["abc"], ["ab", "c"]], {}, {
    BLAKE2B:
      "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923",
    "BLAKE2B-128": "cf4ab791c62b8d2b2109c90275287816",
    "BLAKE2B-160": "384264f676f39536840523f284921cdc68b6846b",
    "BLAKE2B-224": "9bd237b02a29e43bdd6738afa5b53ff0eee178d6210b618e4511aec8",
    "BLAKE2B-256":
      "bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319",
    "BLAKE2B-384":
      "6f56a82c8e7ef526dfe182eb5212f7db9df1317e57815dbda46083fc30f54ee6c66ba83be64b302d7cba6ce15bb556f4",
    BLAKE2S: "508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982",
    BLAKE3: "6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85",
    "KECCAK-224": "c30411768506ebe1c2871b1ee2e87d38df342317300a9b97a95ec6a8",
    "KECCAK-256":
      "4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45",
    "KECCAK-384":
      "f7df1165f033337be098e7d288ad6a2f74409d7a60b49c36642218de161b1f99f8c681e4afaf31a34db29fb763e3c28e",
    "KECCAK-512":
      "18587dc2ea106b9a1563e32b3312421ca164c7f1f07bc922a9c83d77cea3a1e5d0c69910739025372dc14ac9642629379540c17e2a65b19d77aa511a9d00bb96",
    MD4: "a448017aaf21d8525fc10ae87aa6729d",
    MD5: "900150983cd24fb0d6963f7d28e17f72",
    "RIPEMD-160": "8eb208f7e05d987a9b044a8e98c6b087f15a0bfc",
    "SHA-1": "a9993e364706816aba3e25717850c26c9cd0d89d",
    "SHA-224": "23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7",
    "SHA-256":
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    "SHA3-224": "e642824c3f8cf24ad09234ee7d3c766fc9a3a5168d0c94ad73b46fdf",
    "SHA3-256":
      "3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532",
    "SHA3-384":
      "ec01498288516fc926459f58e2c6ad8df9b473cb0fc08c2596da7cf0e49be4b298d88cea927ac7f539f1edf228376d25",
    "SHA3-512":
      "b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0",
    "SHA-384":
      "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
    "SHA-512":
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
    SHAKE128:
      "5881092dd818bf5cf8a3ddb793fbcba74097d5c526a6d35f97b83351940f2cc8",
    SHAKE256:
      "483366601360a8771c6863080cc4114d8db44530f8f1e1ee4f94ea37e78b5739d5a15bef186a5386c75744c0527e1faa9f8726e462a12a4feb06bd8801e751e4",
    TIGER: "2aab1484e8c158f2bfb8c5ff41b57a525129131c957b5f93",
    FNV32: "439c2f4b",
    FNV32A: "1a47e90b",
    FNV64: "d8dcca186bafadcb",
    FNV64A: "e71fa2190541574b",
  }],

  ['The string "deno"', [["deno"], ["de", "no"]], {}, {
    BLAKE2B:
      "4497d020960f2b1af17b2b92c5d4ad3cdae9ad467cae6714d49c25c04bb6a2fd3906cdc9e1b85feafea3a947c979a1c8ebc1d9c3427ba78bde76f688646b74f3",
    "BLAKE2B-128": "72c12ff54c63ef2cdbb033f3de893057",
    "BLAKE2B-160": "fa868088559126444713c99bf50cec0c60b25386",
    "BLAKE2B-224": "50b36844947ae8852458bad0eb1b89ec9c071ad27b98f5534a44646e",
    "BLAKE2B-256":
      "66839e9f6d998752d2a9f100629e16691504264d21ad10939ca939e557e75248",
    "BLAKE2B-384":
      "e296c0eebafba162e22590da157532d9cb11dfe80cf017bff4e0264b8639f4c1b11a91ee005a4b924aa4329962d61089",
    BLAKE2S: "75262f749537fd45f227efb42b9f4b5eda79e27e9ba68b87725e840f8c1c1447",
    BLAKE3: "e5dd810dd67713fab4438e17516c7ea13a35666900ece70a561184ff68de8d79",
    "KECCAK-224": "eac9e095e9fc33db1134f07955444d7655eed64f96f5de5261e96cca",
    "KECCAK-256":
      "a76ec0ee8032c358a9697caa436ee1c2283a4073e48ecb5231f0ddea4f0a3921",
    "KECCAK-384":
      "67f6026c3741e241919b19c1ade12b83576239e1738494c43614b1c84c31b3d4b928f135cd0db4189fdbb9d41c0c5fd0",
    "KECCAK-512":
      "fddc1dfda24ee1c1ac011bfbc0d8dd3340af4ab49444d3c978114b05b8a5a9240c725c4b37c6681a3286a0f1a4891eb77d5d5ba46b50e9ade42339c200293930",
    MD4: "594749a3bef632d12ab7067469aa8aed",
    MD5: "c8772b401bc911da102a5291cc4ec83b",
    "RIPEMD-160": "dc3c354a2004fc9bf46c64729e9b556eb414b812",
    "SHA-1": "bb3d8e712d9e7ad4af08d4a38f3f52d9683d58eb",
    "SHA-224": "c34ee73c656a6a6437b70610e261be4412c650acabdb20e26f11f620",
    "SHA-256":
      "e872e7bd2ae6abcf13a4c834029a342c882c1162ebf77b6720968b2000312ffb",
    "SHA3-224": "4da3f5328887217780db9790d71a978e2ad19927616ba8863d79ce33",
    "SHA3-256":
      "74a6286af90f8775d74080f864cf80b11eecf6f14d325c5ef8c9f7ccc8055517",
    "SHA3-384":
      "9cb19574077f07a44d980e9e84bc155951f37d97fa527ae6007cb0252274d8b392523110d10101cef1f0bde11fd95dee",
    "SHA3-512":
      "9e248199d744a8d810e7fda8207f98f27453bd6cb5a02965b5477d3d07516bbac6831009eedddadc8901d742dbfe3fd4afa770230a84e4d51bf30a0c99efa03c",
    "SHA-384":
      "d6a359079da9d9a1c8ecec1d84b85ed9ca198976bfa50953867536d79e8628480f6e63adcb7f6a782de68bf5a1c96349",
    "SHA-512":
      "05b6ef7b13673c57c455d968cb7acbdd4fe10e24f25520763d69025d768d14124987b14e3aff8ff1565aaeba1c405fc89cc435938ff46a426f697b0f509e3799",
    SHAKE128:
      "3807a9a8ab333a92edcfc1c2ada9c8a03de98ef596ba691ea8473dea94d3371d",
    SHAKE256:
      "2badcaf4114cee41f9f0f167114b6e5d53eb5cfc9b986a00a60d50b6d9ef7e857b034e42837c84791b6b76787bf2d12cf672af9b78299f80d472882931452fa0",
    TIGER: "13ac2596a881dfc66046e235acd4bc6909d73a2c9aa449b9",
    FNV32: "6ed5a7a9",
    FNV32A: "8ef64711",
    FNV64: "14edb27eecdaadc9",
    FNV64A: "a5d9fb67426e48b1",
  }],

  ['The string "foobar"', [["foobar"], ["foo", "bar"]], {}, {
    BLAKE2B:
      "8df31f60d6aeabd01b7dc83f277d0e24cbe104f7290ff89077a7eb58646068edfe1a83022866c46f65fb91612e516e0ecfa5cb25fc16b37d2c8d73732fe74cb2",
    "BLAKE2B-128": "13b16eec2597e4d5616a70b1abd318b0",
    "BLAKE2B-160": "ebcc6b9c81d5f54d139448349d46ec963c9eda7a",
    "BLAKE2B-224": "e286854b0cce9426a215a21ca5d7acf9ab39e0f7fe5d20782390c8c1",
    "BLAKE2B-256":
      "93a0e84a8cdd4166267dbe1263e937f08087723ac24e7dcc35b3d5941775ef47",
    "BLAKE2B-384":
      "1168c00db3e3665c2998fe7f39b9be0cd6b2846c7dfe7bcb8f5b6e3510805704df4115214d8c01ccc5154ee5a6b463ac",
    BLAKE2S: "03a4921c6b0aa0e5bed57228a3b6fd61bec160d46fa610ce6742dd51ab311f43",
    BLAKE3: "aa51dcd43d5c6c5203ee16906fd6b35db298b9b2e1de3fce81811d4806b76b7d",
    "KECCAK-224": "f5dd6617f67e2b6a7b5ef75d1931ef36ee63ca35d06bcc714a74a386",
    "KECCAK-256":
      "38d18acb67d25c8bb9942764b62f18e17054f66a817bd4295423adf9ed98873e",
    "KECCAK-384":
      "e8c02310ada7fbf1c550713cdaa0a3eaf02ee13990f73851e7e5a183f99df541d833424e702e4e22eb4306b7bcbeb965",
    "KECCAK-512":
      "927618d193a11374f6072cdcb8c410e2f18e0c433eb35a9f11ce3035b0066811db6c03a723a2855c4a8ee2b1c842e28d4982a1ff312dd4ddaf807b96d4d2ee1b",
    MD4: "547aefd231dcbaac398625718336f143",
    MD5: "3858f62230ac3c915f300c664312c63f",
    "RIPEMD-160": "a06e327ea7388c18e4740e350ed4e60f2e04fc41",
    "SHA-1": "8843d7f92416211de9ebb963ff4ce28125932878",
    "SHA-224": "de76c3e567fca9d246f5f8d3b2e704a38c3c5e258988ab525f941db8",
    "SHA-256":
      "c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2",
    "SHA3-224": "1ad852ba147a715fe5a3df39a741fad08186c303c7d21cefb7be763b",
    "SHA3-256":
      "09234807e4af85f17c66b48ee3bca89dffd1f1233659f9f940a2b17b0b8c6bc5",
    "SHA3-384":
      "0fa8abfbdaf924ad307b74dd2ed183b9a4a398891a2f6bac8fd2db7041b77f068580f9c6c66f699b496c2da1cbcc7ed8",
    "SHA3-512":
      "ff32a30c3af5012ea395827a3e99a13073c3a8d8410a708568ff7e6eb85968fccfebaea039bc21411e9d43fdb9a851b529b9960ffea8679199781b8f45ca85e2",
    "SHA-384":
      "3c9c30d9f665e74d515c842960d4a451c83a0125fd3de7392d7b37231af10c72ea58aedfcdf89a5765bf902af93ecf06",
    "SHA-512":
      "0a50261ebd1a390fed2bf326f2673c145582a6342d523204973d0219337f81616a8069b012587cf5635f6925f1b56c360230c19b273500ee013e030601bf2425",
    SHAKE128:
      "a2a5933ad57401cfc082ec7db10c730f484bcc65ac1a4dd6c41277a123e26288",
    SHAKE256:
      "d9b219853298b92373f90479065636a9d143e024f071ac3f7c84636da948ad69cff430200773b6dd82dead6b5b3f0c582f4564d396e09bf1bf6c152aa61fef96",
    TIGER: "c8cd4bf6959a162866c37fb6745f372cc919ffaa05560eef",
    FNV32: "31f0b262",
    FNV32A: "bf9cf968",
    FNV64: "340d8765a4dda9c2",
    FNV64A: "85944171f73967e8",
  }],

  [
    'The string "foobar" followed by a zero byte',
    [["foobar\x00"], ["foo", "bar", "\x00"]],
    {},
    {
      BLAKE2B:
        "750039a4ee41621ab2f0834f3fbaf4ecb6c4f6997774defc5c8e6833ff542abc479f35ab2eeb006de75bb880b0a08d90a98e322a7db2a612306db17ceca9f028",
      "BLAKE2B-128": "64f8772077befede884b98c0f9abcc33",
      "BLAKE2B-160": "bf4ea02cdde4d9eab182294eef5b239b169b4ef9",
      "BLAKE2B-224": "7134b40fdc51511e22044f1687c97ca885c40c1ff3c5c4aae224d1cf",
      "BLAKE2B-256":
        "0a97d23ee6a748c05b0f55fe79d839e78e8277625ef297d0ae58fc7c27c882f9",
      "BLAKE2B-384":
        "91befd6e142c7eda8a58864026736cf98e5fa20a532ef7c5939d2971463913e2c9ec5d918290b3290a4baabb84b9f6f0",
      BLAKE2S:
        "64bcd3eda796749226f8ada3ea47d490dcfdee8e58ed176ff129e54af069531e",
      BLAKE3:
        "1abd166f8ef2c3a091eff0308f773626bfbdda1db93a24a11570625faf84fb02",
      "KECCAK-224": "2acebde4d64b373dd9c8e65617d5822d58b45ca88d7bbcfbe85c26f5",
      "KECCAK-256":
        "48f41321479523f12ae67d2eb63a3d9efd33d30285619100f4f83ae30a11b5f3",
      "KECCAK-384":
        "8331e1972f0d8a34175f08d8fdd0244eb0ef66975a04c15f062e7d5c6eaa874ffdf7264d6928bc3538ee7fb3ae6702cc",
      "KECCAK-512":
        "84b7697f864ddc40f2d7acbc0b2e7e3009dad7e1d720dee5911ab48c8380c61fb5d505db208c6979860e3ec05758da577e2443d7e2976bdeecf09950d9280db0",
      MD4: "bb00a8a852c1ba8c0b6e290f2e191b48",
      MD5: "b4258860eea29e875e2ee4019763b2bb",
      "RIPEMD-160": "33553915bf71231666f258827f083077b772f8ed",
      "SHA-1": "09f154eb32d00226cec9f2775c5bbaa5a611533b",
      "SHA-224": "dbc53a1087f959e5ce1b1df286cd67bdb412a30f477bdacf9b734a80",
      "SHA-256":
        "16917ee356726e4f1fa989280750b2f956a8d4e4e0f2ad7e20bd7ed3bb07c063",
      "SHA3-224": "596dd10599ea64370e43d88bad14987f1eaf0d9ed7ec0bd4347719a4",
      "SHA3-256":
        "2bf9bc8593ce457feaca74dfe875003ae9cccabaa762ec10935a35b36b866826",
      "SHA3-384":
        "39547ddd5b4ed8b12e71470ea2721df98f9dc28734f72a20e1865ce115660d98d38e21ffc073e597b0a14fa941bfa6ef",
      "SHA3-512":
        "d1f01c0c4186b5cd8cb2a10bb55189926ad5ebeb758cfc58dc130fb2051b0ec976f407a669e8c37b6ba4901596950afb2d4dee89386b1a5bfaff31d2e90420d8",
      "SHA-384":
        "7b244516e9109a2cfccd16acfa3f1730ebde68531370e54e13cc06cf222e08f314723bfaa7699cc9a526d43ae24b6e0d",
      "SHA-512":
        "b75225f303707805c64866dd5f11a754c1722c6912c672f7e46f6726f51a7c8b192ae33f954127f9521f208d80a00dfc77e7e6df6c350c35b8d1a3ddcfdfe6ad",
      SHAKE128:
        "3c303690ac39830b68f874ab6ffaa155d9ecfb5a07e14e23ce82721cf96eeff6",
      SHAKE256:
        "2218ff244eda40af99d6a72218aac92ff5cfc37c0ae6309df69ecf657bfdb1053273e2653d02df0bc72966bcee691ea410db322361231a11f447437c5f422fe9",
      TIGER: "ed7653244e5cf81b52589f09e8d4c50decd4514de90931de",
      FNV32: "ffe8d046",
      FNV32A: "0c1c9eb8",
      FNV64: "50a6d3b724a774a6",
      FNV64A: "34531ca7168b8f38",
    },
  ],

  ["Output length: 20", [["", "hello world", ""], ["hello ", "world"]], {
    length: 20,
  }, {
    ...allErrors,
    "BLAKE2B-160": "70e8ece5e293e1bda064deef6b080edde357010f",
    BLAKE3: "d74981efa70a0c880b8d8c1985d075dbcbf679b9",
    "RIPEMD-160": "98c615784ccb5fe5936fbc0cbe9dfdb408d92f0f",
    "SHA-1": "2aae6c35c94fcfb415dbe95f408b9ce91ee846ed",
    SHAKE128: "3a9159f071e4dd1c8c4f968607c30942e120d815",
    SHAKE256: "369771bb2cb9d2b04c1d54cca487e372d9f187f7",
  }],

  ["Output length: 3", [["hello world"], ["hell", "o w", "orld"]], {
    length: 3,
  }, {
    ...allErrors,
    BLAKE3: "d74981",
    SHAKE128: "3a9159",
    SHAKE256: "369771",
  }],

  ["Output length: 123", [["hello world"], ["hell", "o w", "orld"]], {
    length: 123,
  }, {
    ...allErrors,
    BLAKE3:
      "d74981efa70a0c880b8d8c1985d075dbcbf679b99a5f9914e5aaf96b831a9e24a020ed55aed9a6ab2eaf3fd70d2c98c949e142d8f42a10250190b699e02cf9eb68612e1a556fee6cf726bcb0994f7d3e669eda394788f8c80a4f0ea056be3d4dffd8069d7ef9a714a47a4cdef62c5402a25d7994384b07bfcf8479",
    SHAKE128:
      "3a9159f071e4dd1c8c4f968607c30942e120d8156b8b1e72e0d376e8871cb8b899072665674f26cc494a4bcf027c58267e8ee2da60e942759de86d2670bba1aa47bffd20b48b1d2aa7c3349f8215d1b99ca65bdb1770a220f67456f602436032afce7f24e534e7bfcdab9b35affa0ff891074302c19970d7359a8c",
    SHAKE256:
      "369771bb2cb9d2b04c1d54cca487e372d9f187f73f7ba3f65b95c8ee7798c527f4f3c2d55c2d46a29f2e945d469c3df27853a8735271f5cc2d9e889544357116bb60a24af659151563156eebbf68810dd95c6fcccac0650132ba30bef9bf75b0d483becb935be8688b26ffb294d8284edd64a97325d6be0a423f23",
  }],

  ["Output length: 0", [["hello world"]], {
    length: 0,
  }, {
    ...allErrors,
    BLAKE3: "",
    SHAKE128: "",
    SHAKE256: "",
  }],

  ["Output length: 4", [["hello world"]], {
    length: 4,
  }, {
    ...allErrors,
    BLAKE3: "d74981ef",
    SHAKE128: "3a9159f0",
    SHAKE256: "369771bb",
    FNV32: "548da96f",
    FNV32A: "d58b3fa7",
  }],

  ["Output length: 8", [["hello world"]], {
    length: 8,
  }, {
    ...allErrors,
    BLAKE3: "d74981efa70a0c88",
    SHAKE128: "3a9159f071e4dd1c",
    SHAKE256: "369771bb2cb9d2b0",
    FNV64: "7dcf62cdb1910e6f",
    FNV64A: "779a65e7023cd2e7",
  }],

  ["Negative length", [[""]], { length: -1 }, allErrors],

  ["Non-integer length", [[""]], { length: 1.5 }, allErrors],

  [
    "Invalid data type",
    [[{} as BufferSource], [[] as unknown as BufferSource]],
    {},
    allErrors,
  ],

  ["Too-large length", [[""]], {
    length: Number.MAX_SAFE_INTEGER * Number.MAX_SAFE_INTEGER,
  }, allErrors],

  ["About a meg", [[aboutAMeg]], {}, {
    BLAKE2B:
      "81f197a4ced23ba7bfc9e5e84f417475371b22edb36089978734d1327c39ff75eeda6598ab1c63f0829aa437b68a526f04e622f714d9d7093150e6b2f9603b5c",
    "BLAKE2B-128": "5f7d447d30b4e0eafc04130cb20269bb",
    "BLAKE2B-160": "12ae1afb8fc7d51f7b4fea2b75c9bd0ec34ac56a",
    "BLAKE2B-224": "bcab4f3527f236ebee29185804d0142a50fb87309654e7ebb0dbc628",
    "BLAKE2B-256":
      "84b033ca29abf242e3761b1657e14768cbfb4e7fc28b3d9f0f34905e5f2aa92b",
    "BLAKE2B-384":
      "0300b1c3d7deeca947263590d4777b0df0e7869ded64d63afafcfb3da4df5e542bfe309667436f534cd3b9cb9ee5f938",
    BLAKE2S: "c1b9bffb9bb1fa42f26ce72ad457bef071a7713532c37b772a3a7e8b353551fc",
    BLAKE3: "7fc79f34e187d62c474af7d57531a77f193ab6f2fae71c6de155b341cb592fe5",
    "KECCAK-224": "8186d48ddde40e518b203db01cc105f0d4a1f46341322730f9c61b51",
    "KECCAK-256":
      "c1b36a3fdc9d8c4f337a8f9cf627e703718fd2d2559b366ec310d75cd03ddc94",
    "KECCAK-384":
      "6acf1af74a00ee20aa0b03647858ed749f7cef64fcf990da3b49e48232002b2ede1e50295755ca9a06f43157cfb36dd6",
    "KECCAK-512":
      "726580def2ce92c4345c0dfe768417b022a5fc9a9fec4f960b314bf078bdc93f05057d83a8334454977960e27afaf0d3b7500e5ee862ed91fff3817a93820f63",
    MD4: "45c7d06ad9f5b7aefd65dca06ca8bfb6",
    MD5: "65ee3c415a2316553ebf2fdb2ccafd0b",
    "RIPEMD-160": "a7188285d5c8560c44deadbdbb095e8fe6ac8dec",
    "SHA-1": "74de0faec24034e7415e7a6ee379e509b29985b2",
    "SHA-224": "cfb9e6dd8dc52cb0e843067467e58a03224fbe84004b955078c98a20",
    "SHA-256":
      "ce0ae911a08c37d8e25605bc209c13e870ab3c4a40a7610ea3af989d9b0a00dd",
    "SHA3-224": "c7b818905ca367b591d17b31cac9b3c3f9158f65968725a6c65c4d82",
    "SHA3-256":
      "ff7934eb30afb91390adbd02ef2bf808eeac30bb4a7779f346a71962610874bd",
    "SHA3-384":
      "7f97aca31fa48466fdcf029396305c09ee98c0a547ff095a24af7ada72beb8448fe5d12b8c2d7e0a48822e1fe8db0387",
    "SHA3-512":
      "61bbdae5203bbf8a9effd083da83ebf18951668e658a810987ea2feb1fb810be5800fb03489a99e9f25979aa6c345477036afabcda612066b3c1213a72c05534",
    "SHA-384":
      "6f6b2d594fc88bcdfb574524e580b79c7dd74980392ad526c357860a761c8075f27c4960a38c4668c56d64520a5bebff",
    "SHA-512":
      "b3d3a7531e6bea36639bd9cf5a5c462f32d4f74a4b9878aad7405149d7962ad02e4cc1922133c43e9a2685f2927345a72c697144cbd69a895778126c1c59d455",
    SHAKE128:
      "1e99e4ac28efec6bc3af203f6a161b976389a2d036d0e42026141860d1e3a08a",
    SHAKE256:
      "e39016c524adfa6efd8019d6bc6584bbb912bed38ab896a546a2ef648e120838085103118d3409caab6ed847a67b27085bdce9ffaa6408410431a706625f07bf",
    TIGER: "111764e3c4f512abce83c7ebdf061caca4f9a04177046509",
    FNV32: "0f6ffa13",
    FNV32A: "cd8594d3",
    FNV64: "5e9b65eb61065a13",
    FNV64A: "ff4a09e55219e213",
  }],

  [
    "Different views of the same bytes",
    [[slicedView], [slicedCopy], [bufferCopy], [dataView]],
    {},
    {
      BLAKE2B:
        "dd3ce8111538e7de0842ce11835e38788b6c9436deb122dcfdf69a2fc51d0414e6e088e9ced8e275280eb945f135e5e9eb8000d0434427e67efeea8fc1f39cc5",
      "BLAKE2B-128": "aa4c50ebd4df2bce32127c1ef8a748ed",
      "BLAKE2B-160": "65e3c4006a6d6326cd221200d6a874095bb676f2",
      "BLAKE2B-224": "bc514492509639ff70ddbed44682757939267df7b56b19c5a90e4f4a",
      "BLAKE2B-256":
        "ee079520d28e52bcf61dbc1919e90d9a6c3cb66290f5f41c5521dae9c365c4fe",
      "BLAKE2B-384":
        "fbedc985d108d0690e9121e8a11c23faf5fc22a164cf30b5448e8499a86e1acd750e00f096a1f44be484a74bc1a5d076",
      BLAKE2S:
        "ecf3769441e140f8c8e0a2176cb4ef57fa09befc90a845ce5be8c99ada200bd2",
      BLAKE3:
        "8549694280dea254adb1b856779d2d4f09256004e7536bbf544a1859e66b5f9c",
      "KECCAK-224": "93ef86f74392e3a635c65df746b0f990bcb13b053301e52f51fab144",
      "KECCAK-256":
        "029a0c3cca4954e17606ac31dd3ac30492e36ecfcac3dc73e269a336782f2f1d",
      "KECCAK-384":
        "013efe9f790d52b7cd28d8763cc2c6f12583660298d02f5c151096496980d990be734074fd133a689533cc8046fc212f",
      "KECCAK-512":
        "c9cb0ac5c3be4861fc65ecd5a385b6fd10a4dd5ab7a57ffa13de7fd5df4fd12c7e39e0e96a065dae9958dcff76a86a8c3d1a156c54ce5e1096161be4601606a1",
      MD4: "c52b6ab9e096c97956d5d38d000947d2",
      MD5: "81f7e24f254ca2af692188d17b5103d8",
      "RIPEMD-160": "e4d0ecd208850e00726c0c481b888f8de06fbfce",
      "SHA-1": "b0161602fcdd324d2d0222b5c8d2873ff1f6452e",
      "SHA-224": "926ed59d539deff483058be7c73bf38a5af127a6c9e7d4da36cb3c6e",
      "SHA-256":
        "38fa97da941ae64bc1ec0d28fa14023e8041fd31857053d387d97e0ea1498203",
      "SHA3-224": "61450c57c4007d6ff219566740cf3dd3acc731bba4ec7a63bf91597b",
      "SHA3-256":
        "ec3e5fb22a6a7e2f404cb10fca361a3edc3a6f7eaaeb83a4142adf3f89e5b1d5",
      "SHA3-384":
        "b846b92db6cb89cbd848c0eac14a13ae33481fbcd33410ac5d870819edf8a89b6d661b2bdb9aac71661fc541d708348e",
      "SHA3-512":
        "8b43aec6757a768580ed9bb74e373040a25692054d5097cf0ab8f9b565c266ab6964aa02b1d54388b10bc80461f83dbc8cf9e59c8321124315b8058b1a057b2a",
      "SHA-384":
        "8eda90d308b4ef5265209e5c8477755ab09b371cd748c411a721dcd0255030b7947a7fe5c79a39fd48e135be670b7855",
      "SHA-512":
        "b7e29c5e61c67f5332740e01a1932be71aee0baf8e6d3156027585948cd58abbcf302de41978b0de26a0fb768708351963c6c01c1198e0dae7deaee448632445",
      SHAKE128:
        "ab4c60827e1521de623d8b41227d6b4a7406875f44db2356091c10f9d78e55d7",
      SHAKE256:
        "ad4ffc105a791884afd92917a64af4d9d25b1c9d41a8e06683ad03a62ee5c7166a98fdcb4b60ee55722582c0eb9f103be3b55166efa4c20fdfcc5a4e026330dd",
      TIGER: "affa436814964b03d0ab7d5743fcfdcaee2ad5ecb792e1eb",
      FNV32: "97a6bfdf",
      FNV32A: "f32b316f",
      FNV64: "9b376ead3a102abf",
      FNV64A: "efb89c849b84c10f",
    },
  ],

  [
    "Different combinations of different views of the same bytes",
    [[slicedView, bufferCopy], [slicedCopy, "", slicedView], [
      slicedCopy,
      "",
      slicedView,
    ], [
      "",
      bufferCopy,
      dataView,
    ], [dataView, new Uint8Array(), slicedCopy, ""]],
    {},
    {
      BLAKE2B:
        "0ad2f5cb56954ada6e852adcd8b3a9147e92cb68859b13ddb511a6abee263c51e32db3a4a8a78152fa0638f726c9ac96fa1fda41898bc6d7a4017d7abdbf8480",
      "BLAKE2B-128": "d57b553f747e0db24b3bad3e279bf75b",
      "BLAKE2B-160": "1a9e52d2bb2e8a2ad942cebd212ffb8188523f21",
      "BLAKE2B-224": "1f619ea6d5652ef9fe5eee4477daa6bb33a1a0d7fd54dd7cf980f7b5",
      "BLAKE2B-256":
        "be41aad5e22791bfa0b6fc37cd35ecf32b5c6170f85aabcac839fb5e0315def9",
      "BLAKE2B-384":
        "a6b745fab507fe0251102c67e7616416f94d3508160bde3cc033917469b804464a0394edaaa6d93dd28ba196df8dd970",
      BLAKE2S:
        "627f9025def22ddbf8ccfba535900aa8dd79ce532778aeae138fa797dd479008",
      BLAKE3:
        "5af7084d217935de95ffd87daadc037ba08bdda86e14e02716cb2eb4054e2297",
      "KECCAK-224": "5b620623f63faf310190cd69fada226f4ba51b5766c2eef4d69ec7f8",
      "KECCAK-256":
        "fbfcc67319c5a077a3304ff6a8bb791f1e8aa7005d0fb71511dedf706f3018db",
      "KECCAK-384":
        "72a509f9279f48192871c212a12316ef231a0ccdc063e543750d4fc635f07b4c7dc34dc0ad269b3e57013ac3eb9f092c",
      "KECCAK-512":
        "63cac04fe488807d59860ab58a802bd177d7a9ac0848578f952121a802542d7f2caf67138a06004a7f33eb4a3ba4fcab6fa650ee3986fa699030255c87aec6e6",
      MD4: "fd3fd27b70e242ab32adcfc3978ee0f0",
      MD5: "67162fd7a3a58a71b8dd3ee48d7a81de",
      "RIPEMD-160": "d4bdea1747dfc0cda2171c7b5a55b732feabb1cf",
      "SHA-1": "77fd495a283c66d4f9c28351c510fbff1458adf5",
      "SHA-224": "955a032fdcfb471142b979c30b93ed87c5ece98e7007510637f3f17a",
      "SHA-256":
        "e077f0aedd7a63888226967b9709f20485f9425fc682f08b2ba4e14a1e6035af",
      "SHA3-224": "9a98128a7f797cb533cdbfa3e99d3d74fdadf54acb0805d7aaca1d35",
      "SHA3-256":
        "949f0ce70e07fea1a7cf5c7a20253badc88e8d20403d1e2b6f3898efcb6b2268",
      "SHA3-384":
        "17b6f90433dd728dad9eed2c72ce128b359d52873d94b4764ddd9a58fcc47061448e0053f46d5add92230e6f41d54f9a",
      "SHA3-512":
        "891d21e1a4c7de0b44e69a0ea4b821cf32ac0885b10540f6633c33ef409bb8993b1eb277addeb21595deb4f392b8eef306dfb832a100403e6cb16c070cde7df8",
      "SHA-384":
        "0f3493e6027e30381d25d2902b00de9a6ad72deb000e8485d4a750356ec6aea755d6fd25330df843516ce2d3fcdd59ea",
      "SHA-512":
        "28f8c2773ba1dc4774b6d97ca2c50d7cec871fb2b0cdbb0871a3c40d426a367c92b8635e29e8d09841e9a3e39b00855f200001040e5a8eb8be64f588855ac4aa",
      SHAKE128:
        "8b8d4e2daec80c06cdf68170c54ade9745945bbd5f998763ac9f90586f203a3f",
      SHAKE256:
        "5eb886f6cfe4460a3bac6e19bae068ea67e2d13507f880b770fe32c57914e9f10b6ffee3154e4bef277499055eb6c59138ecfa74f47c47b63edc451d57606b28",
      TIGER: "198fb3a090bd39a7f084a6296b466f49e47e81112268ec22",
      FNV32: "de34e87d",
      FNV32A: "03f3befd",
      FNV64: "79f053fc79447fdd",
      FNV64A: "605dc956170c3d5d",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 0",
    [[blake3TestInput.slice(0, 0)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262e00f03e7b69af26b7faaf09fcd333050338ddfe085b8cc869ca98b206c08243a26f5487789e8f660afe6c99ef9e0c52b92e7393024a80459cf91f476f9ffdbda7001c22e159b402631f277ca96f2defdf1078282314e763699a31c5363165421cce14d",
      SHAKE128:
        "7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef263cb1eea988004b93103cfb0aeefd2a686e01fa4a58e8a3639ca8a1e3f9ae57e235b8cc873c23dc62b8d260169afa2f75ab916a58d974918835d25e6a435085b2badfd6dfaac359a5efbb7bcc4b59d538df9a04302e10c8bc1cbf1a0b3a5120ea17cda7",
      SHAKE256:
        "46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762fd75dc4ddd8c0f200cb05019d67b592f6fc821c49479ab48640292eacb3b7c4be141e96616fb13957692cc7edd0b45ae3dc07223c8e92937bef84bc0eab862853349ec75546f58fb7c2775c38462c5010d846c185c15111e595522a6bcd16cf86f3d122",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 1",
    [[blake3TestInput.slice(0, 1)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "2d3adedff11b61f14c886e35afa036736dcd87a74d27b5c1510225d0f592e213c3a6cb8bf623e20cdb535f8d1a5ffb86342d9c0b64aca3bce1d31f60adfa137b358ad4d79f97b47c3d5e79f179df87a3b9776ef8325f8329886ba42f07fb138bb502f4081cbcec3195c5871e6c23e2cc97d3c69a613eba131e5f1351f3f1da786545e5",
      SHAKE128:
        "0b784469a0628e03861cd8a196dfafa0e9e8056d04cddcc49f0746b9ad43ccb291e0c86535ff6254400d4df18bc0b840d8d505d37fd1b211c20af49fd8c8ee604299a5ece841b097b58b6bf541f9e38062ed091aa6258edf998c34b125199668da92d870fbfb05a939fc731802fb0d3a2e2bf3b328154aa087f10c93b81f9832111da0",
      SHAKE256:
        "b8d01df855f7075882c636f6ddeacf41e5de0bbf30042ef0a86e36f4b8600d546c516501a6a3c821678d3d9943fa9e74b9b99fccd47aecc91dd1f4946b8355b30a500d7bd8081e67ad4599a5c8e23706803f955aeff1686e54cdf48840e32dd2342c1a26fb27aaec2b4fe5b9111f6497143cc59be6ff2abeff59230ca332b31365af12",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 2",
    [[blake3TestInput.slice(0, 2)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "7b7015bb92cf0b318037702a6cdd81dee41224f734684c2c122cd6359cb1ee63d8386b22e2ddc05836b7c1bb693d92af006deb5ffbc4c70fb44d0195d0c6f252faac61659ef86523aa16517f87cb5f1340e723756ab65efb2f91964e14391de2a432263a6faf1d146937b35a33621c12d00be8223a7f1919cec0acd12097ff3ab00ab1",
      SHAKE128:
        "e62801291d99605599422504e24283f0633b6d9a84d60b37dc9fa04a8c59205f503a48dbf87e797fb3dc1679cbf45ddb15856d01459c4d5c42bff32ac79071735681130cb378e08abdfb71a14abc99225982d1e4ae1df06706664fd2e5e3df57f4021d7dd5a8cbcc04a39f85989299a818e830e9d53eadefca175f98976de73380933c",
      SHAKE256:
        "bc6fac1888e51c55a2019b36984c6efbbf492628c53d1397a1b8962ba80e8f223f13b5dfd1d7156229dce3cc53ff9fa38423b6ab2591b73303d4ea9389e7cf3c0e3f5a10fa966e24ec3bdba22431b226b198159f4bf230cebaeb957af28018762db55950355e5872c3606ab24e2d1a66f970b55fb2757bca64d9b4dcf35eb4fe4a0b81",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 3",
    [[blake3TestInput.slice(0, 3)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "e1be4d7a8ab5560aa4199eea339849ba8e293d55ca0a81006726d184519e647f5b49b82f805a538c68915c1ae8035c900fd1d4b13902920fd05e1450822f36de9454b7e9996de4900c8e723512883f93f4345f8a58bfe64ee38d3ad71ab027765d25cdd0e448328a8e7a683b9a6af8b0af94fa09010d9186890b096a08471e4230a134",
      SHAKE128:
        "203d4b7543731ad58bce7697b39a48eafc4fee548891d1cf94bffd231022a89627b84d6ea94edcf86cfbc98cca95987cee442bd10b3049820345202b697a9de0a4f7e60d895a782fd168c06f99664b066d0ebd206a2a0bf402ddfad23eb5140690131567f47660faf5163a2decfc20a59658214d0336cd232222f0474d5860a840de43",
      SHAKE256:
        "714501167ead924ea87e422993eea1e67df0ead7b93140c1109470fb66d50aaaff04ddafd104b481b98b1f4a81be29fa10e54a51b2cf5f804c158a95202ced095112b66e383aaf06b0afbcf715260060eb5cc7272863a4525a974eabe52faaa127ba418cfae66dfa2b4d723e513978f8dd7a8c823b28e28d11c39259caf837461f08b7",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 4",
    [[blake3TestInput.slice(0, 4)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "f30f5ab28fe047904037f77b6da4fea1e27241c5d132638d8bedce9d40494f328f603ba4564453e06cdcee6cbe728a4519bbe6f0d41e8a14b5b225174a566dbfa61b56afb1e452dc08c804f8c3143c9e2cc4a31bb738bf8c1917b55830c6e65797211701dc0b98daa1faeaa6ee9e56ab606ce03a1a881e8f14e87a4acf4646272cfd12",
      SHAKE128:
        "0b0cc28e60e37698b411234b1158a5d42636440432a28e8b8df5be04208878f9906685c2f1e1ca901bc5c419d9ac786a658c74d5f1a73536f7638853d53325e30652ebba829dd82cb355863b23ba35e72cbc7f0a88b789af3d1668a426a144bf90cc4136422a0f4980cc826ebd9148104ce7fc363ec7e6ed7595d17639f7bda3aae78c",
      SHAKE256:
        "48b8d57a5f8c29d0326049216380aa85d2d7a58b784f5a49e980ca93409e3d4bac25509371f937ef3224820eda0af0915c10d07e2df78bafe7208d23f36388a942130c01d78ab09d553a8acb47e820d27279616ed506367a8f84d999a596e445df3b097251b3a70557460d26a3f8a017ec11b34532f147c09c70edd7e9bb51e77b288a",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 5",
    [[blake3TestInput.slice(0, 4), blake3TestInput.slice(4, 5)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "b40b44dfd97e7a84a996a91af8b85188c66c126940ba7aad2e7ae6b385402aa2ebcfdac6c5d32c31209e1f81a454751280db64942ce395104e1e4eaca62607de1c2ca748251754ea5bbe8c20150e7f47efd57012c63b3c6a6632dc1c7cd15f3e1c999904037d60fac2eb9397f2adbe458d7f264e64f1e73aa927b30988e2aed2f03620",
      SHAKE128:
        "e0da1cff89d768c948759b3040da9423a6f2bbf6265474dbe0591c34edb85b83be54ad871a55c0ca590aa4637f968b08b95f1f210f71f27bb45bfd37928af5741e9385627f047ea7e62c2d91a86c65a583b0726047e92f5c515c1842b7164ad2afb1cd0ac4531838474dce45738e6d24651e4c9c02ce2b6b803f1d599bf3636c9f71ea",
      SHAKE256:
        "f3d21988c170243fa71ad748e1198aed2de43a81bdf3a2d033a800520c25a1501dde8abd6a6e64e659a305a7327b2d955a451d7693c1dd0c61ac15cd645b0bfd3bac87624ac6e87d5e9539ab10ce84ab6df4e8bed5d5174b7737b3d891e99a426cced615a141e2fcfb371b545c347e60372a48f4a55cb7d955e0ecc2593a4983e8c45e",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 6",
    [[blake3TestInput.slice(0, 6)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "06c4e8ffb6872fad96f9aaca5eee1553eb62aed0ad7198cef42e87f6a616c844611a30c4e4f37fe2fe23c0883cde5cf7059d88b657c7ed2087e3d210925ede716435d6d5d82597a1e52b9553919e804f5656278bd739880692c94bff2824d8e0b48cac1d24682699e4883389dc4f2faa2eb3b4db6e39debd5061ff3609916f3e07529a",
      SHAKE128:
        "66949b7a0951e403bee03087bbbf6a2643a9ba982403f7e203163315b04d0635619c30769eb8301f80f888c0bdb2bae3fab4355daffc12f9fd2331cc53fd5d51e1017a8951f77c71299e235df5a06e2119d4302c7618dd349578b15cf936c7270bcf30cb79388e8b8e7bb7785cff3341f26d6bd6670b79f18dfda9cbaa479708a3d8de",
      SHAKE256:
        "3a1b0d60aadb0d3d435ef65aac428a6cb122768eb8bc1ab505cbb37239e2087f4ede665f54888b9ab31cd89e81996e0d8ae8b21fe9f7263e2132cf6363223f6da1d7b8c37f9ab28e42ceda7b66926a9c8f6b39bd905ede936ef2d009767541d6db9ebdfcfc844d1c15cbc15b6631d280e2e301afd5158fd88878be7352312f86b44186",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 7",
    [[blake3TestInput.slice(0, 7)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "3f8770f387faad08faa9d8414e9f449ac68e6ff0417f673f602a646a891419fe66036ef6e6d1a8f54baa9fed1fc11c77cfb9cff65bae915045027046ebe0c01bf5a941f3bb0f73791d3fc0b84370f9f30af0cd5b0fc334dd61f70feb60dad785f070fef1f343ed933b49a5ca0d16a503f599a365a4296739248b28d1a20b0e2cc8975c",
      SHAKE128:
        "4652c0aed60f33ef1b6dd719770cffc99756d6865d74e8f27da5118b29236561aebf39475006e99e57aa03d89bf329b579df3c6ebd891a4b76ca44e167deec78fd5aeccfd42dcbd2e783f5e5e0e8bfb985993240a3d09a85ceb2338364f49153791a688735547ce3de99503e93e3aefadf553afaad767ba0feaf1c52fd3d351e31b4b3",
      SHAKE256:
        "552294355aff5c43a2c7009607e47c0ca3720536eeccb2f7560d1574ce1a197951a4164ac477db352c95bbd3c7d1d5beb1bd9778bb7f4ca58ffa6f0f2abd976682470fbdadbd3d3f05e0f8058305987999b6df6316914fb75f5048b7e43bcd704fcdd96434935783c10c5b6130240ebe9e23fd6b9ec186bdecc1e4ba7d655efe79280c",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 8",
    [[blake3TestInput.slice(0, 8)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "2351207d04fc16ade43ccab08600939c7c1fa70a5c0aaca76063d04c3228eaeb725d6d46ceed8f785ab9f2f9b06acfe398c6699c6129da084cb531177445a682894f9685eaf836999221d17c9a64a3a057000524cd2823986db378b074290a1a9b93a22e135ed2c14c7e20c6d045cd00b903400374126676ea78874d79f2dd7883cf5c",
      SHAKE128:
        "2ea7a0601b9c5cb41e469f854077c1e33aac94d39ce46163429abcacfa992bbc424ab689bb0123e0dc3e0d84376a56616ca0d2f7832f6a7facddfbc0d9d6175ae7ac86172d43f576e6af5baa80db29fc079cb737aae6cf82ea69ac6d005e072d41ff84ca47772dff4a08c2e29a5d69a564728bf5669ed8146a9fdc4edb5e58c962140d",
      SHAKE256:
        "b44dae93f2360c4914fa999f3aed53901d47a1b614109e4bfbe8a595d5dd5058142c63b0b548e296c37f8972677b7faf0c22bf85bf9c891c1b91f69184d8b6de9a32b15e289912ca731a125c15fa69403cb31158f7d6159ae3e20778b59a6f43ee3e27347d5ec238b7c3a29812406487962c239a40bcf9c41eb285caa4cd270ef7ccab",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 63",
    [[blake3TestInput.slice(0, 63)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "e9bc37a594daad83be9470df7f7b3798297c3d834ce80ba85d6e207627b7db7b1197012b1e7d9af4d7cb7bdd1f3bb49a90a9b5dec3ea2bbc6eaebce77f4e470cbf4687093b5352f04e4a4570fba233164e6acc36900e35d185886a827f7ea9bdc1e5c3ce88b095a200e62c10c043b3e9bc6cb9b6ac4dfa51794b02ace9f98779040755",
      SHAKE128:
        "e8c2c5be7ef8b003ea881c06f34334691c24267bd31ca0360faa7375b2362dd901508f7fed801b7c1c94552f17e5cdf768a76ea5975878f1e11d24c4801917b9439086f3ae151830043a276c981f46cd91d58f3a210fba60c9ef37181398018ac33a78657301cd3300c8674d134863010b3baa6a446d24999869f3b9082acdbb8e29e6",
      SHAKE256:
        "fbbd7bcc6463c166cc83e3f286efb9223fd8b98bafeb56d44eb8fb328e1fca7bc05c2dca9294f1722052511d75db5731f7e5775138d2c886208ca43985ae894c4d70251655317bfb5b3fac78fc7d10b0415656dad7bb206253a83ece2adb1227e43f60f1775d1e88b8c4e8dc41845813b5fc0840155ffe6b98f88b962d5e5d50f69e3f",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 64",
    [[blake3TestInput.slice(0, 64)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "4eed7141ea4a5cd4b788606bd23f46e212af9cacebacdc7d1f4c6dc7f2511b98fc9cc56cb831ffe33ea8e7e1d1df09b26efd2767670066aa82d023b1dfe8ab1b2b7fbb5b97592d46ffe3e05a6a9b592e2949c74160e4674301bc3f97e04903f8c6cf95b863174c33228924cdef7ae47559b10b294acd660666c4538833582b43f82d74",
      SHAKE128:
        "d96d7e90a6278534de6b95eaf3dbe0c478cf582577b36a50a3a8af6829b73404dfb15e74f34e11d218d59fe1afb3ce4f3d4df40d5bd55359fba65d0b4f93c510d79aace259bc8c133cba777a847745bb87387ba6d3020f885485284ba1d99124f5701dfa1adccc87aaf51e1ad0201f0128e40e893da777fd398f972b4f5e8a8f0f188b",
      SHAKE256:
        "755e8863a2b2bc067f51c1637a71c819d524dc37c17ba7a29c6ee3767c996a49e39d3f402bd2452d01f3977dea88467ac2aff4207f8a70ca32a3c345123a5875b67c4edd0f08d084310d0130165dbaa0d0744434dd23f24d3dad84a883133a0733907cad915743712fa15101ba80fcfb9ca603485d93f5e66384be22144a3543afdf02",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 65",
    [[blake3TestInput.slice(0, 65)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "de1e5fa0be70df6d2be8fffd0e99ceaa8eb6e8c93a63f2d8d1c30ecb6b263dee0e16e0a4749d6811dd1d6d1265c29729b1b75a9ac346cf93f0e1d7296dfcfd4313b3a227faaaaf7757cc95b4e87a49be3b8a270a12020233509b1c3632b3485eef309d0abc4a4a696c9decc6e90454b53b000f456a3f10079072baaf7a981653221f2c",
      SHAKE128:
        "701ce6125b588c626a6d9c68411a4588bac7cc9ed2afba7bcc0b068bdc0dbc99d608d9fe814f2997fb4670f0959e91147ca866985e0404c4f63e408ac9aaf18d0f97323b9059afc4390a28d81a76947e564916aa4407c868a26767e027c7edd8f9687ee668197efc5670310f6ba712efa836a97540500e2414765c5d4768b14c689f80",
      SHAKE256:
        "0779f3e173425a7e640107f7af17be8f6d39f95a75f73a111af7b7a2de5719f32b8eb1bc9dbe4b7091098dd81da327b3ab45cfa41b89e33db08895362a78f5c41ad1ca838071b69bb5b7c76cd3eed31a7810137f6f00d218581eca303eedaf19c9adf34838e1e23060a4f255fe8cffdf94f99fb846b607f4fe46351ec740ab4deae36d",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 127",
    [[blake3TestInput.slice(0, 127)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "d81293fda863f008c09e92fc382a81f5a0b4a1251cba1634016a0f86a6bd640de3137d477156d1fde56b0cf36f8ef18b44b2d79897bece12227539ac9ae0a5119da47644d934d26e74dc316145dcb8bb69ac3f2e05c242dd6ee06484fcb0e956dc44355b452c5e2bbb5e2b66e99f5dd443d0cbcaaafd4beebaed24ae2f8bb672bcef78",
      SHAKE128:
        "4d2d62b4c29b64d592631d7f764c482407ec1663a9c1378f9a40bbed8ba6134774bfe45f8f7ff8f24d91b5acf3b9d9e769f3e4d2f6e5f353b4eed16aa10f4ac9cf522d3b61bb7071865b1cee050b410dda5cb188d7352976b42ddbcd51550bfb14274b6ba3f451061b2c9088024f2cd4f0fd6b286546b49c6268f4ef85a1bf29d8af13",
      SHAKE256:
        "7456abc9254107b20377f545c308b2f9812b55bca1ecdb616f48bdb75d0794a788cc5d1857c3faf4bb665f829b23f6416d82982db8afb38730b004b19c5e67c6b2504c102bd61802a543b52fe80f34ebd847b9897fe453dc548e71078e28acbb5fad1c135c371f31aa5eb25b5e941f5d413c6eec925a663db511ebc4e6bfe492661241",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 128",
    [[blake3TestInput.slice(0, 128)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "f17e570564b26578c33bb7f44643f539624b05df1a76c81f30acd548c44b45efa69faba091427f9c5c4caa873aa07828651f19c55bad85c47d1368b11c6fd99e47ecba5820a0325984d74fe3e4058494ca12e3f1d3293d0010a9722f7dee64f71246f75e9361f44cc8e214a100650db1313ff76a9f93ec6e84edb7add1cb4a95019b0c",
      SHAKE128:
        "cd5fd43033df4a618199e01eb9b999830edbc36e0865e10ef1ea7f8d513cdfbfffc22c8dca948544fca7c6c7bd4b31cea9dcb2daa677c9d093d7a9a393513c6078b80e7cba6d4df686535dfa30dbec7507fece4a5abd0fbe5d2e56f11e7c640f182f1010f5a9924b9ab2d7e378ff8a64143ba20cdc95780115ca3d993b71ebed326a88",
      SHAKE256:
        "8d3a3a49eb989dd9de155fcd66a2c85fb33b9d0576bec9790af31c0565ee15ec1de5870ad28d7f48dfcb11e39118b114565fe73ffdcdd8cb4b23263dcc6da15c1865975ed3474de962093a15da1a2a9ab7d60a10ac61590c2f4ee858b56597d7536c410d0b325618bc6c9fb9c200308767023a88d2d4b58419d08c228696db06c2535e",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 129",
    [[blake3TestInput.slice(0, 129)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "683aaae9f3c5ba37eaaf072aed0f9e30bac0865137bae68b1fde4ca2aebdcb12f96ffa7b36dd78ba321be7e842d364a62a42e3746681c8bace18a4a8a79649285c7127bf8febf125be9de39586d251f0d41da20980b70d35e3dac0eee59e468a894fa7e6a07129aaad09855f6ad4801512a116ba2b7841e6cfc99ad77594a8f2d181a7",
      SHAKE128:
        "7e78f5b0b1b8c1919332254f504b47d8caf453dc6b5094944a41e732fde983d06592bb14783fcf285890bd8ff91d4f73f83899954558107f5de3dfce9666745bf7a6cb836f51fe31ac3b32b298b399b64ed84bde49693b947cde635fe97a671079f7b930b137cc91c8cad596697813652744912a4a0f13230b5f2eabf9975fe23eef0e",
      SHAKE256:
        "1454e9127a50e2765fabb757e10d46e28447c6bb0cbc943274409f5207c5eee5771d62103922b6035e966a19f16c63bd4723b03e11b8066f73159dbe3306904cb3197f47a7550192c37a029b77094edc24bf50dcc9b0b9d67fc222e93f43cb2155baa7d5274873b9cbad06b8ff2864921d3f7e2ac627e7d1a80023aa71417d44096841",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 1023",
    [[blake3TestInput.slice(0, 1023)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "10108970eeda3eb932baac1428c7a2163b0e924c9a9e25b35bba72b28f70bd11a182d27a591b05592b15607500e1e8dd56bc6c7fc063715b7a1d737df5bad3339c56778957d870eb9717b57ea3d9fb68d1b55127bba6a906a4a24bbd5acb2d123a37b28f9e9a81bbaae360d58f85e5fc9d75f7c370a0cc09b6522d9c8d822f2f28f485",
      SHAKE128:
        "6eb1815b93cf607dac0b9cbae53371ae8719e70d90521d82db06c8d3856b0bda8c4db0ed59dbe9d64d1835c516ae2caaa63164e878b79bf720e25a31c33822a9b8a38e1b60b7f1f904cae678d4431a5440b7551fbce80a94d9d63c4d58347adb1686ecb8dde6155c5fe625d2400e82525105664780522e68c27f1d130cafb193644996",
      SHAKE256:
        "81bb178698a098b0c6b70e82d8ee48443a487fa9349647d00c27e6ba0202995a8cb96402d557e6247a30d19bc21217c9eb0c5d36fbf07133a9bd2fe5565fbe745ebdbaf95b82be5cfd5d8d02860f83efd3c4c99a975bec51d77e9510a5fd0ac97d4b9fbc76b60bfab1795a0fcba1cf088025b163c58ef56995f13e960185f7fbd358fe",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 1024",
    [[blake3TestInput.slice(0, 1024)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "42214739f095a406f3fc83deb889744ac00df831c10daa55189b5d121c855af71cf8107265ecdaf8505b95d8fcec83a98a6a96ea5109d2c179c47a387ffbb404756f6eeae7883b446b70ebb144527c2075ab8ab204c0086bb22b7c93d465efc57f8d917f0b385c6df265e77003b85102967486ed57db5c5ca170ba441427ed9afa684e",
      SHAKE128:
        "b4347102639420d3f094d275cc1311e91cab7e047cf624679f20b81f5c9e2a9c2e1682d86896dfd8bb0dc9976e076c1e7900bb5dc224d9e7ed7148332cc6e5c2a8d40ef5b09818ffb279aff9eb005de385ca659a1d6e012cd364b4e606f42243cc873a86743466cdb41dba60308a5bc5d4d4c6175729cd560f028f671c04330fdd3a63",
      SHAKE256:
        "9d780b699069ff9c378acd8857081da4efe44787ead6b5c92d8213445d4b1ebaf8f18ee78ae5c80640470731ab70162961625d053467abafe60dcb7950fc84bd14278b396ac2ff951a44c54698a25935d4624071ed4c7e31ff6651bcceebe5f72581fe3e327af15010fc9fb8f1ad21084fd455ab376094d5b785c7f327e786ae750514",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 1025",
    [[blake3TestInput.slice(0, 1025)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "d00278ae47eb27b34faecf67b4fe263f82d5412916c1ffd97c8cb7fb814b8444f4c4a22b4b399155358a994e52bf255de60035742ec71bd08ac275a1b51cc6bfe332b0ef84b409108cda080e6269ed4b3e2c3f7d722aa4cdc98d16deb554e5627be8f955c98e1d5f9565a9194cad0c4285f93700062d9595adb992ae68ff12800ab67a",
      SHAKE128:
        "cade7de1dfa08a5be2566cf519bb8f96747dc86e937f27554bdb75a336c858f298653e16aa29715902cb552610d7c053a9504a3db591b35ed96d6c6708343444275ae5809215f8658eb3ad0efaddadf98163243d702d90efc308719960ee2a7b2ffcfa91e6afdee1323e7418705ce60e710a5de1e24e0b57a1422c64bccb15ad871471",
      SHAKE256:
        "35c3d95330b0077c02f14876e922c64a447205bc68f447f62092f7369c4dd79a5f4285e6b67154ec95a9336de7eb0379490ed4d7da1c4a65f5e8cdcc7a6249123cfb59eab5e7d381238174f0aa6b49fdd60a54b32cd12bf43886f71db1584ebce48cae48bbc0454035c8b0ccea048ace6e5bd29c397ba135278b2805ed181eb1055035",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 2048",
    [[blake3TestInput.slice(0, 2048)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "e776b6028c7cd22a4d0ba182a8bf62205d2ef576467e838ed6f2529b85fba24a9a60bf80001410ec9eea6698cd537939fad4749edd484cb541aced55cd9bf54764d063f23f6f1e32e12958ba5cfeb1bf618ad094266d4fc3c968c2088f677454c288c67ba0dba337b9d91c7e1ba586dc9a5bc2d5e90c14f53a8863ac75655461cea8f9",
      SHAKE128:
        "2fe0586a9d4b8ebd4f499a0f549e7863977425801e60c342903a2dde6f31c9bf8528d4bfca901d5924e75b0dc49a307254b164fc88ca13507bfa24be0fad0ab6774f8741fa9576bf7fe48c2a9edc928ef0c0e3c4f4b1b83ca016a84d76350b31d7e5121acee17b4934ec87337d5f3041c948635e43abe537b55f2516b57da38c5a8231",
      SHAKE256:
        "2f42cc0f215e1229c42f09dabadb1ea1ac13adbe337718233fb6b05c08537fa84aec1d83612c42ba58902ae8c146aae8e65c005a1dfa4887cfaf10d787021e873aad38b32bb8b340d19efc6b820f773c41001d3a87258e1d8289e9bc9e54ccb57766b1215414dea18abf25111c8787f6e6215a49d2f344947aa8f6c4b93f67810c8533",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 2049",
    [[blake3TestInput.slice(0, 2049)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "5f4d72f40d7a5f82b15ca2b2e44b1de3c2ef86c426c95c1af0b687952256303096de31d71d74103403822a2e0bc1eb193e7aecc9643a76b7bbc0c9f9c52e8783aae98764ca468962b5c2ec92f0c74eb5448d519713e09413719431c802f948dd5d90425a4ecdadece9eb178d80f26efccae630734dff63340285adec2aed3b51073ad3",
      SHAKE128:
        "84638924c2173e4ea39660b84797e97efd9f62af9f3e6df81e7a6e04ac3f7c76d14c1b2bbe607353795d890dfca3b687eec7baf9c6f3b4233842b7b33d47280f839a161078e08e33983273d87396dd14b0da6d7da8cc06907db7c7c14f03b2a5f6c64dd41cd4aa67a40e87cbd2b80456510eeed94219d15ac420912f147bdb344e72ae",
      SHAKE256:
        "0e60a78d9db32c690c15e054af9d32ecc310963d8f9b78987cc31d92f5806a2a05374faf08baef5426f182a7cd8dcc091d3af42c276971476b2091c1732d2544188120aad693a1d1d8e3bc24118141f3e5e64d30e5b1bac926c79223f365a51d4bc44baf287fb9622b6deeb6215b4ef019b45902f038a0fd5211257132ba76b7a1445a",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 3072",
    [[blake3TestInput.slice(0, 3072)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "b98cb0ff3623be03326b373de6b9095218513e64f1ee2edd2525c7ad1e5cffd29a3f6b0b978d6608335c09dc94ccf682f9951cdfc501bfe47b9c9189a6fc7b404d120258506341a6d802857322fbd20d3e5dae05b95c88793fa83db1cb08e7d8008d1599b6209d78336e24839724c191b2a52a80448306e0daa84a3fdb566661a37e11",
      SHAKE128:
        "48d3e2e8ba339ec9135b82007d937014e7f17b1d17d02c9e2999b97598ffa6e1b728837ba6b13d5b6c56c3710fe256333a34d1294b981b20211e40e40fe774999cf51d8953fde306c751b26ecf3a600a3ee6638edf68b49144839bc864b27f55c10cee264c12036afd878b3074aca099812c6d5289575e6e6f674434df633246bc55ad",
      SHAKE256:
        "d634c06667f221b34c30fd1c2d7a011bdc894e3a0807779cb38efe252f0cd65c0cebc4a1bbecf0e49e816524481e306a5950360ccd195793e2699e007bd48662500b210172fae7ff10010c41dd725072eea91f0bbf1df242abf830a7ffde2c1b9ddc0b946c6468d56fa8320a5c1f6405ec8f7ed11e17bf4317583f5c840943bcc8b038",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 3073",
    [[blake3TestInput.slice(0, 3073)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "7124b49501012f81cc7f11ca069ec9226cecb8a2c850cfe644e327d22d3e1cd39a27ae3b79d68d89da9bf25bc27139ae65a324918a5f9b7828181e52cf373c84f35b639b7fccbb985b6f2fa56aea0c18f531203497b8bbd3a07ceb5926f1cab74d14bd66486d9a91eba99059a98bd1cd25876b2af5a76c3e9eed554ed72ea952b603bf",
      SHAKE128:
        "36b727b5067cdeccca25fcc1040b98eb0daaf96a7cd07ee0f9e42fb7c9ca4648f1a6362da3e8724cb5a7ed8bd7cde678a3948323b9b6e7677d96269a951a27de0d32baf5a05023c0531a93eae42d7a4dac8d561ce93e299a7a8cd0a7154f0c0cccea65da04a9ac9a44aea38f4c0745a87355dbb59f66b843568c9436bfc8af49ff531f",
      SHAKE256:
        "ba9410f6c6bab6eb88c74df83dedbd12799c0401f001a5045eff456a25e623042a613837be74d6dd252ce294697fcd0d0ed1b23d8297becc88dc44cb795093bc4dbae1919022571096db8b8d96e65b7b0157026831ac9662abd113de6b8a83ec783f887469fd1d692eacb76080d4744c809adf13318fcaab3f86beb478e6cdbe25f82c",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 4096",
    [[blake3TestInput.slice(0, 4096)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "015094013f57a5277b59d8475c0501042c0b642e531b0a1c8f58d2163229e9690289e9409ddb1b99768eafe1623da896faf7e1114bebeadc1be30829b6f8af707d85c298f4f0ff4d9438aef948335612ae921e76d411c3a9111df62d27eaf871959ae0062b5492a0feb98ef3ed4af277f5395172dbe5c311918ea0074ce0036454f620",
      SHAKE128:
        "2ac5afdf6c0adc68f0375517cc9d547f812ba9b05da1a93be310847c654e294774ca4ba9505847bc46a5905472f9cdafa84d10489bfb914eb984b36d42ad9117dab4fd86ce55a39c7e6cb778408ee4502704972e9429c3fc9bacb0f230b60a2f98cfb50206f7a128289fb2cc453a68138e6d18d2153f044764059a882b7fe18d1b010a",
      SHAKE256:
        "70676a5d57937756a94d3cdbb4a636c7a957e5fccd1323d8a4997b62e32ca63235aed57e6563724797107ed8f2eed5c061d2654559f3f1f98418390980fe5f2c91de512116d9fd868ef7b13f5d0c455b1322656ceb2c1218a7d3fe650639fbf97d9349264af111cdcf19cb14b21d3a039f7a378457a1e42e4fc615719324ca11a24cd8",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 4097",
    [[blake3TestInput.slice(0, 4097)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "9b4052b38f1c5fc8b1f9ff7ac7b27cd242487b3d890d15c96a1c25b8aa0fb99505f91b0b5600a11251652eacfa9497b31cd3c409ce2e45cfe6c0a016967316c426bd26f619eab5d70af9a418b845c608840390f361630bd497b1ab44019316357c61dbe091ce72fc16dc340ac3d6e009e050b3adac4b5b2c92e722cffdc46501531956",
      SHAKE128:
        "5bbd95f92e015333295fedfe79c4121c024fa7c0c36aad11070d472d6c6b1b58b32e016de07d3a3ca90c7775557fcaeddbe9362b764f2ec6a6d05b194d428328d8a3ebd1d463438d3290ff21f00f5708d2281ddf3b5ebca55129e84414f28c17cc2b6915b2f28477e655c656e6be9fc53b5b2ba9de1943f65be40e6abbeb01a5f63816",
      SHAKE256:
        "267d68975d5de40909221876c90f47bdbf114f388edf9d8a1a087e55bb6ddaf41e6e69e2e988cc7c3a7b2d2d09ccbb4bafc4ae4923414ea7147bb4a9ff99aada9d5c553cd0f3f8a2f3aaf856e6d551b38b8370a7d33f8784eeeb0abb840b6193c0a4fa72f3e84ebe1b50f6e895618eab4e4d9cfabdb3bac0c14f3e0313bf06c1a37034",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 5120",
    [[blake3TestInput.slice(0, 5120)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "9cadc15fed8b5d854562b26a9536d9707cadeda9b143978f319ab34230535833acc61c8fdc114a2010ce8038c853e121e1544985133fccdd0a2d507e8e615e611e9a0ba4f47915f49e53d721816a9198e8b30f12d20ec3689989175f1bf7a300eee0d9321fad8da232ece6efb8e9fd81b42ad161f6b9550a069e66b11b40487a5f5059",
      SHAKE128:
        "fe95af7dd621664a24bb1f9339f353359225fdea7733783f58e32d5e4d85baf7ab08405a954f9943684496bde51a886641eaf1f8e9f9e325f98c68a89efcf44b291f4ea0e359668e411a34a3ed372653bdc2c10330cdef8893101f94cbe5566204180e2a6be21483178d810c48ec7f7246fa7369b29153607669f2ce8c297be18125ef",
      SHAKE256:
        "11295720c7ce1c3c8d6ac97bdaeabd3d0cf47b796cab7aa575c6d50e3ef894d03035d51a972ceeee4821bb7fc3325ea515a9c8ce74de76ce0ceb082f7ee2f6c95aa29a4d490e99eff7daecb1bb990f965d1e7d77c19589d351d015715b80dfa8cc7fe91fa26601936c3e70b739bb763695686be3dcfdf3e360ffbc7f8d2ca197f65a48",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 5121",
    [[blake3TestInput.slice(0, 5121)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "628bd2cb2004694adaab7bbd778a25df25c47b9d4155a55f8fbd79f2fe154cff96adaab0613a6146cdaabe498c3a94e529d3fc1da2bd08edf54ed64d40dcd6777647eac51d8277d70219a9694334a68bc8f0f23e20b0ff70ada6f844542dfa32cd4204ca1846ef76d811cdb296f65e260227f477aa7aa008bac878f72257484f2b6c95",
      SHAKE128:
        "3a7f361620263d1cfcc7297f3b87836c4e5fd9080a4963bd76d6099f955f2f88c64efe4e9880c9e98cf269356e7216051ca612ae45cfbe2752b306b1c30d49a29915a6433bec537c7017c7a59a496d45c111c0424494b79a63c72687938a6ca2b9b738ee73ff13835c1a11ada89e3f4717ef61f4f6f4ff5a56b0e4e4fb65dd70e21473",
      SHAKE256:
        "a1dbe1bc3eaa519cd1127f955dea3402872e70c5bd6afb97747cd6934df59a5e989d43f64d46ebf7ba6ceb871739f24bc1381bc4144f56bccf758fd07d8fe808ef70528c1cd06a4ae89289310f6deeea8408ccfb08256b82fba909f0f9832e14c2f72b99ed00c132e2937bd2feb4b37bc10797945b1241cb1cb933f5d10632fd69fdff",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 6144",
    [[blake3TestInput.slice(0, 6144)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "3e2e5b74e048f3add6d21faab3f83aa44d3b2278afb83b80b3c35164ebeca2054d742022da6fdda444ebc384b04a54c3ac5839b49da7d39f6d8a9db03deab32aade156c1c0311e9b3435cde0ddba0dce7b26a376cad121294b689193508dd63151603c6ddb866ad16c2ee41585d1633a2cea093bea714f4c5d6b903522045b20395c83",
      SHAKE128:
        "d8098513417ee6564911bbd78c99f531a2d9c1abb46a450e62166171fb7f6891697e23edb49c45d52ae5b63eec35c8f7b34df5df534c7cddbcd9f346e9a3d8bc197eb530a102904a4a6b9e1bff2497e2e30d8d003bcf3c878ba20f7bde2e131e6fc55d9d727822ace69d97d534789af01d20392575bcc5467b9b9b2aa03d1a8bd599bf",
      SHAKE256:
        "17fb270939ddc594d7283a44a89dd7ff72444411f761c00fad532f6c22fc788e450b1c86cf742456e3601958e4f0399b671fd41e517ae7559dde4a7eea03d02f847a1d02ac2cede20222e684eaf27bce02ec01bd0c3b363f73172024016bb612868362e0754de7bbab377be24a3b9b78285121bf8120cd4833aeb5b40e71e11e54849d",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 6145",
    [[blake3TestInput.slice(0, 6145)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "f1323a8631446cc50536a9f705ee5cb619424d46887f3c376c695b70e0f0507f18a2cfdd73c6e39dd75ce7c1c6e3ef238fd54465f053b25d21044ccb2093beb015015532b108313b5829c3621ce324b8e14229091b7c93f32db2e4e63126a377d2a63a3597997d4f1cba59309cb4af240ba70cebff9a23d5e3ff0cdae2cfd54e070022",
      SHAKE128:
        "bac95567e37ded8cb59b3182a053975324b5622fd8ba40b7e068b50836a8e9ddd27ba197d0831dc637eddc17209bff9a8c79eef509b870665e832133a983b9067cf3d541bf0781fc14b03c714bf89fe500138fab1d214c5535531607e06be543c221f4aeaf6390d3f1a3c533754df4a98f6f44037c5f643caa63410ae4d90f51bffd47",
      SHAKE256:
        "e34c13b7e0d62cd491dc69b15ad5ce63494226a4e9840b0ce82dcdfcb8ce3e900dc0ea4d50028c12ca4c025a3e1378bcf6cca6c8ff79e047823f0b29adc988ae0f5a6961794c9a9f60b85eecdb874c45ec44295d9029b85764d3df9b6c07bd10ea2b73723d5794eadf2773a39c1190b50a1de6096646117d734efa9fd1361dd0f6aac2",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 7168",
    [[blake3TestInput.slice(0, 7168)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "61da957ec2499a95d6b8023e2b0e604ec7f6b50e80a9678b89d2628e99ada77a5707c321c83361793b9af62a40f43b523df1c8633cecb4cd14d00bdc79c78fca5165b863893f6d38b02ff7236c5a9a8ad2dba87d24c547cab046c29fc5bc1ed142e1de4763613bb162a5a538e6ef05ed05199d751f9eb58d332791b8d73fb74e4fce95",
      SHAKE128:
        "b3da9e5a424fd41e825992b34c5f95b01a4934b99f7aeb1a2585e490617be42f8ffbfbd06308e0460c8b188625052f60b07180b82b1a2085c07595351c4761fa25715c7c51e6282d98dd4bc4883834bad8f03acd89331ed977d6c9412f75e420416d2502519041dc9ee212ada918d9f587a02d34c56a3d9c7d16d1c6b6dd42ee2c21c4",
      SHAKE256:
        "8de5aabbcdef4542ca5feded1f40b4f3469a48b33f162d8cd2144ce06caf214e4686c02680de660caadbfaddb3fc12dbe55460da4127560015173db66b3742c0245bc0f4f8f21731dc3fa5f7c175f968ef653e9019406c57c572f066a99fd656c11563182fca64b921d4e5d4552a3f031633f35a85b51d1657f2de995d5e8c370944ec",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 7169",
    [[blake3TestInput.slice(0, 7169)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "a003fc7a51754a9b3c7fae0367ab3d782dccf28855a03d435f8cfe74605e781798a8b20534be1ca9eb2ae2df3fae2ea60e48c6fb0b850b1385b5de0fe460dbe9d9f9b0d8db4435da75c601156df9d047f4ede008732eb17adc05d96180f8a73548522840779e6062d643b79478a6e8dbce68927f36ebf676ffa7d72d5f68f050b119c8",
      SHAKE128:
        "756dfff2449ea96c33aecd98e2b102efb7b1aca6c85634abbf8bdade4c9efaf7c72dcddddf8c0f23a581667c948cf25ae665b30166ea2ad9d5ee98306241bf42a8b2132f3fbdc65f9dff88218f28c03d026be63a433ca1e61c32365cc7fde5c707902d77d01c0ddca64871a0491820a3add3deb04f82015ce8a10d91424893cd221d6c",
      SHAKE256:
        "d74e49cec9380ef693f39006fbc76129fef10c67a650cdd32eaa1f7451c90d04f6639f4132acac615358ee266dafa35b5af4851571a53f7cff4f97dac99fea874d8b37478eb4e9c1276b295a43859b7f3cd74ec4b6824d3ce8841a33f358e1b4add35b17d24b662b790d9e80d48c6fa9cd6c7445bdcd548cd35fddd21bfb317da155f9",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 8192",
    [[
      blake3TestInput.slice(0, 1234),
      blake3TestInput.slice(1234, 5678),
      blake3TestInput.slice(5678, 8192),
    ]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "aae792484c8efe4f19e2ca7d371d8c467ffb10748d8a5a1ae579948f718a2a635fe51a27db045a567c1ad51be5aa34c01c6651c4d9b5b5ac5d0fd58cf18dd61a47778566b797a8c67df7b1d60b97b19288d2d877bb2df417ace009dcb0241ca1257d62712b6a4043b4ff33f690d849da91ea3bf711ed583cb7b7a7da2839ba71309bbf",
      SHAKE128:
        "d91222e88d0b3e4e12edf5d82d4c66c254682eb99de79d8ca47405b7527306b08d08fa8ffa044f835e3f439101ff466f514ea2eb89dbbf2173c1e67f5c74decb9bd9b7b6705b8bf2a2feae80ab19f3316fddcc33c0feaa6f0f9b0a60cab73143773a492a56dc186cbef435d0bcdcea6a49c221200f188e2b328db94703598fc6e27e26",
      SHAKE256:
        "9cc49c82718707b00f1de5c812d620d7c1519b895bb968c07f1b5343e5e7a93c95245ad1588e7d72cf3f62ccfcc5f1064c25c9da02cfb9268a7da26d850fd0120901b6a86547a4220b8246abe780d62b0e0c04deb67887f56b2f354a84cf316a4f7a4b4b9349f93a95389af54eeaf8c92480f20b528ddfc6cba5d81039a9d51f648639",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 8193",
    [[blake3TestInput.slice(0, 8193)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "bab6c09cb8ce8cf459261398d2e7aef35700bf488116ceb94a36d0f5f1b7bc3bb2282aa69be089359ea1154b9a9286c4a56af4de975a9aa4a5c497654914d279bea60bb6d2cf7225a2fa0ff5ef56bbe4b149f3ed15860f78b4e2ad04e158e375c1e0c0b551cd7dfc82f1b155c11b6b3ed51ec9edb30d133653bb5709d1dbd55f4e1ff6",
      SHAKE128:
        "c26f6910bbb4fe728330d3e497fd28aeda340ab2746029f0629b4684262e11fa4d81fa8f65e95d017a54b21421184470cd2f65d7f158bff30639b19922215f250c7ada5804d89fa239183b08ab40bbedf80fb5e2a452c98770c70f22364f381fca00a16039a09fc64c4eaf143b93e48f46041e8d4cc760a00edaa2b3d2f5aac7ae5afe",
      SHAKE256:
        "9b2be4e870af8b6cfcb6e64d23f8efeeef9fc6c42ea4492aa93d2fdd10288bccbf77267c63893602766f1eff876ad87d3d971fe75a06acc6fc37ede9fcfc9097301a446cdb181cbd19a065c20ff7ef18638726dc109d451ff305bbdb805efc462bd8834b53f86de985f5e22876862c1889edd1671d20ac7a4fbeb960c4e1c4ad17504d",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 16384",
    [[blake3TestInput.slice(0, 16384)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "f875d6646de28985646f34ee13be9a576fd515f76b5b0a26bb324735041ddde49d764c270176e53e97bdffa58d549073f2c660be0e81293767ed4e4929f9ad34bbb39a529334c57c4a381ffd2a6d4bfdbf1482651b172aa883cc13408fa67758a3e47503f93f87720a3177325f7823251b85275f64636a8f1d599c2e49722f42e93893",
      SHAKE128:
        "574eb85d00d89dcce3cb796c00d17c63dd52ab4d15e595514df4526ee25919ea8a9306cba3a07bd88d3cf08c7161e8ff540ecff2a2c71a5854262b7f4fac30409cedf93ec605a43ab828e204a7bf1b014711aed7b3df471c85fb9368640ff71b68f1dbe81dbe1515c930b4c80650262f9874e6699b64672e78689bf31575ea0e871d22",
      SHAKE256:
        "aa737331d168b3ffa1418122a3d7475937c0e0a9032cd55c5a324d7bab9f9fe75a54058e67aed27d6641473541a941953a031f8a1f038cdc330a77b6aad45c6bbc630fee7394dc0f7f441ee4464c19e62bbe6ae04af3e8cbee72183c1ec5804547f45a1c3aee741cdfd5b02ae8a0fa40b0a6ddc70a1c891c7da5aeae660cc886fa4c3a",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 31744",
    [[blake3TestInput.slice(0, 31744)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "62b6960e1a44bcc1eb1a611a8d6235b6b4b78f32e7abc4fb4c6cdcce94895c47860cc51f2b0c28a7b77304bd55fe73af663c02d3f52ea053ba43431ca5bab7bfea2f5e9d7121770d88f70ae9649ea713087d1914f7f312147e247f87eb2d4ffef0ac978bf7b6579d57d533355aa20b8b77b13fd09748728a5cc327a8ec470f4013226f",
      SHAKE128:
        "1d6d7ed953b95146b6b05cd468c325a4f0e9d0575a5358dd325c6a4f0e61a7ac4d02111636bb55b52b3ce4fe43cda7d3e54ceab6356654f1a0960e16d49ce5741169886f7f8f22dfaae2c91cf564bf5dd0b33c2da3816dd0758a2018aaa5435f9625d61084162e6f15d212fd2050081e78e83508f2e8c83fb3abc1859101c83a9603f2",
      SHAKE256:
        "94db03a1c95703d2518868e1cea885684df1263696a385b95c28881f7d7d6d98bd48268d09b61dd78e1dd8bdd05f1d2cb7e9ac04cfc95e48ca1ad9c4c39359ea635219d3b1e153fbbb9aafd37700a79a02930edd9caaa2c209db75a0f8baa68c989b055001e3c22c333ebd3978733aed70ea7db73b4309e7b2e0bf18cfb18ad911a9b6",
    },
  ],

  [
    "BLAKE3 official test vector input for hash with input length 102400",
    [[blake3TestInput.slice(0, 102400)]],
    { length: 131 },
    {
      ...allErrors,
      BLAKE3:
        "bc3e3d41a1146b069abffad3c0d44860cf664390afce4d9661f7902e7943e085e01c59dab908c04c3342b816941a26d69c2605ebee5ec5291cc55e15b76146e6745f0601156c3596cb75065a9c57f35585a52e1ac70f69131c23d611ce11ee4ab1ec2c009012d236648e77be9295dd0426f29b764d65de58eb7d01dd42248204f45f8e",
      SHAKE128:
        "66c46a1d8eb2a81332627d7eaddf26c1ae44248785b419c20d4e2a6ab7b9718e9fba547058d7d63937c832a74c2ac56ebe36775cceb9dfb770b46257c92581ee81c8dbbb15946617f4bd5fb750b7fc30c431c628211703bebca863af9d3ba1a16cc5ffc034e69522707fa97d3a4325b3bd35f629aa3a07781ccf8a049393335b049f4d",
      SHAKE256:
        "9ae96dbcac28723fa69799bb24cd244160b097778e8d74d2b94d9826f29f99fe896638856c1ad6915d0ff9837c2333061ce582dbf38a0e428956fcac1dc75841c85895f6e25a5be2e0a5af9677f9c900fbbbef680c80dc0783199ad4eb67204ba7da0460dc5fbac31cc31f8fa950b27b4a1eb4c9728af4ce3588134885ab64631f07a8",
    },
  ],
];

for (const algorithm of DIGEST_ALGORITHM_NAMES) {
  Deno.test(`digest() checks ${algorithm} vectors`, async () => {
    for (
      const [caption, piecesVariations, options, algorithms] of digestCases
    ) {
      const expected = algorithms[algorithm];
      for (const [i, pieces] of piecesVariations.entries()) {
        const bytePieces = pieces.map((piece) =>
          typeof piece === "string" ? new TextEncoder().encode(piece) : piece
        ) as Array<BufferSource>;
        // Expected value will either be a hex string, if the case is expected
        // to return successfully, or an error class/constructor function, if
        // the case is expected to throw.
        if (typeof expected === "string") {
          const actual = encodeHex(
            await stdCrypto.subtle.digest({
              ...options,
              name: algorithm,
            }, bytePieces),
          );
          if (bytePieces.length === 1) {
            // Verify that the same result is produced if it's not wrapped in an iterable. This will cause the
            // runtime WebCrypto implementation to be used where supported, checking for implementation consistency.
            const onePieceActual = encodeHex(
              await stdCrypto.subtle.digest({
                ...options,
                name: algorithm,
              }, bytePieces[0]!),
            );
            assertEquals(
              actual,
              onePieceActual,
              `${algorithm} produced different results for BufferSource input versus single-item iterator of the same BufferSource`,
            );
          }
          assertEquals(
            expected,
            actual,
            `${algorithm} of ${caption}${
              i > 0 ? ` (but not until variation [${i}]!)` : ""
            } with options ${
              JSON.stringify(options)
            }) returned unexpected value\n  actual: ${actual}\nexpected: ${expected}`,
          );
        } else if (typeof expected === "function") {
          let error;
          try {
            await stdCrypto.subtle.digest({
              ...options,
              name: algorithm,
            }, bytePieces);
          } catch (caughtError) {
            error = caughtError;
          }
          if (error !== undefined) {
            assertInstanceOf(
              error,
              expected,
            );
          } else {
            fail(
              `${algorithm} of ${caption}${
                i > 0 ? ` (but not until variation [${i}]!)` : ""
              } with options ${
                JSON.stringify(options)
              }) expected an exception of type ${expected.name}, but none was thrown.`,
            );
          }
        } else {
          throw new TypeError("expected value has an unexpected type");
        }
      }
    }
  });
}

Deno.test("digest() throws on invalid algorithm", async () => {
  await assertRejects(
    // @ts-ignore Algorithm name is invalid on purpose
    async () => await stdCrypto.subtle.digest("invalid", new Uint8Array(0)),
    DOMException,
    "Unrecognized algorithm name",
  );
});

/**
 * This is one of many methods of `crypto` for which we don't have our own
 * implementation, and just pass calls through to the native implementation.
 * This test doesn't cover any cryptographic logic but just serves to ensure
 * that (at least this one of) the native methods are indeed re-exported, and
 * that they're appropriately bound to use the required receiver.
 */
Deno.test("getRandomValues() passes through to native implementation", () => {
  assertInstanceOf(stdCrypto.getRandomValues(new Uint8Array(1)), Uint8Array);
});
