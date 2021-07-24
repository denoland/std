import { assertEquals, assertThrows } from "../testing/asserts.ts";
import * as jwt from "./jwt.ts";

const hs256Key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode("your-256-bit-secret"),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);
const hs384Key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode("your-384-bit-secret"),
  { name: "HMAC", hash: "SHA-384" },
  false,
  ["sign", "verify"],
);
const hs512Key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode("your-512-bit-secret"),
  { name: "HMAC", hash: "SHA-512" },
  false,
  ["sign", "verify"],
);
Deno.test("encode none", async () => {
  const claimsSet = {
    sub: "1234567890",
    name: "John Doe",
    iat: 1516239022,
  };
  const header: jwt.Header = { alg: "none", typ: "JWT" };
  const token = await jwt.encode({ claimsSet, header }, null);
  assertEquals(
    token,
    "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.",
  );
});

Deno.test("decode none", async () => {
  const token =
    "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.";
  assertEquals(
    await jwt.decode(token, null),
    {
      claimsSet: {
        iat: 1516239022,
        name: "John Doe",
        sub: "1234567890",
      },
      header: {
        alg: "none",
        typ: "JWT",
      },
    },
  );
});

Deno.test("encode HS256", async () => {
  const claimsSet = {
    sub: "1234567890",
    name: "John Doe",
    iat: 1516239022,
  };
  const header: jwt.Header = { alg: "HS256", typ: "JWT" };
  const token = await jwt.encode({ claimsSet, header }, hs256Key);
  assertEquals(
    token,
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  );
});
Deno.test("decode HS256", async () => {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

  assertEquals(
    await jwt.decode(token, hs256Key),
    {
      claimsSet: {
        iat: 1516239022,
        name: "John Doe",
        sub: "1234567890",
      },
      header: {
        alg: "HS256",
        typ: "JWT",
      },
    },
  );
});

Deno.test("encode HS384", async () => {
  const claimsSet = {
    sub: "1234567890",
    name: "John Doe",
    iat: 1516239022,
  };
  const header: jwt.Header = { alg: "HS384", typ: "JWT" };
  const token = await jwt.encode({ claimsSet, header }, hs384Key);

  assertEquals(
    token,
    "eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.8aMsJp4VGY_Ia2s9iWrS8jARCggx0FDRn2FehblXyvGYRrVVbu3LkKKqx_MEuDjQ",
  );
});
Deno.test("decode HS384", async () => {
  const token =
    "eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.8aMsJp4VGY_Ia2s9iWrS8jARCggx0FDRn2FehblXyvGYRrVVbu3LkKKqx_MEuDjQ";

  assertEquals(
    await jwt.decode(token, hs384Key),
    {
      claimsSet: {
        iat: 1516239022,
        name: "John Doe",
        sub: "1234567890",
      },
      header: {
        alg: "HS384",
        typ: "JWT",
      },
    },
  );
});

Deno.test("encode HS512", async () => {
  const claimsSet = {
    sub: "1234567890",
    name: "John Doe",
    admin: true,
    iat: 1516239022,
  };
  const header: jwt.Header = { alg: "HS512", typ: "JWT" };
  const token = await jwt.encode({ claimsSet, header }, hs512Key);
  assertEquals(
    token,
    "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.VFb0qJ1LRg_4ujbZoRMXnVkUgiuKq5KxWqNdbKq_G9Vvz-S1zZa9LPxtHWKa64zDl2ofkT8F6jBt_K4riU-fPg",
  );
});
Deno.test("decode HS512", async () => {
  const token =
    "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.VFb0qJ1LRg_4ujbZoRMXnVkUgiuKq5KxWqNdbKq_G9Vvz-S1zZa9LPxtHWKa64zDl2ofkT8F6jBt_K4riU-fPg";
  assertEquals(
    await jwt.decode(token, hs512Key),
    {
      claimsSet: {
        sub: "1234567890",
        name: "John Doe",
        admin: true,
        iat: 1516239022,
      },
      header: {
        alg: "HS512",
        typ: "JWT",
      },
    },
  );
});

Deno.test("checkClaimsSet exp", () => {
  assertEquals(
    jwt.checkClaimsSet({ exp: (Date.now() / 1000) + 1 }, {
      exp: { leeway: 0 },
    }),
    true,
  );
  assertThrows(
    () =>
      jwt.checkClaimsSet({ exp: (Date.now() / 1000) - 1 }, {
        exp: { leeway: 0 },
      }),
    Error,
    "exp claim check failed",
  );
});
Deno.test("checkClaimsSet nbf", () => {
  assertEquals(
    jwt.checkClaimsSet({ nbf: (Date.now() / 1000) - 1 }, {
      nbf: { leeway: 0 },
    }),
    true,
  );
  assertThrows(
    () =>
      jwt.checkClaimsSet({ nbf: (Date.now() / 1000) + 1 }, {
        nbf: { leeway: 0 },
      }),
    Error,
    "nbf claim check failed",
  );
});
Deno.test("checkClaimsSet iss", () => {
  assertEquals(
    jwt.checkClaimsSet({ iss: "foo" }, { iss: "foo" }),
    true,
  );
  assertThrows(
    () => jwt.checkClaimsSet({ iss: "foo" }, { iss: "bar" }),
    Error,
    "iss claim check failed",
  );
});
Deno.test("checkClaimsSet aud", () => {
  assertEquals(
    jwt.checkClaimsSet({ aud: "foo" }, { aud: "foo" }),
    true,
  );
  assertEquals(
    jwt.checkClaimsSet({ aud: ["foo"] }, { aud: "foo" }),
    true,
  );
  assertEquals(
    jwt.checkClaimsSet({ aud: ["bar"] }, { aud: ["foo", "bar"] }),
    true,
  );
  assertThrows(
    () => jwt.checkClaimsSet({ aud: "foo" }, { aud: "bar" }),
    Error,
    "aud claim check failed",
  );
  assertThrows(
    () => jwt.checkClaimsSet({ aud: ["foo"] }, { aud: "bar" }),
    Error,
    "aud claim check failed",
  );
  assertThrows(
    () => jwt.checkClaimsSet({ aud: ["foo"] }, { aud: ["bar"] }),
    Error,
    "aud claim check failed",
  );
});
