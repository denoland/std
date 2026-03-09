// Copyright 2018-2026 the Deno authors. MIT license.
import {
  computeDigest,
  createContentDigest,
  createReprDigest,
  verifyContentDigest,
  verifyReprDigest,
} from "./unstable_digest_fields.ts";
import { assert, assertEquals, assertRejects } from "@std/assert";

Deno.test("computeDigest() returns correct SHA-256 for empty input", async () => {
  const digest = await computeDigest(new Uint8Array(0), "sha-256");
  assertEquals(digest.length, 32);
  const expected = new Uint8Array([
    0xe3,
    0xb0,
    0xc4,
    0x42,
    0x98,
    0xfc,
    0x1c,
    0x14,
    0x9a,
    0xfb,
    0xf4,
    0xc8,
    0x99,
    0x6f,
    0xb9,
    0x24,
    0x27,
    0xae,
    0x41,
    0xe4,
    0x64,
    0x9b,
    0x93,
    0x4c,
    0xa4,
    0x95,
    0x99,
    0x1b,
    0x78,
    0x52,
    0xb8,
    0x55,
  ]);
  assertEquals(digest, expected);
});

Deno.test("computeDigest() returns correct SHA-256 for known string", async () => {
  const encoder = new TextEncoder();
  const digest = await computeDigest(encoder.encode("hello"), "sha-256");
  assertEquals(digest.length, 32);
  const expected = new Uint8Array([
    0x2c,
    0xf2,
    0x4d,
    0xba,
    0x5f,
    0xb0,
    0xa3,
    0x0e,
    0x26,
    0xe8,
    0x3b,
    0x2a,
    0xc5,
    0xb9,
    0xe2,
    0x9e,
    0x1b,
    0x16,
    0x1e,
    0x5c,
    0x1f,
    0xa7,
    0x42,
    0x5e,
    0x73,
    0x04,
    0x33,
    0x62,
    0x93,
    0x8b,
    0x98,
    0x24,
  ]);
  assertEquals(digest, expected);
});

Deno.test("computeDigest() returns correct SHA-512 length", async () => {
  const digest = await computeDigest(new Uint8Array([1, 2, 3]), "sha-512");
  assertEquals(digest.length, 64);
});

Deno.test("computeDigest() throws on unsupported algorithm", async () => {
  await assertRejects(
    // deno-lint-ignore no-explicit-any
    () => computeDigest(new Uint8Array(0), "sha-384" as any),
    TypeError,
    'Unsupported digest algorithm: "sha-384"',
  );
});

Deno.test("createContentDigest() with string defaults to sha-256", async () => {
  const digest = await createContentDigest("hello");
  assert(digest.startsWith("sha-256=:"));
  assert(digest.endsWith(":"));
});

Deno.test("createContentDigest() with Uint8Array", async () => {
  const body = new TextEncoder().encode('{"amount":100}');
  const digest = await createContentDigest(body);
  assert(digest.startsWith("sha-256=:"));
  assert(digest.endsWith(":"));
  const digest2 = await createContentDigest('{"amount":100}');
  assertEquals(digest, digest2);
});

Deno.test("createContentDigest() with ReadableStream", async () => {
  const body = new Blob(["streamed"]).stream();
  const digest = await createContentDigest(body);
  assert(digest.startsWith("sha-256=:"));
  const digest2 = await createContentDigest("streamed");
  assertEquals(digest, digest2);
});

Deno.test("createContentDigest() with multiple algorithms", async () => {
  const digest = await createContentDigest("hello", {
    algorithms: ["sha-256", "sha-512"],
  });
  assert(digest.includes("sha-256=:"));
  assert(digest.includes("sha-512=:"));
});

Deno.test("createContentDigest() throws on empty algorithms array", async () => {
  await assertRejects(
    () => createContentDigest("hello", { algorithms: [] }),
    TypeError,
    "At least one algorithm must be specified",
  );
});

Deno.test("createContentDigest() with sha-512 only round-trips", async () => {
  const body = "sha-512 only test";
  const digest = await createContentDigest(body, {
    algorithms: ["sha-512"],
  });
  assert(digest.startsWith("sha-512=:"));
  assert(!digest.includes("sha-256"));
  const response = new Response(body, {
    headers: { "Content-Digest": digest },
  });
  const verified = await verifyContentDigest(response);
  assertEquals(await verified.text(), body);
});

Deno.test("verifyContentDigest() with valid digest leaves body consumable", async () => {
  const body = JSON.stringify({ amount: 100 });
  const digest = await createContentDigest(body);
  const response = new Response(body, {
    headers: { "Content-Digest": digest },
  });
  const verified = await verifyContentDigest(response);
  assertEquals(verified.body, response.body);
  const text = await verified.text();
  assertEquals(text, body);
});

Deno.test("verifyContentDigest() with valid digest on Request", async () => {
  const body = "post body";
  const digest = await createContentDigest(body);
  const request = new Request("https://example.com/", {
    method: "POST",
    body,
    headers: { "Content-Digest": digest },
  });
  const verified = await verifyContentDigest(request);
  assertEquals(await verified.text(), body);
});

Deno.test("verifyContentDigest() throws on tampered body", async () => {
  const body = "original";
  const digest = await createContentDigest(body);
  const response = new Response("tampered", {
    headers: { "Content-Digest": digest },
  });
  await assertRejects(
    () => verifyContentDigest(response),
    Error,
    "digest mismatch",
  );
});

Deno.test("verifyContentDigest() throws on missing header", async () => {
  const response = new Response("body", { headers: {} });
  await assertRejects(
    () => verifyContentDigest(response),
    TypeError,
    'Missing "Content-Digest" header',
  );
});

Deno.test("verifyContentDigest() throws on empty header value", async () => {
  const response = new Response("body");
  response.headers.set("Content-Digest", "");
  await assertRejects(
    () => verifyContentDigest(response),
    TypeError,
    'Missing "Content-Digest" header',
  );
});

Deno.test("verifyContentDigest() throws on malformed header", async () => {
  const response = new Response("body", {
    headers: { "Content-Digest": "not a valid structured field !!!" },
  });
  await assertRejects(
    () => verifyContentDigest(response),
    TypeError,
    '"Content-Digest" header is malformed',
  );
});

Deno.test("verifyContentDigest() with empty body", async () => {
  const digest = await createContentDigest("");
  const response = new Response(null, {
    status: 204,
    headers: { "Content-Digest": digest },
  });
  const verified = await verifyContentDigest(response);
  assertEquals(verified.body, null);
});

Deno.test("verifyContentDigest() with multi-algo header where one mismatches", async () => {
  const body = "test body";
  const validDigest = await createContentDigest(body, {
    algorithms: ["sha-256", "sha-512"],
  });
  // Tamper with the sha-512 portion while keeping sha-256 intact
  const sha256Part = validDigest.split(", ")[0]!;
  const tampered =
    `${sha256Part}, sha-512=:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:`;
  const response = new Response(body, {
    headers: { "Content-Digest": tampered },
  });
  await assertRejects(
    () => verifyContentDigest(response),
    Error,
    'digest mismatch for algorithm "sha-512"',
  );
});

Deno.test("createContentDigest() deduplicates duplicate algorithms", async () => {
  const single = await createContentDigest("hello", {
    algorithms: ["sha-256"],
  });
  const duped = await createContentDigest("hello", {
    algorithms: ["sha-256", "sha-256"],
  });
  assertEquals(single, duped);
});

Deno.test("createContentDigest() throws on unsupported algorithm in options", async () => {
  await assertRejects(
    // deno-lint-ignore no-explicit-any
    () => createContentDigest("hello", { algorithms: ["sha-384" as any] }),
    TypeError,
    'Unsupported digest algorithm: "sha-384"',
  );
});

Deno.test("createContentDigest() outputs algorithms in canonical order regardless of input order", async () => {
  const digest = await createContentDigest("hello", {
    algorithms: ["sha-512", "sha-256"],
  });
  const sha256Pos = digest.indexOf("sha-256=:");
  const sha512Pos = digest.indexOf("sha-512=:");
  assert(sha256Pos < sha512Pos, "sha-256 should appear before sha-512");
});

Deno.test("verifyReprDigest() with valid digest", async () => {
  const body = "repr body";
  const digest = await createReprDigest(body);
  const response = new Response(body, {
    headers: { "Repr-Digest": digest },
  });
  const verified = await verifyReprDigest(response);
  assertEquals(await verified.text(), body);
});

Deno.test("verifyReprDigest() throws on missing header", async () => {
  const response = new Response("body", { headers: {} });
  await assertRejects(
    () => verifyReprDigest(response),
    TypeError,
    'Missing "Repr-Digest" header',
  );
});

Deno.test("verifyContentDigest() with unsupported algorithm only in header", async () => {
  const response = new Response("x", {
    headers: {
      "Content-Digest":
        "sha-384=:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=:",
    },
  });
  await assertRejects(
    () => verifyContentDigest(response),
    TypeError,
    "no supported digest algorithms",
  );
});

Deno.test("verifyContentDigest() ignores inner-list members in header", async () => {
  const response = new Response("x", {
    headers: { "Content-Digest": "sha-256=(1 2 3)" },
  });
  await assertRejects(
    () => verifyContentDigest(response),
    TypeError,
    "no supported digest algorithms",
  );
});

Deno.test("verifyContentDigest() ignores non-binary item values in header", async () => {
  const response = new Response("x", {
    headers: { "Content-Digest": "sha-256=1" },
  });
  await assertRejects(
    () => verifyContentDigest(response),
    TypeError,
    "no supported digest algorithms",
  );
});
