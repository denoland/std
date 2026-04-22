// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import {
  createSignatureBase,
  signMessage,
  verifyMessage,
} from "./unstable_message_signatures.ts";
import type { SignatureAlgorithm } from "./unstable_message_signatures.ts";

// =============================================================================
// Helpers
// =============================================================================

const NOW = Math.floor(Date.now() / 1000);

function makeRequest(
  url = "https://example.com/foo?param=Value&Pet=dog",
  init?: RequestInit,
): Request {
  return new Request(url, {
    method: "POST",
    headers: {
      "Host": "example.com",
      "Date": "Tue, 20 Apr 2021 02:07:55 GMT",
      "Content-Type": "application/json",
      "Content-Digest":
        "sha-512=:WZDPaVn/7XgHaAy8pmojAkGWoRx2UFChF41A2svX+TaPm+AbwAgBWnrIiYllu7BNNyealdVLvRwEmTHWXvJwew==:",
      "Content-Length": "18",
    },
    body: '{"hello": "world"}',
    ...init,
  });
}

type KeyGenerator = () => Promise<CryptoKeyPair | CryptoKey>;

const KEY_GENERATORS: Record<string, KeyGenerator> = {
  ed25519: () =>
    crypto.subtle.generateKey("Ed25519", true, [
      "sign",
      "verify",
    ]) as Promise<CryptoKeyPair>,
  "hmac-sha256": () =>
    crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, true, [
      "sign",
      "verify",
    ]),
  "ecdsa-p256-sha256": () =>
    crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"],
    ) as Promise<CryptoKeyPair>,
  "ecdsa-p384-sha384": () =>
    crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-384" },
      true,
      ["sign", "verify"],
    ) as Promise<CryptoKeyPair>,
  "rsa-pss-sha512": () =>
    crypto.subtle.generateKey(
      {
        name: "RSA-PSS",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-512",
      },
      true,
      ["sign", "verify"],
    ) as Promise<CryptoKeyPair>,
  "rsa-v1_5-sha256": () =>
    crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    ) as Promise<CryptoKeyPair>,
};

function keys(
  keyOrPair: CryptoKeyPair | CryptoKey,
): { privateKey: CryptoKey; publicKey: CryptoKey } {
  if ("privateKey" in keyOrPair) return keyOrPair;
  return { privateKey: keyOrPair, publicKey: keyOrPair };
}

// =============================================================================
// createSignatureBase — derived components
// =============================================================================

Deno.test("createSignatureBase() resolves all request-derived components", () => {
  const request = new Request(
    "https://www.example.com/path?param=value",
    { method: "POST" },
  );
  const base = createSignatureBase({
    message: request,
    params: {
      components: [
        "@method",
        "@target-uri",
        "@authority",
        "@scheme",
        "@request-target",
        "@path",
        "@query",
        { name: "@query-param", parameters: { name: "param" } },
      ],
      created: 1618884473,
    },
  });
  const lines = base.split("\n");
  assertEquals(lines[0], '"@method": POST');
  assertEquals(
    lines[1],
    '"@target-uri": https://www.example.com/path?param=value',
  );
  assertEquals(lines[2], '"@authority": www.example.com');
  assertEquals(lines[3], '"@scheme": https');
  assertEquals(lines[4], '"@request-target": /path?param=value');
  assertEquals(lines[5], '"@path": /path');
  assertEquals(lines[6], '"@query": ?param=value');
  assertEquals(lines[7], '"@query-param";name="param": value');
});

Deno.test("createSignatureBase() normalizes empty path to / and absent query to ?", () => {
  const request = new Request("https://example.com");
  const base = createSignatureBase({
    message: request,
    params: { components: ["@path", "@query"], created: 1618884473 },
  });
  const lines = base.split("\n");
  assertEquals(lines[0], '"@path": /');
  assertEquals(lines[1], '"@query": ?');
});

Deno.test("createSignatureBase() resolves @status from response", () => {
  const response = new Response(null, { status: 200 });
  const base = createSignatureBase({
    message: response,
    params: { components: ["@status"], created: 1618884473 },
  });
  assertEquals(base.split("\n")[0], '"@status": 200');
});

// =============================================================================
// createSignatureBase — field component parameters (;sf, ;key, ;bs)
// =============================================================================

Deno.test("createSignatureBase() resolves plain header, ;sf, ;key item, ;key inner-list, and ;bs", () => {
  const request = new Request("https://example.com/", {
    headers: {
      "Content-Type": "application/json",
      "Example-Dict": "a=1,    b=2;x=1;y=2,   c=(a   b   c)",
      "List-Dict": "items=(1 2 3), other=4",
      "Example-Header": "value, with, lots",
      "X-Num": "42",
      "X-List": "1,    2,   3",
    },
  });

  // ;sf — dictionary
  const sfDict = createSignatureBase({
    message: request,
    params: {
      components: [{ name: "example-dict", parameters: { sf: true } }],
      created: 1618884473,
    },
  });
  assertEquals(
    sfDict.split("\n")[0],
    '"example-dict";sf: a=1, b=2;x=1;y=2, c=(a b c)',
  );

  // ;sf — list fallback (header fails Dictionary parse, succeeds as List)
  const sfList = createSignatureBase({
    message: request,
    params: {
      components: [{ name: "x-list", parameters: { sf: true } }],
      created: 1618884473,
    },
  });
  assertEquals(sfList.split("\n")[0], '"x-list";sf: 1, 2, 3');

  // ;sf — item fallback
  const sfItem = createSignatureBase({
    message: request,
    params: {
      components: [{ name: "x-num", parameters: { sf: true } }],
      created: 1618884473,
    },
  });
  assertEquals(sfItem.split("\n")[0], '"x-num";sf: 42');

  // ;key — scalar member
  const keyScalar = createSignatureBase({
    message: request,
    params: {
      components: [{ name: "example-dict", parameters: { key: "a" } }],
      created: 1618884473,
    },
  });
  assertEquals(keyScalar.split("\n")[0], '"example-dict";key="a": 1');

  // ;key — inner list member
  const keyList = createSignatureBase({
    message: request,
    params: {
      components: [{ name: "list-dict", parameters: { key: "items" } }],
      created: 1618884473,
    },
  });
  assertEquals(keyList.split("\n")[0], '"list-dict";key="items": (1 2 3)');

  // ;bs
  const bs = createSignatureBase({
    message: request,
    params: {
      components: [{ name: "example-header", parameters: { bs: true } }],
      created: 1618884473,
    },
  });
  assertEquals(bs.split("\n")[0]!.startsWith('"example-header";bs: :'), true);
});

// =============================================================================
// createSignatureBase — ;req parameter
// =============================================================================

Deno.test("createSignatureBase() resolves ;req from related request", () => {
  const request = new Request("https://example.com/foo", { method: "POST" });
  const response = new Response(null, { status: 200 });
  const base = createSignatureBase({
    message: response,
    params: {
      components: [
        "@status",
        { name: "@method", parameters: { req: true } },
      ],
      created: 1618884473,
    },
    request,
  });
  const lines = base.split("\n");
  assertEquals(lines[0], '"@status": 200');
  assertEquals(lines[1], '"@method";req: POST');
});

// =============================================================================
// createSignatureBase — full RFC 9421 section 2.5 example
// =============================================================================

Deno.test("createSignatureBase() builds correct base for RFC 9421 section 2.5 example", () => {
  const request = makeRequest();
  const base = createSignatureBase({
    message: request,
    params: {
      components: [
        "@method",
        "@authority",
        "@path",
        "content-digest",
        "content-length",
        "content-type",
      ],
      created: 1618884473,
      keyId: "test-key-rsa-pss",
    },
  });

  const expected = [
    '"@method": POST',
    '"@authority": example.com',
    '"@path": /foo',
    '"content-digest": sha-512=:WZDPaVn/7XgHaAy8pmojAkGWoRx2UFChF41A2svX+TaPm+AbwAgBWnrIiYllu7BNNyealdVLvRwEmTHWXvJwew==:',
    '"content-length": 18',
    '"content-type": application/json',
    '"@signature-params": ("@method" "@authority" "@path" "content-digest" "content-length" "content-type");created=1618884473;keyid="test-key-rsa-pss"',
  ].join("\n");

  assertEquals(base, expected);
});

// =============================================================================
// createSignatureBase — error paths
// =============================================================================

Deno.test("createSignatureBase() rejects invalid component configurations", () => {
  const request = new Request("https://example.com/", {
    headers: { "Example": "value", "Content-Type": "text/plain" },
  });
  const response = new Response(null, { status: 200 });

  // Missing header
  assertThrows(
    () =>
      createSignatureBase({
        message: request,
        params: { components: ["x-nonexistent"] },
      }),
    TypeError,
    'Missing "x-nonexistent" header field',
  );

  // Unknown derived component
  assertThrows(
    () =>
      createSignatureBase({
        message: request,
        params: { components: ["@unknown"] },
      }),
    TypeError,
    'Unknown derived component "@unknown"',
  );

  // @status on request
  assertThrows(
    () =>
      createSignatureBase({
        message: request,
        params: { components: ["@status"] },
      }),
    TypeError,
    'Cannot use "@status" on a request message',
  );

  // Request-only component on response
  assertThrows(
    () =>
      createSignatureBase({
        message: response,
        params: { components: ["@method"] },
      }),
    TypeError,
    'Cannot use "@method" on a response message',
  );

  // ;bs + ;sf
  assertThrows(
    () =>
      createSignatureBase({
        message: request,
        params: {
          components: [
            { name: "example", parameters: { bs: true, sf: true } },
          ],
        },
      }),
    TypeError,
    'Cannot combine "bs" and "sf"',
  );

  // ;bs + ;key
  assertThrows(
    () =>
      createSignatureBase({
        message: request,
        params: {
          components: [
            { name: "example", parameters: { bs: true, key: "a" } },
          ],
        },
      }),
    TypeError,
    'Cannot combine "bs" and "key"',
  );

  // ;tr unsupported
  assertThrows(
    () =>
      createSignatureBase({
        message: request,
        params: {
          components: [{ name: "example", parameters: { tr: true } }],
        },
      }),
    TypeError,
    "Trailer field resolution",
  );

  // ;req on a request
  assertThrows(
    () =>
      createSignatureBase({
        message: request,
        params: {
          components: [{ name: "@method", parameters: { req: true } }],
        },
      }),
    TypeError,
    'Cannot use "req" parameter',
  );

  // ;req without related request
  assertThrows(
    () =>
      createSignatureBase({
        message: response,
        params: {
          components: [{ name: "@method", parameters: { req: true } }],
        },
      }),
    TypeError,
    "no related request provided",
  );

  // Duplicate component
  assertThrows(
    () =>
      createSignatureBase({
        message: request,
        params: { components: ["content-type", "content-type"] },
      }),
    TypeError,
    "Duplicate component identifier",
  );

  // @signature-params in components
  assertThrows(
    () =>
      createSignatureBase({
        message: request,
        params: { components: ["@signature-params"] },
      }),
    TypeError,
    '"@signature-params" must not be listed',
  );

  // Uppercase component name
  assertThrows(
    () =>
      createSignatureBase({
        message: request,
        params: { components: ["Content-Type"] },
      }),
    TypeError,
    "must be lowercase",
  );
});

Deno.test("createSignatureBase() rejects @query-param edge cases", () => {
  // Missing name parameter
  assertThrows(
    () =>
      createSignatureBase({
        message: new Request("https://example.com/path?foo=bar"),
        params: { components: [{ name: "@query-param" }] },
      }),
    TypeError,
    'requires "name" parameter',
  );

  // Non-existent parameter
  assertThrows(
    () =>
      createSignatureBase({
        message: new Request("https://example.com/path?foo=bar"),
        params: {
          components: [
            { name: "@query-param", parameters: { name: "nonexistent" } },
          ],
        },
      }),
    TypeError,
    "not found in request URL",
  );

  // Duplicate parameter
  assertThrows(
    () =>
      createSignatureBase({
        message: new Request("https://example.com/path?foo=1&foo=2"),
        params: {
          components: [
            { name: "@query-param", parameters: { name: "foo" } },
          ],
        },
      }),
    TypeError,
    "occurs multiple times",
  );
});

Deno.test("createSignatureBase() rejects ;sf and ;key errors", () => {
  // ;sf with unparseable value
  assertThrows(
    () =>
      createSignatureBase({
        message: new Request("https://example.com/", {
          headers: { "X-Bad": "@@@ not a structured field @@@" },
        }),
        params: {
          components: [{ name: "x-bad", parameters: { sf: true } }],
        },
      }),
    TypeError,
    'Cannot apply "sf" parameter',
  );

  // ;key with non-dictionary header
  assertThrows(
    () =>
      createSignatureBase({
        message: new Request("https://example.com/", {
          headers: { "X-Simple": "just a plain value" },
        }),
        params: {
          components: [{ name: "x-simple", parameters: { key: "a" } }],
        },
      }),
    TypeError,
    'Cannot parse "x-simple" as Dictionary',
  );

  // ;key with missing key
  assertThrows(
    () =>
      createSignatureBase({
        message: new Request("https://example.com/", {
          headers: { "Example-Dict": "a=1, b=2" },
        }),
        params: {
          components: [
            { name: "example-dict", parameters: { key: "nonexistent" } },
          ],
        },
      }),
    TypeError,
    'Dictionary key "nonexistent" not found',
  );
});

// =============================================================================
// Sign and verify round-trip — all algorithms (inferred from key)
// =============================================================================

for (
  const algorithm of [
    "ed25519",
    "hmac-sha256",
    "ecdsa-p256-sha256",
    "ecdsa-p384-sha384",
    "rsa-pss-sha512",
    "rsa-v1_5-sha256",
  ] as const
) {
  Deno.test(`signMessage() and verifyMessage() round-trip with ${algorithm}`, async () => {
    const keyOrPair = await KEY_GENERATORS[algorithm]!();
    const { privateKey, publicKey } = keys(keyOrPair);
    const request = new Request("https://example.com/", { method: "POST" });

    const signed = await signMessage({
      message: request,
      params: {
        components: ["@method", "@authority"],
        keyId: `test-${algorithm}`,
        created: NOW,
      },
      key: privateKey,
    });

    const results = await verifyMessage(signed, () => publicKey);
    assertEquals(results.length, 1);
    assertEquals(results[0]!.label, "sig");
    assertEquals(results[0]!.params.keyId, `test-${algorithm}`);
  });
}

// =============================================================================
// signMessage — behaviour and validation
// =============================================================================

Deno.test("signMessage() preserves headers, defaults label, and returns correct type", async () => {
  const keyOrPair = await KEY_GENERATORS["ed25519"]!();
  const { privateKey, publicKey } = keys(keyOrPair);

  // Request: preserves existing headers, defaults label to "sig"
  const request = new Request("https://example.com/", {
    method: "GET",
    headers: { "X-Custom": "preserved" },
  });
  const signedReq = await signMessage({
    message: request,
    params: { components: ["@method"], keyId: "k", created: NOW },
    key: privateKey,
  });
  assertEquals(signedReq instanceof Request, true);
  assertEquals(signedReq.headers.get("X-Custom"), "preserved");
  assertEquals(
    signedReq.headers.get("Signature-Input")!.startsWith("sig="),
    true,
  );

  // Response: returns Response type, signs correctly
  const response = new Response("body", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
  const signedRes = await signMessage({
    message: response,
    params: {
      components: ["@status", "content-type"],
      keyId: "k",
      created: NOW,
    },
    key: privateKey,
  });
  assertEquals(signedRes instanceof Response, true);
  assertEquals(signedRes.status, 200);

  const results = await verifyMessage(signedRes, () => publicKey);
  assertEquals(results.length, 1);
});

Deno.test("signMessage() rejects invalid params", async () => {
  const keyOrPair = await KEY_GENERATORS["ed25519"]!();
  const { privateKey } = keys(keyOrPair);
  const request = new Request("https://example.com/", { method: "GET" });

  // Unsupported algorithm
  await assertRejects(
    () =>
      signMessage({
        message: request,
        params: {
          components: ["@method"],
          algorithm: "invalid" as SignatureAlgorithm,
        },
        key: privateKey,
      }),
    TypeError,
    "Unsupported signature algorithm",
  );

  // Invalid label
  await assertRejects(
    () =>
      signMessage({
        message: request,
        params: {
          components: ["@method"],
          keyId: "k",
          label: "INVALID",
          created: NOW,
        },
        key: privateKey,
      }),
    TypeError,
    "Invalid signature label",
  );

  // Negative created
  await assertRejects(
    () =>
      signMessage({
        message: request,
        params: { components: ["@method"], keyId: "k", created: -1 },
        key: privateKey,
      }),
    RangeError,
    "created must be a non-negative integer",
  );

  // Negative expires
  await assertRejects(
    () =>
      signMessage({
        message: request,
        params: {
          components: ["@method"],
          keyId: "k",
          created: NOW,
          expires: -1,
        },
        key: privateKey,
      }),
    RangeError,
    "expires must be a non-negative integer",
  );

  // Unsupported ECDSA curve
  const fakeEcdsaKey = {
    algorithm: { name: "ECDSA", namedCurve: "P-521" },
    type: "private",
    extractable: false,
    usages: ["sign"],
  } as unknown as CryptoKey;
  await assertRejects(
    () =>
      signMessage({
        message: request,
        params: { components: ["@method"], keyId: "k", created: NOW },
        key: fakeEcdsaKey,
      }),
    TypeError,
    'Unsupported ECDSA curve: "P-521"',
  );

  // Unsupported HMAC hash
  const fakeHmacKey = {
    algorithm: { name: "HMAC", hash: { name: "SHA-512" } },
    type: "secret",
    extractable: false,
    usages: ["sign"],
  } as unknown as CryptoKey;
  await assertRejects(
    () =>
      signMessage({
        message: request,
        params: { components: ["@method"], keyId: "k", created: NOW },
        key: fakeHmacKey,
      }),
    TypeError,
    'Unsupported HMAC hash: "SHA-512"',
  );

  // Unsupported RSA-PSS hash
  const fakeRsaPssKey = {
    algorithm: { name: "RSA-PSS", hash: { name: "SHA-256" } },
    type: "private",
    extractable: false,
    usages: ["sign"],
  } as unknown as CryptoKey;
  await assertRejects(
    () =>
      signMessage({
        message: request,
        params: { components: ["@method"], keyId: "k", created: NOW },
        key: fakeRsaPssKey,
      }),
    TypeError,
    'Unsupported RSA-PSS hash: "SHA-256"',
  );

  // Unsupported RSASSA-PKCS1-v1_5 hash
  const fakePkcs1Key = {
    algorithm: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-512" } },
    type: "private",
    extractable: false,
    usages: ["sign"],
  } as unknown as CryptoKey;
  await assertRejects(
    () =>
      signMessage({
        message: request,
        params: { components: ["@method"], keyId: "k", created: NOW },
        key: fakePkcs1Key,
      }),
    TypeError,
    'Unsupported RSASSA-PKCS1-v1_5 hash: "SHA-512"',
  );

  // Completely unknown algorithm name
  const fakeUnknownKey = {
    algorithm: { name: "X-Custom" },
    type: "private",
    extractable: false,
    usages: ["sign"],
  } as unknown as CryptoKey;
  await assertRejects(
    () =>
      signMessage({
        message: request,
        params: { components: ["@method"], keyId: "k", created: NOW },
        key: fakeUnknownKey,
      }),
    TypeError,
    'Cannot infer signature algorithm from key: "X-Custom"',
  );
});

// =============================================================================
// signMessage — metadata round-trip (nonce, tag, expires)
// =============================================================================

Deno.test("signMessage() and verifyMessage() round-trip preserves nonce, tag, and expires", async () => {
  const keyOrPair = await KEY_GENERATORS["ed25519"]!();
  const { privateKey, publicKey } = keys(keyOrPair);
  const request = new Request("https://example.com/", { method: "GET" });

  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "k",
      algorithm: "ed25519",
      created: NOW,
      expires: NOW + 3600,
      nonce: "abc123",
      tag: "my-app",
    },
    key: privateKey,
  });

  const results = await verifyMessage(signed, () => publicKey);
  assertEquals(results.length, 1);
  assertEquals(results[0]!.params.algorithm, "ed25519");
  assertEquals(results[0]!.params.nonce, "abc123");
  assertEquals(results[0]!.params.tag, "my-app");
  assertEquals(results[0]!.params.expires, NOW + 3600);
});

// =============================================================================
// signMessage — multiple signatures
// =============================================================================

Deno.test("signMessage() supports multiple signatures with different labels", async () => {
  const k1 = keys(await KEY_GENERATORS["ed25519"]!());
  const k2 = keys(await KEY_GENERATORS["ed25519"]!());
  const request = new Request("https://example.com/", { method: "GET" });

  const signed1 = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "key1",
      label: "sig1",
      created: NOW,
    },
    key: k1.privateKey,
  });
  const signed2 = await signMessage({
    message: signed1,
    params: {
      components: ["@method", "@authority"],
      keyId: "key2",
      label: "sig2",
      created: NOW,
    },
    key: k2.privateKey,
  });

  const sigInput = signed2.headers.get("Signature-Input")!;
  assertEquals(sigInput.includes("sig1="), true);
  assertEquals(sigInput.includes("sig2="), true);

  const results = await verifyMessage(
    signed2,
    (keyId) => keyId === "key1" ? k1.publicKey : k2.publicKey,
  );
  assertEquals(results.length, 2);
});

Deno.test("signMessage() rejects duplicate labels on already-signed messages", async () => {
  const { privateKey } = keys(await KEY_GENERATORS["ed25519"]!());
  const request = new Request("https://example.com/", { method: "GET" });

  const signed = await signMessage({
    message: request,
    params: { components: ["@method"], keyId: "k", created: NOW },
    key: privateKey,
  });

  // Default label collision ("sig" on both calls).
  await assertRejects(
    () =>
      signMessage({
        message: signed,
        params: { components: ["@authority"], keyId: "k", created: NOW },
        key: privateKey,
      }),
    TypeError,
    'Signature label "sig" is already present',
  );

  // Explicit label collision.
  const signedNamed = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "k",
      label: "proxy",
      created: NOW,
    },
    key: privateKey,
  });
  await assertRejects(
    () =>
      signMessage({
        message: signedNamed,
        params: {
          components: ["@authority"],
          keyId: "k",
          label: "proxy",
          created: NOW,
        },
        key: privateKey,
      }),
    TypeError,
    'Signature label "proxy" is already present',
  );
});

Deno.test("signMessage() rejects messages with malformed Signature-Input header", async () => {
  const { privateKey } = keys(await KEY_GENERATORS["ed25519"]!());
  const request = new Request("https://example.com/", {
    method: "GET",
    headers: { "Signature-Input": "!!not a valid dictionary!!" },
  });

  await assertRejects(
    () =>
      signMessage({
        message: request,
        params: { components: ["@method"], keyId: "k", created: NOW },
        key: privateKey,
      }),
    TypeError,
    'Cannot parse existing "Signature-Input" header',
  );
});

Deno.test("signMessage() rejects label collision in Signature header alone", async () => {
  const { privateKey } = keys(await KEY_GENERATORS["ed25519"]!());
  // Construct a message where only the Signature header carries the label.
  // Such a message is already malformed per RFC 9421 section 4 (labels MUST
  // match between the two headers), but signMessage should still refuse to
  // further corrupt it.
  const request = new Request("https://example.com/", {
    method: "GET",
    headers: { "Signature": "sig=:AAAA:" },
  });

  await assertRejects(
    () =>
      signMessage({
        message: request,
        params: { components: ["@method"], keyId: "k", created: NOW },
        key: privateKey,
      }),
    TypeError,
    'Signature label "sig" is already present in the "Signature" header',
  );
});

// =============================================================================
// verifyMessage — tampering and wrong key
// =============================================================================

Deno.test("verifyMessage() rejects tampered message and wrong key", async () => {
  const k1 = keys(await KEY_GENERATORS["ed25519"]!());
  const k2 = keys(await KEY_GENERATORS["ed25519"]!());
  const request = new Request("https://example.com/", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method", "content-type"],
      keyId: "k",
      created: NOW,
    },
    key: k1.privateKey,
  });

  // Tampered header
  const tampered = new Request(signed.url, {
    method: signed.method,
    headers: new Headers(signed.headers),
  });
  tampered.headers.set("Content-Type", "text/plain");
  await assertRejects(
    () => verifyMessage(tampered, () => k1.publicKey),
    Error,
    "Signature verification failed",
  );

  // Wrong key
  await assertRejects(
    () => verifyMessage(signed, () => k2.publicKey),
    Error,
    "Signature verification failed",
  );
});

// =============================================================================
// verifyMessage — constraint enforcement
// =============================================================================

Deno.test("verifyMessage() enforces maxAge, requiredComponents, labels, and expires", async () => {
  const { privateKey, publicKey } = keys(await KEY_GENERATORS["ed25519"]!());

  // maxAge exceeded
  const old = await signMessage({
    message: new Request("https://example.com/", { method: "GET" }),
    params: { components: ["@method"], keyId: "k", created: NOW - 3600 },
    key: privateKey,
  });
  await assertRejects(
    () => verifyMessage(old, () => publicKey, { maxAge: 60 }),
    Error,
    "has expired",
  );

  // maxAge without created
  const noCreated = await signMessage({
    message: new Request("https://example.com/", { method: "GET" }),
    params: { components: ["@method"], keyId: "k" },
    key: privateKey,
  });
  await assertRejects(
    () => verifyMessage(noCreated, () => publicKey, { maxAge: 60 }),
    Error,
    'no "created" timestamp but maxAge was requested',
  );

  // Expired via expires param
  const expired = await signMessage({
    message: new Request("https://example.com/", { method: "GET" }),
    params: {
      components: ["@method"],
      keyId: "k",
      created: 1000,
      expires: 1001,
    },
    key: privateKey,
  });
  await assertRejects(
    () => verifyMessage(expired, () => publicKey),
    Error,
    'past "expires" timestamp',
  );

  // Required component not covered
  const minimal = await signMessage({
    message: new Request("https://example.com/", { method: "GET" }),
    params: { components: ["@method"], keyId: "k", created: NOW },
    key: privateKey,
  });
  await assertRejects(
    () =>
      verifyMessage(minimal, () => publicKey, {
        requiredComponents: ["@authority"],
      }),
    Error,
    "does not cover required component",
  );

  // Labels filter — match vs no match
  const labeled = await signMessage({
    message: new Request("https://example.com/", { method: "GET" }),
    params: {
      components: ["@method"],
      keyId: "k",
      label: "mysig",
      created: NOW,
    },
    key: privateKey,
  });
  const matched = await verifyMessage(labeled, () => publicKey, {
    labels: ["mysig"],
  });
  assertEquals(matched.length, 1);
  const unmatched = await verifyMessage(labeled, () => publicKey, {
    labels: ["other"],
  });
  assertEquals(unmatched.length, 0);
});

// =============================================================================
// verifyMessage — input validation and malformed headers
// =============================================================================

Deno.test("verifyMessage() rejects invalid inputs and malformed headers", async () => {
  const { privateKey } = keys(await KEY_GENERATORS["ed25519"]!());

  // Negative maxAge
  const signed = await signMessage({
    message: new Request("https://example.com/", { method: "GET" }),
    params: { components: ["@method"], keyId: "k", created: NOW },
    key: privateKey,
  });
  await assertRejects(
    () =>
      verifyMessage(signed, () => {
        throw new Error("unreachable");
      }, { maxAge: -1 }),
    RangeError,
    "maxAge must be a non-negative integer",
  );

  // Missing Signature-Input
  await assertRejects(
    () =>
      verifyMessage(
        new Request("https://example.com/", { method: "GET" }),
        () => {
          throw new Error("unreachable");
        },
      ),
    TypeError,
    'Missing "Signature-Input" header',
  );

  // Missing Signature
  await assertRejects(
    () =>
      verifyMessage(
        new Request("https://example.com/", {
          method: "GET",
          headers: { "Signature-Input": 'sig=("@method");created=1618884473' },
        }),
        () => {
          throw new Error("unreachable");
        },
      ),
    TypeError,
    'Missing "Signature" header',
  );

  // Label in Signature-Input but not Signature
  await assertRejects(
    () =>
      verifyMessage(
        new Request("https://example.com/", {
          method: "GET",
          headers: {
            "Signature-Input": 'sig=("@method");created=1618884473',
            "Signature": "other=:AAAA:",
          },
        }),
        () => {
          throw new Error("unreachable");
        },
      ),
    TypeError,
    "found in Signature-Input but missing in Signature",
  );

  // Label in Signature but not Signature-Input
  await assertRejects(
    () =>
      verifyMessage(
        new Request("https://example.com/", {
          method: "GET",
          headers: {
            "Signature-Input": 'sig=("@method");created=1618884473',
            "Signature": "sig=:AAAA:, extra=:BBBB:",
          },
        }),
        () => {
          throw new Error("unreachable");
        },
      ),
    TypeError,
    "found in Signature but missing in Signature-Input",
  );

  // Signature-Input member is not an inner list
  await assertRejects(
    () =>
      verifyMessage(
        new Request("https://example.com/", {
          method: "GET",
          headers: { "Signature-Input": "sig=42", "Signature": "sig=:AAAA:" },
        }),
        () => {
          throw new Error("unreachable");
        },
      ),
    TypeError,
    "is not an Inner List",
  );

  // keyLookup returns null
  const signedForNull = await signMessage({
    message: new Request("https://example.com/", { method: "GET" }),
    params: { components: ["@method"], keyId: "unknown", created: NOW },
    key: privateKey,
  });
  await assertRejects(
    () => verifyMessage(signedForNull, () => null),
    TypeError,
    "Key not found",
  );
});

// =============================================================================
// verifyMessage — round-trip with component parameters (;sf, ;key, ;bs, ;name)
// =============================================================================

Deno.test("verifyMessage() round-trips with ;sf component parameter", async () => {
  const { privateKey, publicKey } = keys(await KEY_GENERATORS["ed25519"]!());
  const request = new Request("https://example.com/", {
    method: "GET",
    headers: { "Example-Dict": "a=1, b=2;x=1;y=2, c=(a b c)" },
  });

  const signed = await signMessage({
    message: request,
    params: {
      components: [
        "@method",
        { name: "example-dict", parameters: { sf: true } },
      ],
      keyId: "k",
      created: NOW,
    },
    key: privateKey,
  });

  const results = await verifyMessage(signed, () => publicKey);
  assertEquals(results.length, 1);
  const comp = results[0]!.params.components[1]!;
  assertEquals(comp.name, "example-dict");
  assertEquals(comp.parameters?.sf, true);
});

Deno.test("verifyMessage() round-trips with ;key component parameter", async () => {
  const { privateKey, publicKey } = keys(await KEY_GENERATORS["ed25519"]!());
  const request = new Request("https://example.com/", {
    method: "GET",
    headers: { "Example-Dict": "a=1, b=2" },
  });

  const signed = await signMessage({
    message: request,
    params: {
      components: [
        "@method",
        { name: "example-dict", parameters: { key: "a" } },
      ],
      keyId: "k",
      created: NOW,
    },
    key: privateKey,
  });

  const results = await verifyMessage(signed, () => publicKey);
  assertEquals(results.length, 1);
  const comp = results[0]!.params.components[1]!;
  assertEquals(comp.parameters?.key, "a");
});

Deno.test("verifyMessage() round-trips with ;bs component parameter", async () => {
  const { privateKey, publicKey } = keys(await KEY_GENERATORS["ed25519"]!());
  const request = new Request("https://example.com/", {
    method: "GET",
    headers: { "X-Value": "some-value" },
  });

  const signed = await signMessage({
    message: request,
    params: {
      components: [
        "@method",
        { name: "x-value", parameters: { bs: true } },
      ],
      keyId: "k",
      created: NOW,
    },
    key: privateKey,
  });

  const results = await verifyMessage(signed, () => publicKey);
  assertEquals(results.length, 1);
  const comp = results[0]!.params.components[1]!;
  assertEquals(comp.parameters?.bs, true);
});

Deno.test("verifyMessage() round-trips with ;name component parameter (@query-param)", async () => {
  const { privateKey, publicKey } = keys(await KEY_GENERATORS["ed25519"]!());
  const request = new Request("https://example.com/path?foo=bar", {
    method: "GET",
  });

  const signed = await signMessage({
    message: request,
    params: {
      components: [
        "@method",
        { name: "@query-param", parameters: { name: "foo" } },
      ],
      keyId: "k",
      created: NOW,
    },
    key: privateKey,
  });

  const results = await verifyMessage(signed, () => publicKey);
  assertEquals(results.length, 1);
  const comp = results[0]!.params.components[1]!;
  assertEquals(comp.parameters?.name, "foo");
});

// =============================================================================
// verifyMessage — requiredComponents success path
// =============================================================================

Deno.test("verifyMessage() passes when all requiredComponents are covered", async () => {
  const { privateKey, publicKey } = keys(await KEY_GENERATORS["ed25519"]!());
  const request = new Request("https://example.com/", { method: "GET" });

  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method", "@authority"],
      keyId: "k",
      created: NOW,
    },
    key: privateKey,
  });

  const results = await verifyMessage(signed, () => publicKey, {
    requiredComponents: ["@method"],
  });
  assertEquals(results.length, 1);
});

// =============================================================================
// verifyMessage — malformed Signature header values
// =============================================================================

Deno.test("verifyMessage() rejects Signature member that is not an Item", async () => {
  await assertRejects(
    () =>
      verifyMessage(
        new Request("https://example.com/", {
          method: "GET",
          headers: {
            "Signature-Input": 'sig=("@method");created=1618884473',
            "Signature": "sig=(1 2 3)",
          },
        }),
        () => {
          throw new Error("unreachable");
        },
      ),
    TypeError,
    "is not an Item",
  );
});

Deno.test("verifyMessage() rejects Signature member that is not a Byte Sequence", async () => {
  await assertRejects(
    () =>
      verifyMessage(
        new Request("https://example.com/", {
          method: "GET",
          headers: {
            "Signature-Input": 'sig=("@method");created=1618884473',
            "Signature": "sig=42",
          },
        }),
        () => {
          throw new Error("unreachable");
        },
      ),
    TypeError,
    "is not a Byte Sequence",
  );
});

Deno.test("verifyMessage() parses ;tr parameter then rejects during base construction", async () => {
  await assertRejects(
    () =>
      verifyMessage(
        new Request("https://example.com/", {
          method: "GET",
          headers: {
            "Example": "value",
            "Signature-Input":
              'sig=("example";tr);created=1618884473;keyid="k"',
            "Signature": "sig=:AAAA:",
          },
        }),
        () => {
          throw new Error("unreachable");
        },
      ),
    TypeError,
    "Trailer field resolution",
  );
});

Deno.test("verifyMessage() rejects non-string component identifier in Signature-Input", async () => {
  await assertRejects(
    () =>
      verifyMessage(
        new Request("https://example.com/", {
          method: "GET",
          headers: {
            "Signature-Input": "sig=(42);created=1618884473",
            "Signature": "sig=:AAAA:",
          },
        }),
        () => {
          throw new Error("unreachable");
        },
      ),
    TypeError,
    "is not a String",
  );
});

// =============================================================================
// Response signing with ;req components (end-to-end)
// =============================================================================

Deno.test("verifyMessage() verifies response signature with ;req components", async () => {
  const { privateKey, publicKey } = keys(await KEY_GENERATORS["ed25519"]!());
  const request = new Request("https://example.com/foo", { method: "POST" });
  const response = new Response('{"ok":true}', {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  const signed = await signMessage({
    message: response,
    params: {
      components: [
        "@status",
        "content-type",
        { name: "@method", parameters: { req: true } },
        { name: "@path", parameters: { req: true } },
      ],
      keyId: "server-key",
      created: NOW,
    },
    key: privateKey,
    request,
  });

  const results = await verifyMessage(signed, () => publicKey, { request });
  assertEquals(results.length, 1);
  assertEquals(results[0]!.params.keyId, "server-key");
});
