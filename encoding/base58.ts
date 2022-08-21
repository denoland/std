// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

const mapBase58 = [
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  -1,
  17,
  18,
  19,
  20,
  21,
  -1,
  22,
  23,
  24,
  25,
  26,
  27,
  28,
  29,
  30,
  31,
  32,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  -1,
  44,
  45,
  46,
  47,
  48,
  49,
  50,
  51,
  52,
  53,
  54,
  55,
  56,
  57,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
];

const base58alphabet =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz".split("");

/**
 * Encodes a given Uint8Array, ArrayBuffer or string into draft-mspotny-base58-03 RFC base58 representation:
 * https://tools.ietf.org/id/draft-msporny-base58-01.html#rfc.section.1
 *
 * @param {ArrayBuffer | string} data
 *
 * @returns {string} Encoded value
 */
export function encode(data: ArrayBuffer | string): string {
  const uint8tData = typeof data === "string"
    ? new TextEncoder().encode(data)
    : data instanceof Uint8Array
    ? data
    : new Uint8Array(data);

  let length = 0;
  let zeroes = 0;

  // Counting zeroes
  uint8tData.forEach((byte) => (byte === 0 ? zeroes++ : null));

  const size = Math.round((uint8tData.length * 138) / 100 + 1);
  const b58Encoding: number[] = [];

  uint8tData.forEach((byte) => {
    let i = 0;
    let carry = byte;

    for (
      let reverse_iterator = size - 1;
      (carry > 0 || i < length) && reverse_iterator !== -1;
      reverse_iterator--, i++
    ) {
      carry += (b58Encoding[reverse_iterator] || 0) * 256;
      b58Encoding[reverse_iterator] = Math.round(carry % 58);
      carry = Math.floor(carry / 58);
    }

    length = i;
  });

  const strResult: string[] = [];

  if (zeroes) {
    strResult.fill("1", 0, zeroes);
  }

  b58Encoding.forEach((byteValue) => strResult.push(base58alphabet[byteValue]));

  return strResult.join("");
}

/**
 * Decodes a given b58 string according to draft-mspotny-base58-03 RFC base58 representation:
 * https://tools.ietf.org/id/draft-msporny-base58-01.html#rfc.section.1
 *
 * @param {string} b58
 *
 * @returns {Uint8Array} Decoded value
 */
export function decode(b58: string): Uint8Array {
  const splittedInput = b58.trim().split("");

  let length = 0;
  let zeroes = 0;

  // Counting zeroes
  splittedInput.forEach((byte) => (byte === "1" ? zeroes++ : null));

  const size = Math.round((b58.length * 733) / 1000 + 1);
  const output: number[] = [];

  splittedInput.forEach((char, idx) => {
    let carry = mapBase58[b58.charCodeAt(idx)];

    if (carry === -1) {
      throw new Error(`Invalid base58 char at index ${idx} with value ${char}`);
    }

    let i = 0;

    for (
      let reverse_iterator = size - 1;
      (carry > 0 || i < length) && reverse_iterator !== 0;
      reverse_iterator--, i++
    ) {
      carry += 58 * (output[reverse_iterator - 1] || 0);
      output[reverse_iterator - 1] = Math.round(carry % 256);
      carry = Math.floor(carry / 256);
    }

    length = i;
  });

  return new Uint8Array(output);
}
