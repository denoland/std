// Ported from Go
// https://github.com/golang/go/blob/go1.12.5/src/encoding/hex/hex.go
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
// import { copyBytes } from "../io/util.ts";

const hextable = new TextEncoder().encode("0123456789abcdef");
// const bufferSize = 1024;

export function errInvalidByte(byte: number): Error {
  return new Error(
    "encoding/hex: invalid byte: " +
      new TextDecoder().decode(new Uint8Array([byte]))
  );
}

export function errLength(): Error {
  return new Error("encoding/hex: odd length hex string");
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

/**
 * EncodedLen returns the length of an encoding of n source bytes. Specifically, it returns n * 2.
 * @param n
 */
export function encodedLen(n: number): number {
  return n * 2;
}

/**
 * Encode encodes `src` into `encodedLen(src.length)` bytes of `dst`.
 * As a convenience, it returns the number of bytes written to `dst`, but this value is always `encodedLen(src.length)`.
 * Encode implements hexadecimal encoding.
 * @param dst
 * @param src
 */
export function encode(dst: Uint8Array, src: Uint8Array): number {
  if (dst.length !== encodedLen(src.length)) {
    throw new Error("Out of index.");
  }
  for (let i = 0; i < src.length; i++) {
    const v = src[i];
    dst[i * 2] = hextable[v >> 4];
    dst[i * 2 + 1] = hextable[v & 0x0f];
  }
  return encodedLen(src.length);
}

/**
 * EncodeToString returns the hexadecimal encoding of `src`.
 * @param src
 */
export function encodeToString(src: Uint8Array): string {
  const dest = new Uint8Array(encodedLen(src.length));
  encode(dest, src);
  return new TextDecoder().decode(dest);
}

/**
 * Decode decodes `src` into `decodedLen(src.length)` bytes, returning the actual number of bytes written to `dst`.
 * Decode expects that `src` contains only hexadecimal characters and that `src` has even length.
 * If the input is malformed, Decode returns the number of bytes decoded before the error.
 * @param dst
 * @param src
 */
export function decode(dst: Uint8Array, src: Uint8Array): [number, Error] {
  var i = 0;
  for (; i < Math.floor(src.length / 2); i++) {
    const [a, aOK] = fromHexChar(src[i * 2]);
    if (!aOK) {
      return [i, errInvalidByte(src[i * 2])];
    }
    const [b, bOK] = fromHexChar(src[i * 2 + 1]);
    if (!bOK) {
      return [i, errInvalidByte(src[i * 2 + 1])];
    }

    dst[i] = (a << 4) | b;
  }

  if (src.length % 2 == 1) {
    // Check for invalid char before reporting bad length,
    // since the invalid char (if present) is an earlier problem.
    const [, ok] = fromHexChar(src[i * 2]);
    if (!ok) {
      return [i, errInvalidByte(src[i * 2])];
    }
    return [i, errLength()];
  }

  return [i, undefined];
}

/**
 * DecodedLen returns the length of a decoding of `x` source bytes. Specifically, it returns `x / 2`.
 * @param x
 */
export function decodedLen(x: number): number {
  return Math.floor(x / 2);
}

/**
 * DecodeString returns the bytes represented by the hexadecimal string `s`.
 * DecodeString expects that src contains only hexadecimal characters and that src has even length.
 * If the input is malformed, DecodeString will throws an error.
 * @param s the `string` need to decode to `Uint8Array`
 */
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

// TODO: add Encoder/Decoder in the future
// /**
//  * A `deno.Writer` implements that writes lowercase hexadecimal characters to `w`.
//  */
// export class Encoder implements Deno.Writer {
//   private out = new Uint8Array(bufferSize);
//   constructor(private w: Deno.Writer) {}
//   async write(p: Uint8Array): Promise<number> {
//     let n = 0;

//     for (; p.length > 0; ) {
//       let chunkSize = bufferSize / 2;
//       if (p.length < chunkSize) {
//         chunkSize = p.length;
//       }

//       const encoded = encode(this.out.slice(), p.slice(chunkSize));
//       const written = await this.w.write(this.out.slice(0, encoded));

//       n += written / 2;
//       p = p.slice(chunkSize);
//     }

//     return n;
//   }
// }

// /**
//  * A `deno.Reader` implements that decodes hexadecimal characters from `r`.
//  * Decoder expects that `r` contain only an even number of hexadecimal characters.
//  */
// export class Decoder implements Deno.Reader {
//   private in = new Uint8Array(); // input buffer (encoded form)
//   private arr = new Uint8Array(bufferSize); // backing array for in
//   private err: Error;
//   constructor(private r: Deno.Reader) {}
//   async read(p: Uint8Array): Promise<Deno.ReadResult> {
//     // Fill internal buffer with sufficient bytes to decode
//     if (this.in.length < 2 && !this.err) {
//       let numCopy = 0;
//       let numRead = 0;

//       numCopy = copyBytes(this.arr.slice(), this.in);
//       const { nread, eof } = await this.r.read(this.arr.slice(numCopy));
//       numRead = nread;
//       this.in = this.arr.slice(0, numCopy + numRead);

//       if (eof && this.in.length % 2 != 0) {
//         const [, ok] = fromHexChar(this.in[this.in.length - 1]);
//         if (!ok) {
//           this.err = errInvalidByte(this.in[this.in.length - 1]);
//         } else {
//           this.err = new Error("unexpected EOF");
//         }
//       }
//     }

//     // Decode internal buffer into output buffer
//     const numAvail = this.in.length / 2;
//     if (numAvail && p.length > numAvail) {
//       p = p.slice(0, numAvail);
//     }

//     const [numDec, err] = decode(p, this.in.slice(0, p.length * 2));

//     this.in = this.in.slice(2 * numDec);

//     if (err) {
//       // Decode error; discard input remainder
//       throw err;
//     }

//     if (this.in.length < 2) {
//       // Only throw errors when buffer fully consumed
//       if (this.err) {
//         throw err;
//       }
//       return {
//         nread: numDec,
//         eof: true
//       };
//     }

//     return {
//       nread: numDec,
//       eof: false
//     };
//   }
// }
