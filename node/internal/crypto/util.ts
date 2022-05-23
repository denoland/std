// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { digestAlgorithms } from "../../../_wasm_crypto/mod.ts";
import { getCiphers } from "../../_crypto/crypto_browserify/browserify_aes/mod.js";
import { notImplemented } from "../../_utils.ts";
import { Buffer } from "../../buffer.ts";

let defaultEncoding = "buffer";

export const kHandle = Symbol("kHandle");
export const kKeyObject = Symbol("kKeyObject");

export function setDefaultEncoding(val: string) {
  defaultEncoding = val;
}

export function getDefaultEncoding() {
  return defaultEncoding;
}

// This is here because many functions accepted binary strings without
// any explicit encoding in older versions of node, and we don't want
// to break them unnecessarily.
export function toBuf(val: string | Buffer, encoding: string) {
  if (typeof val === "string") {
    if (encoding === "buffer") {
      encoding = "utf8";
    }

    return Buffer.from(val, encoding);
  }

  return val;
}

/**
 * Returns an array of the names of the supported hash algorithms, such as 'sha1'.
 */
export function getHashes(): readonly string[] {
  return digestAlgorithms;
}

export function getCurves(): readonly string[] {
  notImplemented("crypto.getCurves");
}

// deno-lint-ignore no-explicit-any
export function secureHeapUsed(): any {
  notImplemented("crypto.secureHeapUsed");
}

// deno-lint-ignore no-explicit-any
export function setEngine(_engine: string, _flags: any) {
  notImplemented("crypto.setEngine");
}

export { getCiphers };

export default {
  getDefaultEncoding,
  getHashes,
  setDefaultEncoding,
  getCiphers,
  getCurves,
  secureHeapUsed,
  setEngine,
};
