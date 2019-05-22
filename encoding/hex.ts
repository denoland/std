// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

const hextable = new TextEncoder().encode("0123456789abcdef");
const bufferSize = 1024;

function invalidByteError(byte: number): Error {
  return new Error(
    "encoding/hex: invalid byte: " +
      new TextDecoder().decode(new Uint8Array([byte]))
  );
}

// fromHexChar converts a hex character into its value and a success flag.
function fromHexChar(byte: number): [number, boolean] {
  switch (true) {
    case 48 <= byte && byte <= 57: // '0' <= byte && byte <= '9'
      return [byte - 48, true];
    case 97 <= byte && byte <= 102: // 'a' <= byte && byte <= 'f'
      return [byte - 97 + 10, true];
    case 65 <= byte && byte <= 70: // 'A' <= byte && byte <= 'F'
      return [byte - 65 + 10, true];
  }
  return [0, false];
}

export function encode(dest: Uint8Array, src: Uint8Array): number {
  if (dest.length !== encodedLen(src.length)) {
    // throw new Error("Out of index.");
  }
  for (let i = 0; i < src.length; i++) {
    const v = src[i];
    dest[i * 2] = hextable[v >> 4];
    dest[i * 2 + 1] = hextable[v & 0x0f];
  }
  return encodedLen(src.length);
}

export function encodedLen(n: number): number {
  return n * 2;
}

export function encodeToString(buf: Uint8Array): string {
  return Array.from(buf)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Decode decodes src into DecodedLen(len(src)) bytes,
// returning the actual number of bytes written to dst.
//
// Decode expects that src contains only hexadecimal
// characters and that src has even length.
// If the input is malformed, Decode returns the number
// of bytes decoded before the error.
export function decode(dest: Uint8Array, src: Uint8Array): [number, Error] {
  var i = 0;
  for (; i < src.length / 2; i++) {
    const [a, aOK] = fromHexChar(src[i * 2]);
    if (!aOK) {
      return [i, invalidByteError(src[i * 2])];
    }

    const [b, bOK] = fromHexChar(src[i * 2 + 1]);
    if (!bOK) {
      return [i, invalidByteError(src[i * 2 + 1])];
    }

    dest[i] = (a << 4) | b;
  }

  if (src.length % 2 == 1) {
    // Check for invalid char before reporting bad length,
    // since the invalid char (if present) is an earlier problem.
    const [, ok] = fromHexChar(src[i * 2]);
    if (!ok) {
      return [i, invalidByteError(src[i * 2])];
    }
  }

  return [i, undefined];
}

// DecodedLen returns the length of a decoding of x source bytes.
// Specifically, it returns x / 2.
export function decodedLen(x: number): number {
  return x / 2;
}

// DecodeString returns the bytes represented by the hexadecimal string s.
//
// DecodeString expects that src contains only hexadecimal
// characters and that src has even length.
// If the input is malformed, DecodeString returns
// the bytes decoded before the error.
export function decodeString(s: string): Uint8Array {
  const src = new TextEncoder().encode(s);
  // We can use the source slice itself as the destination
  // because the decode loop increments by one and then the 'seen' byte is not used anymore.
  const [n, err] = decode(src, src);

  if (err) {
    throw err;
  }

  return src.slice(0, n);
}

// TODO: encoder
export class Encoder implements Deno.Writer {
  private err: Error;
  private out = new Uint8Array(bufferSize);
  constructor() {}
  async write(p: Uint8Array): Promise<number> {
    let n = 0;

    for (; p.length > 0 && !this.err; ) {
      let chunkSize = bufferSize / 2;
      if (p.length < chunkSize) {
        chunkSize = p.length;
      }

      const encoded = encode(this.out.slice(), p.slice(chunkSize));
      const written = this.out.slice(0, encoded).length;

      n += written / 2;
      p = p.slice(chunkSize);
    }

    return n;
  }
  toString(): string {
    return "";
  }
}
