// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { notImplemented } from "./_utils.ts";
import { zlib as constants } from "./internal_binding/constants.ts";
import {
  codes,
  createDeflate,
  createDeflateRaw,
  createGunzip,
  createGzip,
  createInflate,
  createInflateRaw,
  createUnzip,
  Deflate,
  deflate,
  DeflateRaw,
  deflateRaw,
  deflateRawSync,
  deflateSync,
  Gunzip,
  gunzip,
  gunzipSync,
  Gzip,
  gzip,
  gzipSync,
  Inflate,
  inflate,
  InflateRaw,
  inflateRaw,
  inflateRawSync,
  inflateSync,
  Unzip,
  unzip,
  unzipSync,
} from "./_zlib.mjs";
export class Options {
  constructor() {
    notImplemented();
  }
}
export class BrotliOptions {
  constructor() {
    notImplemented();
  }
}
export class BrotliCompress {
  constructor() {
    notImplemented();
  }
}
export class BrotliDecompress {
  constructor() {
    notImplemented();
  }
}
export class ZlibBase {
  constructor() {
    notImplemented();
  }
}
export { constants };
export function createBrotliCompress() {
  notImplemented();
}
export function createBrotliDecompress() {
  notImplemented();
}
export function brotliCompress() {
  notImplemented();
}
export function brotliCompressSync() {
  notImplemented();
}
export function brotliDecompress() {
  notImplemented();
}
export function brotliDecompressSync() {
  notImplemented();
}

export default {
  Options,
  BrotliOptions,
  BrotliCompress,
  BrotliDecompress,
  Deflate,
  DeflateRaw,
  Gunzip,
  Gzip,
  Inflate,
  InflateRaw,
  Unzip,
  ZlibBase,
  constants,
  codes,
  createBrotliCompress,
  createBrotliDecompress,
  createDeflate,
  createDeflateRaw,
  createGunzip,
  createGzip,
  createInflate,
  createInflateRaw,
  createUnzip,
  brotliCompress,
  brotliCompressSync,
  brotliDecompress,
  brotliDecompressSync,
  deflate,
  deflateSync,
  deflateRaw,
  deflateRawSync,
  gunzip,
  gunzipSync,
  gzip,
  gzipSync,
  inflate,
  inflateSync,
  inflateRaw,
  inflateRawSync,
  unzip,
  unzipSync,
};
