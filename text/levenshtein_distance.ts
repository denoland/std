// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
const { ceil } = Math;

// This implements Myers' bit-vector algorithm as described here:
// https://dl.acm.org/doi/pdf/10.1145/316542.316550
const peq = new Uint32Array(0x110000);

function myers32(t: string[], p: string[]): number {
  const n = t.length;
  const m = p.length;
  for (let i = 0; i < m; i++) {
    peq[p[i]!.codePointAt(0)!]! |= 1 << i;
  }
  const last = m - 1;
  let pv = -1;
  let mv = 0;
  let score = m;
  for (let j = 0; j < n; j++) {
    const eq = peq[t[j]!.codePointAt(0)!]!;
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
  }
  for (let i = 0; i < m; i++) {
    peq[p[i]!.codePointAt(0)!] = 0;
  }
  return score;
}

function myersX(t: string[], p: string[]): number {
  const n = t.length;
  const m = p.length;
  // Initialize the horizontal deltas to +1.
  const h = new Int8Array(n).fill(1);
  const bmax = ceil(m / 32) - 1;
  // Process the blocks row by row so that we can use the fixed-size peq array.
  for (let b = 0; b < bmax; b++) {
    const start = b * 32;
    const end = (b + 1) * 32;
    for (let i = start; i < end; i++) {
      peq[p[i]!.codePointAt(0)!]! |= 1 << i;
    }
    let pv = -1;
    let mv = 0;
    for (let j = 0; j < n; j++) {
      const hin = h[j]!;
      let eq = peq[t[j]!.codePointAt(0)!]!;
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
    }
    for (let i = start; i < end; i++) {
      peq[p[i]!.codePointAt(0)!] = 0;
    }
  }
  const start = bmax * 32;
  for (let i = start; i < m; i++) {
    peq[p[i]!.codePointAt(0)!]! |= 1 << i;
  }
  const last = m - 1;
  let pv = -1;
  let mv = 0;
  let score = m;
  for (let j = 0; j < n; j++) {
    const hin = h[j]!;
    let eq = peq[t[j]!.codePointAt(0)!]!;
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
  }
  for (let i = start; i < m; i++) {
    peq[p[i]!.codePointAt(0)!] = 0;
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
  let t = [...str1];
  let p = [...str2];

  if (t.length < p.length) {
    [p, t] = [t, p];
  }
  if (p.length === 0) {
    return t.length;
  }
  return p.length <= 32 ? myers32(t, p) : myersX(t, p);
}
