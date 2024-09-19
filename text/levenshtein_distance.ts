// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
const { ceil } = Math;

// This implements Myers' bit-vector algorithm as described here:
// https://dl.acm.org/doi/pdf/10.1145/316542.316550
const peq = new Uint32Array(0x110000);

function myers32(t: string, p: string): number {
  const n = unicodeStrLen(t);
  const m = unicodeStrLen(p);
  for (let i = 0; i < m;) {
    const cp = p.codePointAt(i)!;
    peq[cp]! |= 1 << i;
    i += cp > 0xffff ? 2 : 1;
  }
  const last = m - 1;
  let pv = -1;
  let mv = 0;
  let score = m;
  for (let j = 0; j < n;) {
    const cp = t.codePointAt(j)!;
    const eq = peq[cp]!;
    const xv = eq | mv;
    const xh = (((eq & pv) + pv) ^ pv) | eq;
    let ph = mv | ~(xh | pv);
    let mh = pv & xh;
    score += ((ph >>> last) & 1) - ((mh >>> last) & 1);
    // Set the horizontal delta in the first row to +1
    // because we are computing the distance between two full strings.
    ph = (ph << 1) | 1;
    mh = mh << 1;
    pv = mh | ~(xv | ph);
    mv = ph & xv;

    j += cp > 0xffff ? 2 : 1;
  }
  for (let i = 0; i < m;) {
    const cp = p.codePointAt(i)!;
    peq[cp] = 0;
    i += cp > 0xffff ? 2 : 1;
  }
  return score;
}

function myersX(t: string, p: string): number {
  const n = unicodeStrLen(t);
  const m = unicodeStrLen(p);
  // Initialize the horizontal deltas to +1.
  const h = new Int8Array(n).fill(1);
  const bmax = ceil(m / 32) - 1;
  // Process the blocks row by row so that we can use the fixed-size peq array.
  for (let b = 0; b < bmax; b++) {
    const start = b * 32;
    const end = (b + 1) * 32;
    for (let i = start; i < end;) {
      const cp = p.codePointAt(i)!;
      peq[cp]! |= 1 << i;
      i += cp > 0xffff ? 2 : 1;
    }
    let pv = -1;
    let mv = 0;
    for (let j = 0; j < n;) {
      const hin = h[j]!;
      const cp = t.codePointAt(j)!;
      let eq = peq[cp]!;
      const xv = eq | mv;
      eq |= hin >>> 31;
      const xh = (((eq & pv) + pv) ^ pv) | eq;
      let ph = mv | ~(xh | pv);
      let mh = pv & xh;
      h[j] = (ph >>> 31) - (mh >>> 31);
      ph = (ph << 1) | (-hin >>> 31);
      mh = (mh << 1) | (hin >>> 31);
      pv = mh | ~(xv | ph);
      mv = ph & xv;

      j += cp > 0xffff ? 2 : 1;
    }
    for (let i = start; i < end;) {
      const cp = p.codePointAt(i)!;
      peq[cp] = 0;

      i += cp > 0xffff ? 2 : 1;
    }
  }
  const start = bmax * 32;
  for (let i = start; i < m;) {
    const cp = p.codePointAt(i)!;
    peq[cp]! |= 1 << i;
    i += cp > 0xffff ? 2 : 1;
  }
  const last = m - 1;
  let pv = -1;
  let mv = 0;
  let score = m;
  for (let j = 0; j < n;) {
    const hin = h[j]!;
    const cp = t.codePointAt(j)!;
    let eq = peq[cp]!;
    const xv = eq | mv;
    eq |= hin >>> 31;
    const xh = (((eq & pv) + pv) ^ pv) | eq;
    let ph = mv | ~(xh | pv);
    let mh = pv & xh;
    score += ((ph >>> last) & 1) - ((mh >>> last) & 1);
    ph = (ph << 1) | (-hin >>> 31);
    mh = (mh << 1) | (hin >>> 31);
    pv = mh | ~(xv | ph);
    mv = ph & xv;

    j += cp > 0xffff ? 2 : 1;
  }
  for (let i = start; i < m;) {
    const cp = p.codePointAt(i)!;
    peq[cp] = 0;
    i += cp > 0xffff ? 2 : 1;
  }
  return score;
}

/**
 * Calculates the
 * {@link https://en.wikipedia.org/wiki/Levenshtein_distance | Levenshtein distance}
 * between two strings.
 *
 * > [!NOTE]
 * > The complexity of this function is O(m * n), where m and n are the lengths
 * > of the two strings. It's recommended to limit the length and validate input
 * > if arbitrarily accepting input.
 *
 * @example Usage
 * ```ts
 * import { levenshteinDistance } from "@std/text/levenshtein-distance";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(levenshteinDistance("aa", "bb"), 2);
 * ```
 * @param str1 The first string.
 * @param str2 The second string.
 * @returns The Levenshtein distance between the two strings.
 */
export function levenshteinDistance(str1: string, str2: string): number {
  let strLen1 = unicodeStrLen(str1);
  let strLen2 = unicodeStrLen(str2);

  if (strLen1 < strLen2) {
    [str1, str2] = [str2, str1];
    [strLen1, strLen2] = [strLen2, strLen1];
  }
  if (str2 === "") {
    return strLen1;
  }
  return strLen2 <= 32 ? myers32(str1, str2) : myersX(str1, str2);
}

function unicodeStrLen(str: string) {
  return str.replaceAll(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ".").length;
}
