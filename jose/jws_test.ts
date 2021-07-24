import { assertEquals, assertThrowsAsync } from "../testing/asserts.ts";
import * as jws from "./jws.ts";

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

Deno.test("compact serialization encode invalid key algorithm", async () => {
  await assertThrowsAsync(
    async () =>
      await jws.encodeCompactSerialization(
        {
          header: { alg: "HS256", typ: "JWT" },
          payload: new TextEncoder().encode(
            `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
          ),
        },
        hs512Key,
      ),
    Error,
    "key algorithm does not match with alg 'HS256'",
  );
});
Deno.test("compact serialization decode malformed token", async () => {
  await assertThrowsAsync(
    async () =>
      await jws.decodeCompactSerialization(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c.3qwefom",
        hs256Key,
      ),
    Error,
    "ws malformedasync ",
  );
  await assertThrowsAsync(
    async () =>
      await jws.decodeCompactSerialization(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
        hs256Key,
      ),
    Error,
    "ws malformed",
  );
});
Deno.test("compact serialization decode invalid signature", async () => {
  await assertThrowsAsync(
    async () =>
      await jws.decodeCompactSerialization(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.TflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5d",
        hs256Key,
      ),
    Error,
    "signature verification failed",
  );
});

Deno.test("compact serialization encode none", async () => {
  const token = await jws.encodeCompactSerialization(
    {
      header: { alg: "none", typ: "JWT" },
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
    },
    null,
  );
  assertEquals(
    token,
    "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.",
  );
});
Deno.test("compact serialization decode none", async () => {
  const token =
    "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.";
  assertEquals(
    await jws.decodeCompactSerialization(token, null),
    {
      header: {
        alg: "none",
        typ: "JWT",
      },
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
    },
  );
});

Deno.test("compact serialization encode HS256", async () => {
  const token = await jws.encodeCompactSerialization(
    {
      header: { alg: "HS256", typ: "JWT" },
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
    },
    hs256Key,
  );
  assertEquals(
    token,
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  );
});
Deno.test("compact serialization decode HS256", async () => {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  assertEquals(
    await jws.decodeCompactSerialization(token, hs256Key),
    {
      header: { alg: "HS256", typ: "JWT" },
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
    },
  );
});

Deno.test("compact serialization encode HS384", async () => {
  const token = await jws.encodeCompactSerialization(
    {
      header: { alg: "HS384", typ: "JWT" },
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
    },
    hs384Key,
  );

  assertEquals(
    token,
    "eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.8aMsJp4VGY_Ia2s9iWrS8jARCggx0FDRn2FehblXyvGYRrVVbu3LkKKqx_MEuDjQ",
  );
});
Deno.test("compact serialization decode HS384", async () => {
  const token =
    "eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.8aMsJp4VGY_Ia2s9iWrS8jARCggx0FDRn2FehblXyvGYRrVVbu3LkKKqx_MEuDjQ";
  assertEquals(
    await jws.decodeCompactSerialization(token, hs384Key),
    {
      header: { alg: "HS384", typ: "JWT" },
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
    },
  );
});

Deno.test("compact serialization encode HS512", async () => {
  const token = await jws.encodeCompactSerialization(
    {
      header: { alg: "HS512", typ: "JWT" },
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
    },
    hs512Key,
  );
  assertEquals(
    token,
    "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ._MRZSQUbU6G_jPvXIlFsWSU-PKT203EdcU388r5EWxSxg8QpB3AmEGSo2fBfMYsOaxvzos6ehRm4CYO1MrdwUg",
  );
});
Deno.test("compact serialization decode HS512", async () => {
  const token =
    "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ._MRZSQUbU6G_jPvXIlFsWSU-PKT203EdcU388r5EWxSxg8QpB3AmEGSo2fBfMYsOaxvzos6ehRm4CYO1MrdwUg";
  assertEquals(
    await jws.decodeCompactSerialization(token, hs512Key),
    {
      header: { alg: "HS512", typ: "JWT" },
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
    },
  );
});

Deno.test("json flattened serialization encode none", async () => {
  const data = await jws.encodeJsonFlattenedSerialization(
    {
      protected: { alg: "none", typ: "JWT" },
      header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
    },
    null,
  );
  assertEquals(
    data,
    {
      header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
      payload:
        "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
      protected: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0",
      signature: "",
    },
  );
});
Deno.test("json flattened serialization decode none", async () => {
  const token =
    "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.";
  assertEquals(
    await jws.decodeCompactSerialization(token, null),
    {
      header: {
        alg: "none",
        typ: "JWT",
      },
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
    },
  );
});

Deno.test("json flattened serialization encode HS256", async () => {
  const data = await jws.encodeJsonFlattenedSerialization(
    {
      protected: { alg: "HS256", typ: "JWT" },
      header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
    },
    hs256Key,
  );
  assertEquals(
    data,
    {
      header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
      payload:
        "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
      protected: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      signature: "tKzC0WOlNtBIo8qMXGTTQGUIreFSdOyOQJqN2yZiLSY",
    },
  );
});
Deno.test("json flattened serialization decode HS256", async () => {
  const data = {
    header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
    payload:
      "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
    protected: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    signature: "tKzC0WOlNtBIo8qMXGTTQGUIreFSdOyOQJqN2yZiLSY",
  };
  assertEquals(
    await jws.decodeJsonFlattenedSerialization(data, hs256Key),
    {
      header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
      protected: {
        alg: "HS256",
        typ: "JWT",
      },
    },
  );
});

Deno.test("json flattened serialization encode HS512", async () => {
  const data = await jws.encodeJsonFlattenedSerialization(
    {
      protected: { alg: "HS512", typ: "JWT" },
      header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
    },
    hs512Key,
  );
  assertEquals(
    data,
    {
      header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
      payload:
        "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
      protected: "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9",
      signature:
        "CEJOOHtLHwFnaaZExGYHg-x6D3QKUL3KlYWWp_lcJu_UnervcMkbjpyvZ3sDGCS1Zz9cEV_vMElN3hxkS9dJmw",
    },
  );
});
Deno.test("json flattened serialization decode HS512", async () => {
  const data = {
    header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
    payload:
      "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
    protected: "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9",
    signature:
      "CEJOOHtLHwFnaaZExGYHg-x6D3QKUL3KlYWWp_lcJu_UnervcMkbjpyvZ3sDGCS1Zz9cEV_vMElN3hxkS9dJmw",
  };
  assertEquals(
    await jws.decodeJsonFlattenedSerialization(data, hs512Key),
    {
      header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
      protected: {
        alg: "HS512",
        typ: "JWT",
      },
    },
  );
});

Deno.test("json general serialization encode none", async () => {
  const data = await jws.encodeJsonGeneralSerialization(
    {
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
      signatures: [
        {
          protected: { alg: "none", typ: "JWT" },
          header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
          signature: new ArrayBuffer(0),
        },
      ],
    },
    null,
  );
  assertEquals(
    data,
    {
      payload:
        "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
      signatures: [
        {
          header: {
            kid: "e9bc097a-ce51-4036-9562-d2ade882db0d",
          },
          protected: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0",
          signature: "",
        },
      ],
    },
  );
});
Deno.test("json general serialization decode none", async () => {
  const data = await jws.decodeJsonGeneralSerialization({
    payload:
      "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
    signatures: [
      {
        header: {
          kid: "e9bc097a-ce51-4036-9562-d2ade882db0d",
        },
        protected: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0",
        signature: "",
      },
    ],
  }, null);
  assertEquals(
    data,
    {
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
      signatures: [
        {
          protected: { alg: "none", typ: "JWT" },
          header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
          signature: new ArrayBuffer(0),
        },
      ],
    },
  );
});

Deno.test("json general serialization encode HS256", async () => {
  const data = await jws.encodeJsonGeneralSerialization(
    {
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
      signatures: [
        {
          protected: { alg: "HS256", typ: "JWT" },
          header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
          signature: new ArrayBuffer(0),
        },
      ],
    },
    hs256Key,
  );
  assertEquals(
    data,
    {
      payload:
        "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
      signatures: [
        {
          header: {
            kid: "e9bc097a-ce51-4036-9562-d2ade882db0d",
          },
          protected: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
          signature: "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        },
      ],
    },
  );
});
Deno.test("json general serialization decode HS256", async () => {
  const data = await jws.decodeJsonGeneralSerialization({
    payload:
      "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
    signatures: [
      {
        header: {
          kid: "e9bc097a-ce51-4036-9562-d2ade882db0d",
        },
        protected: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        signature: "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      },
    ],
  }, hs256Key);
  assertEquals(
    data,
    {
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
      signatures: [
        {
          protected: { alg: "HS256", typ: "JWT" },
          header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
          signature: new ArrayBuffer(0),
        },
      ],
    },
  );
});

Deno.test("json general serialization encode HS512", async () => {
  const data = await jws.encodeJsonGeneralSerialization(
    {
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
      signatures: [
        {
          protected: { alg: "HS512", typ: "JWT" },
          header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
          signature: new ArrayBuffer(0),
        },
      ],
    },
    hs512Key,
  );
  assertEquals(
    data,
    {
      payload:
        "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
      signatures: [
        {
          header: {
            kid: "e9bc097a-ce51-4036-9562-d2ade882db0d",
          },
          protected: "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9",
          signature:
            "_MRZSQUbU6G_jPvXIlFsWSU-PKT203EdcU388r5EWxSxg8QpB3AmEGSo2fBfMYsOaxvzos6ehRm4CYO1MrdwUg",
        },
      ],
    },
  );
});
Deno.test("json general serialization decode HS512", async () => {
  const data = await jws.decodeJsonGeneralSerialization({
    payload:
      "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
    signatures: [
      {
        header: {
          kid: "e9bc097a-ce51-4036-9562-d2ade882db0d",
        },
        protected: "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9",
        signature:
          "_MRZSQUbU6G_jPvXIlFsWSU-PKT203EdcU388r5EWxSxg8QpB3AmEGSo2fBfMYsOaxvzos6ehRm4CYO1MrdwUg",
      },
    ],
  }, hs512Key);
  assertEquals(
    data,
    {
      payload: new TextEncoder().encode(
        `{"sub":"1234567890","name":"John Doe","iat":1516239022}`,
      ),
      signatures: [
        {
          protected: { alg: "HS512", typ: "JWT" },
          header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
          signature: new ArrayBuffer(0),
        },
      ],
    },
  );
});
