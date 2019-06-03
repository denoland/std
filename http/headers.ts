// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

// From node-fetch
// Copyright (c) 2016 David Frank. MIT License.
const invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;

const entries = Symbol("entries");

// ref: https://fetch.spec.whatwg.org/#dom-headers
export class HttpHeaders {
  private [entries]: Array<[string, string]>;

  private _normalizeParams(name: string, value: string): string[] {
    return [this._normalizeName(name), this._normalizeValue(value)];
  }

  private _normalizeName(name: string): string {
    return String(name).toLowerCase();
  }

  private _normalizeValue(value: string): string {
    return String(value).trim();
  }

  // The following name/value validations are copied from
  // https://github.com/bitinn/node-fetch/blob/master/src/headers.js
  // Copyright (c) 2016 David Frank. MIT License.
  private _validateName(name: string): void {
    if (invalidTokenRegex.test(name) || name === "") {
      throw new TypeError(`${name} is not a legal HTTP header name`);
    }
  }

  private _validateValue(value: string): void {
    if (invalidHeaderCharRegex.test(value)) {
      throw new TypeError(`${value} is not a legal HTTP header value`);
    }
  }

  constructor(init?: Array<[string, string]>) {
    this[entries] = [];
    if (init === null) {
      throw new TypeError(
        "Failed to construct 'Headers'; The provided value was not valid"
      )
    }
    if (init) {
      for (const [name, value] of init) {
        const [newname, newvalue] = this._normalizeParams(name, value);
        this._validateName(newname);
        this._validateValue(newvalue);
        this[entries].push([newname, newvalue])
      }
    }
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this[entries][Symbol.iterator]();
  }

  // ref: https://fetch.spec.whatwg.org/#concept-headers-append
  append(name: string, value: string): void {
    const [newname, newvalue] = this._normalizeParams(name, value);
    this._validateName(newname);
    this._validateValue(newvalue);

    switch (newname) {
      // Header values that can't be appended to - list is taken from:
      // https://mxr.mozilla.org/mozilla/source/netwerk/protocol/http/src/nsHttpHeaderArray.cpp
      case 'content-type':
      case 'content-length':
      case 'user-agent':
      case 'referer':
      case 'host':
      case 'authorization':
      case 'proxy-authorization':
      case 'if-modified-since':
      case 'if-unmodified-since':
      case 'from':
      case 'location':
      case 'max-forwards':
      case 'retry-after':
      case 'etag':
      case 'last-modified':
      case 'server':
      case 'age':
      case 'expires':
        this.set(newname, newvalue);
        break
  
      default:
        // Append values for all legal keys
        this[entries].push([newname, newvalue]);
    }
  }

  getAll() {
    return this[entries];
  }

  get(name: string): string | null {
    const newname = this._normalizeName(name);
    this._validateName(newname);
    const matches = this[entries].filter(h => h[0] == newname);
    if (!matches.length) return null;
    const values = matches.map(m => m[1]);
    
    // "set-cookie" is the only header type that needs special concatenation
    // https://tools.ietf.org/html/rfc6265
    const isCookie = ('set-cookie' === newname || 'cookie' === newname);
    return isCookie ? values.join('; ') : values.join(', ');
  }

  has(name: string): boolean {
    const newname = this._normalizeName(name);
    this._validateName(newname);
    const result = this[entries].find(header => header[0] == newname);
    return Boolean(result);
  }

  set(name: string, value: string): void {
    const [newname, newvalue] = this._normalizeParams(name, value);
    this._validateName(newname);
    this._validateValue(newvalue);
    this.delete(newname);
    this[entries].push([newname, newvalue]);
  }

  delete(name: string): void {
    const newname = this._normalizeName(name);
    this._validateName(newname);
    this[entries] = this[entries].filter(h => h[0] !== newname);
  }

  get [Symbol.toStringTag](): string {
    return "HttpHeaders";
  }
}
