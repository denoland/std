// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

// From node-fetch
// Copyright (c) 2016 David Frank. MIT License.
const invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;

interface HeadersInit {
  [key:string]: string[];
}

const headerMap = Symbol("header map");

// ref: https://fetch.spec.whatwg.org/#dom-headers
export class HttpHeaders {
  private [headerMap]: Map<string, string[]>;

  private _normalizeParams(name: string, value?: string): string[] {
    name = String(name).toLowerCase();
    value = String(value).trim();
    return [name, value];
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

  constructor(init?: HeadersInit) {
    this[headerMap] = new Map();
    if (init === null) {
      throw new TypeError(
        "Failed to construct 'Headers'; The provided value was not valid"
      )
    }
    if (init) {
      Object.keys(init).forEach(name => {
        const newname = this._normalizeName(name);
        init[name].forEach(value => {
          const newvalue = this._normalizeValue(value);
          this._validateName(newname);
          this._validateValue(newvalue);

          // Initialize map values as empty arrays
          const v = this[headerMap].get(newname) || [];
          v.push(newvalue);
          this[headerMap].set(newname, v);
        })
      })
    }
  }

  [Symbol.iterator](): IterableIterator<[string, string[]]> {
    return this[headerMap].entries();
  }

  // ref: https://fetch.spec.whatwg.org/#concept-headers-append
  append(name: string, value: string): void {
    const [newname, newvalue] = this._normalizeParams(name, value);
    this._validateName(newname);
    this._validateValue(newvalue);
    const v = this[headerMap].get(newname) || [];

    switch (newname) {
      case 'set-cookie':
        if (this[headerMap].has(newname)) {
          this.append(newname, newvalue);
        } else {
          this[headerMap].set(newname, [newvalue]);
        }
        break
  
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
        this[headerMap].set(newname, [newvalue]);
        break
  
      default:
        // Append values for all legal keys
        v.push(newvalue);
        this[headerMap].set(newname, v);
    }
  }

  delete(name: string): void {
    const [newname] = this._normalizeParams(name);
    this._validateName(newname);
    this[headerMap].delete(newname);
  }

  get(name: string): string | null {
    const [newname] = this._normalizeParams(name);
    this._validateName(newname);
    const values = this[headerMap].get(newname);
    if (!values) return null;

    // "set-cookie" is the only header type that needs special concatenation
    // https://tools.ietf.org/html/rfc6265
    return ('set-cookie' === newname) ? values.join('; ') : values.join(', ');
  }

  has(name: string): boolean {
    const [newname] = this._normalizeParams(name);
    this._validateName(newname);
    return this[headerMap].has(newname);
  }

  set(name: string, value: string): void {
    const [newname, newvalue] = this._normalizeParams(name, value);
    this._validateName(newname);
    this._validateValue(newvalue);
    // Overwrite previous values
    this[headerMap].set(newname, [newvalue]);
  }

  get [Symbol.toStringTag](): string {
    return "HttpHeaders";
  }
}
