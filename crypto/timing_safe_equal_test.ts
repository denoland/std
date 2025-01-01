// Copyright 2018-2025 the Deno authors. MIT license.

import { assert } from "@std/assert";
import { timingSafeEqual } from "./timing_safe_equal.ts";

Deno.test({
  name: "timingSafeEqual() compares equal ArrayBuffer",
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
  name: "timingSafeEqual() compares unequal ArrayBuffer",
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
  name: "timingSafeEqual() compares equal Uint8Array",
  fn() {
    const a = new Uint8Array([212, 213]);
    const b = new Uint8Array([212, 213]);
    assert(timingSafeEqual(a, b));
  },
});

Deno.test({
  name: "timingSafeEqual() compares unequal Uint8Array",
  fn() {
    const a = new Uint8Array([212, 213]);
    const b = new Uint8Array([212, 212]);
    assert(!timingSafeEqual(a, b));
  },
});

Deno.test({
  name: "timingSafeEqual() compares equal encoded Uint8Array",
  fn() {
    const encoder = new TextEncoder();
    const a = encoder.encode("hello deno");
    const b = encoder.encode("hello deno");
    assert(timingSafeEqual(a, b));
  },
});

Deno.test({
  name: "timingSafeEqual() compares unequal encoded Uint8Array",
  fn() {
    const encoder = new TextEncoder();
    const a = encoder.encode("hello deno");
    const b = encoder.encode("hello Deno");
    assert(!timingSafeEqual(a, b));
  },
});

Deno.test({
  name:
    "timingSafeEqual() handles Uint8Array with different byte lengths (a > b)",
  fn() {
    const a = new Uint8Array([212, 213]);
    const b = new Uint8Array([212]);
    assert(!timingSafeEqual(a, b));
  },
});

Deno.test({
  name:
    "timingSafeEqual() handles Uint8Array with different byte lengths (a < b)",
  fn() {
    const a = new Uint8Array([212]);
    const b = new Uint8Array([212, 213]);
    assert(!timingSafeEqual(a, b));
  },
});

Deno.test({
  name:
    "timingSafeEqual() handles Uint8Array with different buffer sizes (a > b)",
  fn() {
    const a = new SharedArrayBuffer(4);
    const va = new DataView(a);
    va.setUint8(0, 212);
    va.setUint8(1, 213);
    const ua = new Uint8Array(a, 0, 2);

    const b = new SharedArrayBuffer(2);
    const vb = new DataView(b);
    vb.setUint8(0, 212);
    vb.setUint8(1, 213);
    const ub = new Uint8Array(b, 0, 2);

    assert(timingSafeEqual(ua, ub));

    vb.setUint8(0, 214);
    vb.setUint8(1, 215);

    assert(!timingSafeEqual(ua, ub));
  },
});

Deno.test({
  name:
    "timingSafeEqual() handles Uint8Array with different buffer sizes (b > a)",
  fn() {
    const a = new SharedArrayBuffer(2);
    const va = new DataView(a);
    va.setUint8(0, 212);
    va.setUint8(1, 213);
    const ua = new Uint8Array(a, 0, 2);

    const b = new SharedArrayBuffer(4);
    const vb = new DataView(b);
    vb.setUint8(0, 212);
    vb.setUint8(1, 213);
    const ub = new Uint8Array(b, 0, 2);

    assert(timingSafeEqual(ua, ub));

    vb.setUint8(0, 214);
    vb.setUint8(1, 215);

    assert(!timingSafeEqual(ua, ub));
  },
});

Deno.test({
  name: "timingSafeEqual() handles Uint8Array with non-0 byteOffset",
  fn() {
    const a = new SharedArrayBuffer(4);
    const va = new DataView(a);
    va.setUint8(1, 212);
    va.setUint8(2, 213);
    const ua = new Uint8Array(a, 1, 2);

    const b = new SharedArrayBuffer(4);
    const vb = new DataView(b);
    vb.setUint8(2, 212);
    vb.setUint8(3, 213);
    const ub = new Uint8Array(b, 2, 2);

    assert(timingSafeEqual(ua, ub));

    vb.setUint8(1, 214);
    vb.setUint8(2, 215);

    assert(!timingSafeEqual(ua, ub));
  },
});

Deno.test({
  name: "timingSafeEqual() compares equal DataViews",
  fn() {
    const a = new ArrayBuffer(2);
    const va = new DataView(a);
    va.setUint8(0, 212);
    va.setUint8(1, 213);
    const b = new ArrayBuffer(2);
    const vb = new DataView(b);
    vb.setUint8(0, 212);
    vb.setUint8(1, 213);
    assert(timingSafeEqual(va, vb));
  },
});

Deno.test({
  name: "timingSafeEqual() compares unequal DataViews",
  fn() {
    const a = new ArrayBuffer(2);
    const va = new DataView(a);
    va.setUint8(0, 212);
    va.setUint8(1, 213);
    const b = new ArrayBuffer(2);
    const vb = new DataView(b);
    vb.setUint8(0, 212);
    vb.setUint8(1, 212);
    assert(!timingSafeEqual(va, vb));
  },
});
