# jose

jose is a module that provides jwt and jws implementation built upon Web Crypto
API.

## jwt

| Claim | Name            | Type              | Description                                                                                  |
| ----- | --------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| iss   | Issuer          | string            | identifies the principal that issued the JWT                                                 |
| sub   | Subject         | string            | identifies the principal that is the subject of the JWT                                      |
| aud   | Audience        | string[]          | string                                                                                       |
| exp   | Expiration Time | number in seconds | identifies the expiration time on or after which the JWT MUST NOT be accepted for processing |
| nbf   | Not Before      | number in seconds | identifies the time before which the JWT MUST NOT be accepted for processing                 |
| iat   | Issued At       | number in seconds | identifies the time at which the JWT was issued                                              |
| jti   | JWT ID          | string            | provides a unique identifier for the JWT                                                     |

### encode

encodes a header and claimsSet with a key and returns a jwt.

```typescript
import { jwt } from "https://deno.land/std@$STD_VERSION/jose/mod.ts";
const header = { alg: "HS256", typ: "JWT" };
const claimsSet = { iss: "John Doe" };
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode("secret"),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);
const token = await jwt.encode({ claimsSet, header }, key); // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJKb2huIERvZSJ9.ffuKko9Xxfb24ZIlJ9PZjcgrK1oF1hUqcMeBmTWiLXk
```

### decode

decoes a jwt, verifies the signature and verifies the claimsSet `exp` and/or
`nbf` if present. Optionally a VerifyOptions object can be passed to set a
custom leeway for `exp` and `nbf` and allow the verification of `iss`, `sub` and
`aud`.

```typescript
import { jwt } from "https://deno.land/std@$STD_VERSION/jose/mod.ts";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJKb2huIERvZSJ9.ffuKko9Xxfb24ZIlJ9PZjcgrK1oF1hUqcMeBmTWiLXk";
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode("secret"),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);
const data = await jwt.decode(token, key); // { header: { alg: "HS256", typ: "JWT" }, claimsSet: { iss: "John Doe" } }
```

```typescript
const data = await jwt.decode(token, key, { exp: { leeway: 60 } iss: "John Doe" }); // verifies exp with a leeway of 60 seconds and checks if iss is "John Doe"
```

## jws

### encodeCompactSerialization

```typescript
import { jws } from "https://deno.land/std@$STD_VERSION/jose/mod.ts";
const header = { alg: "HS256", typ: "JWT" };
const payload = new TextEncoder().encode(`{"iss":"John Doe"}`);
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode("secret"),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);
const token = await jws.encodeCompactSerialization({ payload, header }, key); // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJKb2huIERvZSJ9.ffuKko9Xxfb24ZIlJ9PZjcgrK1oF1hUqcMeBmTWiLXk
```

### decodeCompactSerialization

```typescript
import { jws } from "https://deno.land/std@$STD_VERSION/jose/mod.ts";
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJKb2huIERvZSJ9.ffuKko9Xxfb24ZIlJ9PZjcgrK1oF1hUqcMeBmTWiLXk";
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode("secret"),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);
const data = await jws.decodeCompactSerialization(token, key); // { header: { alg: "HS256", typ: "JWT" }, payload: Uint8Array(18) [123, 34, 105, 115, 115, 34, 58, 34, 74, 111, 104, 110, 32, 68, 111, 101, 34, 125] }
```

### encodeJsonFlattenedSerialization

```typescript
import { jws } from "https://deno.land/std@$STD_VERSION/jose/mod.ts";
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode("secret"),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);
const protectedHeader = { alg: "HS256", typ: "JWT" };
const header = {};
const payload = new TextEncoder().encode(`hello world`);
const data = await jws.encodeJsonFlattenedSerialization({
  protectedHeader,
  header,
  payload,
}, key);
```

### decodeJsonFlattenedSerialization

```typescript
import { jws } from "https://deno.land/std@$STD_VERSION/jose/mod.ts";
const key = await crypto.subtle.importKey(
  "raw",
  encoder.encode("secret"),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);
const data = await jws.encodeJsonFlattenedSerialization(
  {
    header: { kid: "e9bc097a-ce51-4036-9562-d2ade882db0d" },
    payload:
      "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
    protected: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    signature: "tKzC0WOlNtBIo8qMXGTTQGUIreFSdOyOQJqN2yZiLSY",
  },
  key,
);
```

### encodeJsonGeneralSerialization

```typescript
import { jws } from "https://deno.land/std@$STD_VERSION/jose/mod.ts";
const key = await crypto.subtle.importKey(
  "raw",
  encoder.encode("secret"),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);
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
  key,
);
```

### decodeJsonGeneralSerialization

```typescript
import { jws } from "https://deno.land/std@$STD_VERSION/jose/mod.ts";
const key = await crypto.subtle.importKey(
  "raw",
  encoder.encode("secret"),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);
const data = await jws.decodeJsonGeneralSerialization(
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
  key,
);
```

## References

- jws: https://datatracker.ietf.org/doc/html/rfc7515
- jwt: https://datatracker.ietf.org/doc/html/rfc7519
