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

async function generateEd25519(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    "Ed25519",
    true,
    ["sign", "verify"],
  ) as CryptoKeyPair;
}

async function generateHmacKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
}

async function generateEcdsaP256(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  ) as CryptoKeyPair;
}

async function generateEcdsaP384(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-384" },
    true,
    ["sign", "verify"],
  ) as CryptoKeyPair;
}

async function generateRsaPss(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-512",
    },
    true,
    ["sign", "verify"],
  ) as CryptoKeyPair;
}

async function generateRsaPkcs1(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  ) as CryptoKeyPair;
}

// =============================================================================
// Layer 1: Component value resolution — derived components
// =============================================================================

Deno.test("createSignatureBase() resolves @method", () => {
  const request = new Request("https://example.com/path", { method: "POST" });
  const base = createSignatureBase({
    message: request,
    params: { components: ["@method"], created: 1618884473 },
  });
  assertEquals(base.split("\n")[0], '"@method": POST');
});

Deno.test("createSignatureBase() resolves @target-uri", () => {
  const request = new Request("https://www.example.com/path?param=value");
  const base = createSignatureBase({
    message: request,
    params: { components: ["@target-uri"], created: 1618884473 },
  });
  assertEquals(
    base.split("\n")[0],
    '"@target-uri": https://www.example.com/path?param=value',
  );
});

Deno.test("createSignatureBase() resolves @authority with default port omitted", () => {
  const request = new Request("https://www.example.com/path");
  const base = createSignatureBase({
    message: request,
    params: { components: ["@authority"], created: 1618884473 },
  });
  assertEquals(base.split("\n")[0], '"@authority": www.example.com');
});

Deno.test("createSignatureBase() resolves @scheme", () => {
  const request = new Request("https://example.com/");
  const base = createSignatureBase({
    message: request,
    params: { components: ["@scheme"], created: 1618884473 },
  });
  assertEquals(base.split("\n")[0], '"@scheme": https');
});

Deno.test("createSignatureBase() resolves @request-target", () => {
  const request = new Request("https://example.com/path?param=value");
  const base = createSignatureBase({
    message: request,
    params: { components: ["@request-target"], created: 1618884473 },
  });
  assertEquals(base.split("\n")[0], '"@request-target": /path?param=value');
});

Deno.test("createSignatureBase() resolves @path with empty path normalized to slash", () => {
  const request = new Request("https://example.com");
  const base = createSignatureBase({
    message: request,
    params: { components: ["@path"], created: 1618884473 },
  });
  assertEquals(base.split("\n")[0], '"@path": /');
});

Deno.test("createSignatureBase() resolves @query with absent query as ?", () => {
  const request = new Request("https://example.com/path");
  const base = createSignatureBase({
    message: request,
    params: { components: ["@query"], created: 1618884473 },
  });
  assertEquals(base.split("\n")[0], '"@query": ?');
});

Deno.test("createSignatureBase() resolves @query-param with percent-encoding", () => {
  const request = new Request(
    "https://example.com/path?param=value&foo=bar",
  );
  const base = createSignatureBase({
    message: request,
    params: {
      components: [{ name: "@query-param", parameters: { name: "param" } }],
      created: 1618884473,
    },
  });
  assertEquals(base.split("\n")[0], '"@query-param";name="param": value');
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
// Layer 1b: Field component parameters
// =============================================================================

Deno.test("createSignatureBase() resolves plain header field value", () => {
  const request = new Request("https://example.com/", {
    headers: { "Content-Type": "application/json" },
  });
  const base = createSignatureBase({
    message: request,
    params: { components: ["content-type"], created: 1618884473 },
  });
  assertEquals(base.split("\n")[0], '"content-type": application/json');
});

Deno.test("createSignatureBase() resolves ;sf strict serialization", () => {
  const request = new Request("https://example.com/", {
    headers: { "Example-Dict": "a=1,    b=2;x=1;y=2,   c=(a   b   c)" },
  });
  const base = createSignatureBase({
    message: request,
    params: {
      components: [{ name: "example-dict", parameters: { sf: true } }],
      created: 1618884473,
    },
  });
  assertEquals(
    base.split("\n")[0],
    '"example-dict";sf: a=1, b=2;x=1;y=2, c=(a b c)',
  );
});

Deno.test("createSignatureBase() resolves ;key dictionary member", () => {
  const request = new Request("https://example.com/", {
    headers: { "Example-Dict": "a=1, b=2;x=1;y=2, c=(a b c), d" },
  });
  const base = createSignatureBase({
    message: request,
    params: {
      components: [{ name: "example-dict", parameters: { key: "a" } }],
      created: 1618884473,
    },
  });
  assertEquals(base.split("\n")[0], '"example-dict";key="a": 1');
});

Deno.test("createSignatureBase() resolves ;bs binary-wrapped field", () => {
  const request = new Request("https://example.com/", {
    headers: { "Example-Header": "value, with, lots" },
  });
  const base = createSignatureBase({
    message: request,
    params: {
      components: [{ name: "example-header", parameters: { bs: true } }],
      created: 1618884473,
    },
  });
  const line = base.split("\n")[0]!;
  // The bs parameter wraps each value as a Byte Sequence
  assertEquals(line.startsWith('"example-header";bs: :'), true);
});

// =============================================================================
// Layer 1c: Component resolution errors
// =============================================================================

Deno.test("createSignatureBase() throws TypeError on missing header field", () => {
  const request = new Request("https://example.com/");
  assertThrows(
    () =>
      createSignatureBase({
        message: request,
        params: { components: ["x-nonexistent"] },
      }),
    TypeError,
    'Missing "x-nonexistent" header field',
  );
});

Deno.test("createSignatureBase() throws TypeError on unknown derived component", () => {
  const request = new Request("https://example.com/");
  assertThrows(
    () =>
      createSignatureBase({
        message: request,
        params: { components: ["@unknown"] },
      }),
    TypeError,
    'Unknown derived component "@unknown"',
  );
});

Deno.test("createSignatureBase() throws TypeError on @status for request message", () => {
  const request = new Request("https://example.com/");
  assertThrows(
    () =>
      createSignatureBase({
        message: request,
        params: { components: ["@status"] },
      }),
    TypeError,
    'Cannot use "@status" on a request message',
  );
});

Deno.test("createSignatureBase() throws TypeError on incompatible ;bs and ;sf", () => {
  const request = new Request("https://example.com/", {
    headers: { "Example": "value" },
  });
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
});

// =============================================================================
// Layer 1d: ;req parameter
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
// Layer 2: Signature base construction
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

Deno.test("createSignatureBase() rejects duplicate component identifier", () => {
  const request = new Request("https://example.com/", {
    headers: { "Content-Type": "text/plain" },
  });
  assertThrows(
    () =>
      createSignatureBase({
        message: request,
        params: { components: ["content-type", "content-type"] },
      }),
    TypeError,
    "Duplicate component identifier",
  );
});

// =============================================================================
// Layer 2b: ECDSA DER/raw conversion (tested via round-trip)
// =============================================================================

Deno.test("signMessage() and verifyMessage() round-trip with ecdsa-p256-sha256 exercises DER/raw conversion", async () => {
  const keys = await generateEcdsaP256();
  const request = new Request("https://example.com/", { method: "GET" });
  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "test-ecdsa-p256",
      algorithm: "ecdsa-p256-sha256",
      created: Math.floor(Date.now() / 1000),
    },
    key: keys.privateKey,
  });

  const results = await verifyMessage(
    signed,
    () => keys.publicKey,
  );
  assertEquals(results.length, 1);
  assertEquals(results[0]!.label, "sig");
});

// =============================================================================
// Layer 3: Sign and verify integration — one per algorithm
// =============================================================================

Deno.test("signMessage() and verifyMessage() round-trip with ed25519", async () => {
  const keys = await generateEd25519();
  const request = new Request("https://example.com/", { method: "POST" });
  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method", "@authority"],
      keyId: "test-ed25519",
      created: Math.floor(Date.now() / 1000),
    },
    key: keys.privateKey,
  });

  const results = await verifyMessage(signed, () => keys.publicKey);
  assertEquals(results.length, 1);
  assertEquals(results[0]!.params.keyId, "test-ed25519");
});

Deno.test("signMessage() and verifyMessage() round-trip with hmac-sha256", async () => {
  const key = await generateHmacKey();
  const request = new Request("https://example.com/", { method: "GET" });
  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "test-hmac",
      algorithm: "hmac-sha256",
      created: Math.floor(Date.now() / 1000),
    },
    key,
  });

  const results = await verifyMessage(signed, () => key);
  assertEquals(results.length, 1);
});

Deno.test("signMessage() and verifyMessage() round-trip with ecdsa-p384-sha384", async () => {
  const keys = await generateEcdsaP384();
  const request = new Request("https://example.com/", { method: "GET" });
  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "test-ecdsa-p384",
      algorithm: "ecdsa-p384-sha384",
      created: Math.floor(Date.now() / 1000),
    },
    key: keys.privateKey,
  });

  const results = await verifyMessage(signed, () => keys.publicKey);
  assertEquals(results.length, 1);
});

Deno.test("signMessage() and verifyMessage() round-trip with rsa-pss-sha512", async () => {
  const keys = await generateRsaPss();
  const request = new Request("https://example.com/", { method: "GET" });
  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "test-rsa-pss",
      algorithm: "rsa-pss-sha512",
      created: Math.floor(Date.now() / 1000),
    },
    key: keys.privateKey,
  });

  const results = await verifyMessage(signed, () => keys.publicKey);
  assertEquals(results.length, 1);
});

Deno.test("signMessage() and verifyMessage() round-trip with rsa-v1_5-sha256", async () => {
  const keys = await generateRsaPkcs1();
  const request = new Request("https://example.com/", { method: "GET" });
  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "test-rsa-pkcs1",
      algorithm: "rsa-v1_5-sha256",
      created: Math.floor(Date.now() / 1000),
    },
    key: keys.privateKey,
  });

  const results = await verifyMessage(signed, () => keys.publicKey);
  assertEquals(results.length, 1);
});

// =============================================================================
// Layer 3b: signMessage behaviour
// =============================================================================

Deno.test("signMessage() preserves existing headers on the message", async () => {
  const keys = await generateEd25519();
  const request = new Request("https://example.com/", {
    method: "GET",
    headers: { "X-Custom": "preserved" },
  });
  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "k",
      created: Math.floor(Date.now() / 1000),
    },
    key: keys.privateKey,
  });
  assertEquals(signed.headers.get("X-Custom"), "preserved");
  assertEquals(signed.headers.has("Signature"), true);
  assertEquals(signed.headers.has("Signature-Input"), true);
});

Deno.test("signMessage() defaults label to sig", async () => {
  const keys = await generateEd25519();
  const request = new Request("https://example.com/", { method: "GET" });
  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "k",
      created: Math.floor(Date.now() / 1000),
    },
    key: keys.privateKey,
  });
  const sigInput = signed.headers.get("Signature-Input")!;
  assertEquals(sigInput.startsWith("sig="), true);
});

Deno.test("signMessage() throws TypeError on unsupported algorithm", async () => {
  const keys = await generateEd25519();
  const request = new Request("https://example.com/", { method: "GET" });
  await assertRejects(
    () =>
      signMessage({
        message: request,
        params: {
          components: ["@method"],
          algorithm: "invalid-algo" as SignatureAlgorithm,
        },
        key: keys.privateKey,
      }),
    TypeError,
    "Unsupported signature algorithm",
  );
});

Deno.test("signMessage() throws RangeError on negative created timestamp", async () => {
  const keys = await generateEd25519();
  const request = new Request("https://example.com/", { method: "GET" });
  await assertRejects(
    () =>
      signMessage({
        message: request,
        params: {
          components: ["@method"],
          keyId: "k",
          created: -1,
        },
        key: keys.privateKey,
      }),
    RangeError,
    "created must be a non-negative integer",
  );
});

// =============================================================================
// Layer 3c: verifyMessage behaviour
// =============================================================================

Deno.test("verifyMessage() throws Error on tampered header value", async () => {
  const keys = await generateEd25519();
  const request = new Request("https://example.com/", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method", "content-type"],
      keyId: "k",
      created: Math.floor(Date.now() / 1000),
    },
    key: keys.privateKey,
  });

  // Tamper with the content-type header
  const tampered = new Request(signed.url, {
    method: signed.method,
    headers: new Headers(signed.headers),
  });
  tampered.headers.set("Content-Type", "text/plain");

  await assertRejects(
    () => verifyMessage(tampered, () => keys.publicKey),
    Error,
    "Signature verification failed",
  );
});

Deno.test("verifyMessage() throws Error on wrong key", async () => {
  const keys1 = await generateEd25519();
  const keys2 = await generateEd25519();
  const request = new Request("https://example.com/", { method: "GET" });
  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "k",
      created: Math.floor(Date.now() / 1000),
    },
    key: keys1.privateKey,
  });

  await assertRejects(
    () => verifyMessage(signed, () => keys2.publicKey),
    Error,
    "Signature verification failed",
  );
});

Deno.test("verifyMessage() throws Error on expired signature when maxAge is set", async () => {
  const keys = await generateEd25519();
  const request = new Request("https://example.com/", { method: "GET" });
  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "k",
      created: Math.floor(Date.now() / 1000) - 3600,
    },
    key: keys.privateKey,
  });

  await assertRejects(
    () => verifyMessage(signed, () => keys.publicKey, { maxAge: 60 }),
    Error,
    "has expired",
  );
});

Deno.test("verifyMessage() throws Error when requiredComponents are not covered", async () => {
  const keys = await generateEd25519();
  const request = new Request("https://example.com/", { method: "GET" });
  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "k",
      created: Math.floor(Date.now() / 1000),
    },
    key: keys.privateKey,
  });

  await assertRejects(
    () =>
      verifyMessage(signed, () => keys.publicKey, {
        requiredComponents: ["@authority"],
      }),
    Error,
    "does not cover required component",
  );
});

Deno.test("verifyMessage() filters by labels option", async () => {
  const keys = await generateEd25519();
  const request = new Request("https://example.com/", { method: "GET" });
  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "k",
      label: "mysig",
      created: Math.floor(Date.now() / 1000),
    },
    key: keys.privateKey,
  });

  // Verify only "mysig" — should succeed
  const results = await verifyMessage(signed, () => keys.publicKey, {
    labels: ["mysig"],
  });
  assertEquals(results.length, 1);

  // Verify only "other" — should return empty (no matching labels)
  const empty = await verifyMessage(signed, () => keys.publicKey, {
    labels: ["other"],
  });
  assertEquals(empty.length, 0);
});

Deno.test("verifyMessage() throws TypeError on missing Signature-Input header", async () => {
  const request = new Request("https://example.com/", { method: "GET" });
  await assertRejects(
    () => verifyMessage(request, () => { throw new Error("unreachable"); }),
    TypeError,
    'Missing "Signature-Input" header',
  );
});

Deno.test("verifyMessage() throws RangeError on negative maxAge", async () => {
  const keys = await generateEd25519();
  const request = new Request("https://example.com/", { method: "GET" });
  const signed = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "k",
      created: Math.floor(Date.now() / 1000),
    },
    key: keys.privateKey,
  });

  await assertRejects(
    () => verifyMessage(signed, () => keys.publicKey, { maxAge: -1 }),
    RangeError,
    "maxAge must be a non-negative integer",
  );
});

// =============================================================================
// Layer 3d: Advanced scenarios
// =============================================================================

Deno.test("signMessage() supports multiple signatures with different labels", async () => {
  const keys1 = await generateEd25519();
  const keys2 = await generateEd25519();
  const request = new Request("https://example.com/", { method: "GET" });

  const signed1 = await signMessage({
    message: request,
    params: {
      components: ["@method"],
      keyId: "key1",
      label: "sig1",
      created: Math.floor(Date.now() / 1000),
    },
    key: keys1.privateKey,
  });

  const signed2 = await signMessage({
    message: signed1,
    params: {
      components: ["@method", "@authority"],
      keyId: "key2",
      label: "sig2",
      created: Math.floor(Date.now() / 1000),
    },
    key: keys2.privateKey,
  });

  const sigInput = signed2.headers.get("Signature-Input")!;
  assertEquals(sigInput.includes("sig1="), true);
  assertEquals(sigInput.includes("sig2="), true);

  // Verify both
  const results = await verifyMessage(
    signed2,
    (keyId) => {
      if (keyId === "key1") return keys1.publicKey;
      return keys2.publicKey;
    },
  );
  assertEquals(results.length, 2);
});

Deno.test("verifyMessage() verifies response signature with ;req components", async () => {
  const keys = await generateEd25519();
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
      created: Math.floor(Date.now() / 1000),
    },
    key: keys.privateKey,
    request,
  });

  const results = await verifyMessage(
    signed,
    () => keys.publicKey,
    { request },
  );
  assertEquals(results.length, 1);
  assertEquals(results[0]!.params.keyId, "server-key");
});
