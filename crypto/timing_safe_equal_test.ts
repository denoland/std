// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assert } from "../testing/asserts.ts";
import { timingSafeEqual } from "./timing_safe_equal.ts";

Deno.test({
  name: "[timingSafeEqual] - ArrayBuffer comparison - equal",
  fn() {
    const a = new ArrayBuffer(2);
    const va = new DataView(a);
    va.setUint8(0, 212);
    va.setUint8(1, 213);
    const b = new ArrayBuffer(2);
    const vb = new DataView(b);
    vb.setUint8(0, 212);
    vb.setUint8(1, 213);
    assert(timingSafeEqual(a, b));
  },
});

Deno.test({
  name: "[timingSafeEqual] - ArrayBuffer comparison - not equal",
  fn() {
    const a = new ArrayBuffer(2);
    const va = new DataView(a);
    va.setUint8(0, 212);
    va.setUint8(1, 213);
    const b = new ArrayBuffer(2);
    const vb = new DataView(b);
    vb.setUint8(0, 212);
    vb.setUint8(1, 212);
    assert(!timingSafeEqual(a, b));
  },
});

Deno.test({
  name: "[timingSafeEqual] - Uint8Array comparison - equal",
  fn() {
    const a = new Uint8Array([212, 213]);
    const b = new Uint8Array([212, 213]);
    assert(timingSafeEqual(a, b));
  },
});

Deno.test({
  name: "[timingSafeEqual] - Uint8Array comparison - not equal",
  fn() {
    const a = new Uint8Array([212, 213]);
    const b = new Uint8Array([212, 212]);
    assert(!timingSafeEqual(a, b));
  },
});

Deno.test({
  name: "[timingSafeEqual] - Uint8Array comparison - equal",
  fn() {
    const encoder = new TextEncoder();
    const a = encoder.encode("hello deno");
    const b = encoder.encode("hello deno");
    assert(timingSafeEqual(a, b));
  },
});

Deno.test({
  name: "[timingSafeEqual] - Uint8Array comparison - not equal",
  fn() {
    const encoder = new TextEncoder();
    const a = encoder.encode("hello deno");
    const b = encoder.encode("hello Deno");
    assert(!timingSafeEqual(a, b));
  },
});
