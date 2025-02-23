import {
  decodeBase32 as oldDecode32,
  decodeBase64 as oldDecode64,
  decodeBase64Url as oldDecode64Url,
  decodeHex as oldDecodeHex,
  encodeBase32 as oldEncode32,
  encodeBase64 as oldEncode64,
  encodeBase64Url as oldEncode64Url,
  encodeHex as oldEncodeHex,
} from "jsr:@std/encoding";
import {
  decodeBase32Crockford as oldDecode32Crockford,
  encodeBase32Crockford as oldEncode32Crockford,
} from "jsr:@std/encoding/unstable-base32crockford";
import {
  decodeBase32Hex as oldDecode32Hex,
  encodeBase32Hex as oldEncode32Hex,
} from "jsr:@std/encoding/unstable-base32hex";
import {
  decodeBase32 as newDecode32,
  encodeBase32 as newEncode32,
} from "@std/encode/unstable-base32";
import {
  decodeBase32Crockford as newDecode32Crockford,
  encodeBase32Crockford as newEncode32Crockford,
} from "@std/encode/unstable-base32crockford";
import {
  decodeBase32Hex as newDecode32Hex,
  encodeBase32Hex as newEncode32Hex,
} from "@std/encode/unstable-base32hex";
import {
  decodeBase64 as newDecode64,
  encodeBase64 as newEncode64,
} from "@std/encode/unstable-base64";
import {
  decodeBase64Url as newDecode64Url,
  encodeBase64Url as newEncode64Url,
} from "@std/encode/unstable-base64url";
import {
  decodeHex as newDecodeHex,
  encodeHex as newEncodeHex,
} from "@std/encode/unstable-hex";

const RAW = new Uint8Array(1024).map(() => Math.random() * 256 | 0);
const ENCODED64 = oldEncode64(RAW);
const ENCODED64URL = oldEncode64Url(RAW);
const ENCODED32 = oldEncode32(RAW);
const ENCODED32CROCKFORD = oldEncode32Crockford(RAW);
const ENCODED32HEX = oldEncode32Hex(RAW);
const ENCODED16 = oldEncodeHex(RAW);

// Base64
Deno.bench({ name: "old", group: "encodeBase64" }, () => {
  oldEncode64(RAW);
});

Deno.bench({ name: "new", group: "encodeBase64" }, () => {
  newEncode64(RAW.slice());
});

Deno.bench({ name: "old", group: "decodeBase64" }, () => {
  oldDecode64(ENCODED64);
});

Deno.bench({ name: "new", group: "decodeBase64" }, () => {
  newDecode64(ENCODED64);
});

// Base64Url
Deno.bench({ name: "old", group: "encodeBase64Url" }, () => {
  oldEncode64Url(RAW);
});

Deno.bench({ name: "new", group: "encodeBase64Url" }, () => {
  newEncode64Url(RAW.slice());
});

Deno.bench({ name: "old", group: "decodeBase64Url" }, () => {
  oldDecode64Url(ENCODED64URL);
});

Deno.bench({ name: "new", group: "decodeBase64Url" }, () => {
  newDecode64Url(ENCODED64URL);
});

// Base32
Deno.bench({ name: "old", group: "encodeBase32" }, () => {
  oldEncode32(RAW);
});

Deno.bench({ name: "new", group: "encodeBase32" }, () => {
  newEncode32(RAW.slice());
});

Deno.bench({ name: "old", group: "decodeBase32" }, () => {
  oldDecode32(ENCODED32);
});

Deno.bench({ name: "new", group: "decodeBase32" }, () => {
  newDecode32(ENCODED32.slice());
});

// Base32Crockford
Deno.bench({ name: "old", group: "encodeBase32Crockford" }, () => {
  oldEncode32Crockford(RAW);
});

Deno.bench({ name: "new", group: "encodeBase32Crockford" }, () => {
  newEncode32Crockford(RAW.slice());
});

Deno.bench({ name: "old", group: "decodeBase32Crockford" }, () => {
  oldDecode32Crockford(ENCODED32CROCKFORD);
});

Deno.bench({ name: "new", group: "decodeBase32Crockford" }, () => {
  newDecode32Crockford(ENCODED32CROCKFORD);
});

// Base32Hex
Deno.bench({ name: "old", group: "encodeBase32Hex" }, () => {
  oldEncode32Hex(RAW);
});

Deno.bench({ name: "new", group: "encodeBase32Hex" }, () => {
  newEncode32Hex(RAW.slice());
});

Deno.bench({ name: "old", group: "decodeBase32Hex" }, () => {
  oldDecode32Hex(ENCODED32HEX);
});

Deno.bench({ name: "new", group: "decodeBase32Hex" }, () => {
  newDecode32Hex(ENCODED32HEX);
});

// Hex
Deno.bench({ name: "old", group: "encodeHex" }, () => {
  oldEncodeHex(RAW);
});

Deno.bench({ name: "new", group: "encodeHex" }, () => {
  newEncodeHex(RAW.slice());
});

Deno.bench({ name: "old", group: "decodeHex" }, () => {
  oldDecodeHex(ENCODED16);
});

Deno.bench({ name: "new", group: "decodeHex" }, () => {
  newDecodeHex(ENCODED16);
});
