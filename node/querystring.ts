// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

export interface ParsedUrlQuery {
  [key: string]: string | string[] | undefined;
}

interface ParseOptions {
  /** The function to use when decoding percent-encoded characters in the query string. */
  decodeURIComponent?: (string: string) => string;
  /** Specifies the maximum number of keys to parse. */
  maxKeys?: number;
}

export const hexTable = new Array(256);
for (let i = 0; i < 256; ++i) {
  hexTable[i] = "%" + ((i < 16 ? "0" : "") + i.toString(16)).toUpperCase();
}

function charCodes(str: string): number[] {
  const ret = new Array(str.length);
  for (let i = 0; i < str.length; ++i) {
    ret[i] = str.charCodeAt(i);
  }
  return ret;
}

function addKeyVal(
  obj: ParsedUrlQuery,
  key: string,
  value: string,
  keyEncoded: boolean,
  valEncoded: boolean,
  decode: (encodedURIComponent: string) => string,
): void {
  if (key.length > 0 && keyEncoded) {
    key = decode(key);
  }
  if (value.length > 0 && valEncoded) {
    value = decode(value);
  }

  if (obj[key] === undefined) {
    obj[key] = value;
  } else {
    const curValue = obj[key];
    // A simple Array-specific property check is enough here to
    // distinguish from a string value and is faster and still safe
    // since we are generating all of the values being assigned.
    if ((curValue as string[]).pop) {
      (curValue as string[])[curValue!.length] = value;
    } else {
      obj[key] = [curValue as string, value];
    }
  }
}

// deno-fmt-ignore
const isHexTable = new Int8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0 - 15
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 16 - 31
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 32 - 47
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, // 48 - 63
  0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 64 - 79
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 80 - 95
  0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 96 - 111
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 112 - 127
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 128 ...
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // ... 256
]);

/**
 * Parses a URL query string into a collection of key and value pairs.
 * @param str The URL query string to parse
 * @param sep The substring used to delimit key and value pairs in the query string. Default: '&'.
 * @param eq The substring used to delimit keys and values in the query string. Default: '='.
 * @param options The parse options
 */
export function parse(
  str: string,
  sep = "&",
  eq = "=",
  { decodeURIComponent = unescape, maxKeys = 1000 }: ParseOptions = {},
): ParsedUrlQuery {
<<<<<<< HEAD
  const entries =
    str?.split(sep).map((entry) => entry.split(eq).map(decodeURIComponent)) ??
      [];
  const final: ParsedUrlQuery = {};

  let i = 0;
  while (true) {
    if ((Object.keys(final).length === maxKeys && !!maxKeys) || !entries[i]) {
      break;
    }
=======
  const obj: ParsedUrlQuery = Object.create(null);

  if (typeof str !== "string" || str.length === 0) {
    return obj;
  }
>>>>>>> main

  const sepCodes = (!sep ? [38] /* & */ : charCodes(String(sep)));
  const eqCodes = (!eq ? [61] /* = */ : charCodes(String(eq)));
  const sepLen = sepCodes.length;
  const eqLen = eqCodes.length;

  let pairs = 2000;
  if (maxKeys) {
    // -1 is used in place of a value like Infinity for meaning
    // "unlimited pairs" because of additional checks V8 (at least as of v5.4)
    // has to do when using variables that contain values like Infinity. Since
    // `pairs` is always decremented and checked explicitly for 0, -1 works
    // effectively the same as Infinity, while providing a significant
    // performance boost.
    pairs = maxKeys > 0 ? maxKeys : -1;
  }

  let decode = unescape;
  if (decodeURIComponent) {
    decode = decodeURIComponent;
  }
  const customDecode = (decode !== unescape);

  let lastPos = 0;
  let sepIdx = 0;
  let eqIdx = 0;
  let key = "";
  let value = "";
  let keyEncoded = customDecode;
  let valEncoded = customDecode;
  const plusChar = (customDecode ? "%20" : " ");
  let encodeCheck = 0;
  for (let i = 0; i < str.length; ++i) {
    const code = str.charCodeAt(i);

    // Try matching key/value pair separator (e.g. '&')
    if (code === sepCodes[sepIdx]) {
      if (++sepIdx === sepLen) {
        // Key/value pair separator match!
        const end = i - sepIdx + 1;
        if (eqIdx < eqLen) {
          // We didn't find the (entire) key/value separator
          if (lastPos < end) {
            // Treat the substring as part of the key instead of the value
            key += str.slice(lastPos, end);
          } else if (key.length === 0) {
            // We saw an empty substring between separators
            if (--pairs === 0) {
              return obj;
            }
            lastPos = i + 1;
            sepIdx = eqIdx = 0;
            continue;
          }
        } else if (lastPos < end) {
          value += str.slice(lastPos, end);
        }

        addKeyVal(obj, key, value, keyEncoded, valEncoded, decode);

        if (--pairs === 0) {
          return obj;
        }
        key = value = "";
        encodeCheck = 0;
        lastPos = i + 1;
        sepIdx = eqIdx = 0;
      }
    } else {
      sepIdx = 0;
      // Try matching key/value separator (e.g. '=') if we haven't already
      if (eqIdx < eqLen) {
        if (code === eqCodes[eqIdx]) {
          if (++eqIdx === eqLen) {
            // Key/value separator match!
            const end = i - eqIdx + 1;
            if (lastPos < end) {
              key += str.slice(lastPos, end);
            }
            encodeCheck = 0;
            lastPos = i + 1;
          }
          continue;
        } else {
          eqIdx = 0;
          if (!keyEncoded) {
            // Try to match an (valid) encoded byte once to minimize unnecessary
            // calls to string decoding functions
            if (code === 37 /* % */) {
              encodeCheck = 1;
              continue;
            } else if (encodeCheck > 0) {
              if (isHexTable[code] === 1) {
                if (++encodeCheck === 3) {
                  keyEncoded = true;
                }
                continue;
              } else {
                encodeCheck = 0;
              }
            }
          }
        }
        if (code === 43 /* + */) {
          if (lastPos < i) {
            key += str.slice(lastPos, i);
          }
          key += plusChar;
          lastPos = i + 1;
          continue;
        }
      }
      if (code === 43 /* + */) {
        if (lastPos < i) {
          value += str.slice(lastPos, i);
        }
        value += plusChar;
        lastPos = i + 1;
      } else if (!valEncoded) {
        // Try to match an (valid) encoded byte (once) to minimize unnecessary
        // calls to string decoding functions
        if (code === 37 /* % */) {
          encodeCheck = 1;
        } else if (encodeCheck > 0) {
          if (isHexTable[code] === 1) {
            if (++encodeCheck === 3) {
              valEncoded = true;
            }
          } else {
            encodeCheck = 0;
          }
        }
      }
    }
  }

  // Deal with any leftover key or value data
  if (lastPos < str.length) {
    if (eqIdx < eqLen) {
      key += str.slice(lastPos);
    } else if (sepIdx < sepLen) {
      value += str.slice(lastPos);
    }
  } else if (eqIdx === 0 && key.length === 0) {
    // We ended on an empty substring
    return obj;
  }

  addKeyVal(obj, key, value, keyEncoded, valEncoded, decode);

  return obj;
}

interface StringifyOptions {
  /** The function to use when converting URL-unsafe characters to percent-encoding in the query string. */
  encodeURIComponent?: (string: string) => string;
}

export function encodeStr(
  str: string,
  noEscapeTable: number[],
  hexTable: string[],
): string {
  const len = str.length;
  if (len === 0) return "";

  let out = "";
  let lastPos = 0;

  for (let i = 0; i < len; i++) {
    let c = str.charCodeAt(i);
    // ASCII
    if (c < 0x80) {
      if (noEscapeTable[c] === 1) continue;
      if (lastPos < i) out += str.slice(lastPos, i);
      lastPos = i + 1;
      out += hexTable[c];
      continue;
    }

    if (lastPos < i) out += str.slice(lastPos, i);

    // Multi-byte characters ...
    if (c < 0x800) {
      lastPos = i + 1;
      out += hexTable[0xc0 | (c >> 6)] + hexTable[0x80 | (c & 0x3f)];
      continue;
    }
    if (c < 0xd800 || c >= 0xe000) {
      lastPos = i + 1;
      out += hexTable[0xe0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3f)] +
        hexTable[0x80 | (c & 0x3f)];
      continue;
    }
    // Surrogate pair
    ++i;

    // This branch should never happen because all URLSearchParams entries
    // should already be converted to USVString. But, included for
    // completion's sake anyway.
    if (i >= len) throw new Deno.errors.InvalidData("invalid URI");

    const c2 = str.charCodeAt(i) & 0x3ff;

    lastPos = i + 1;
    c = 0x10000 + (((c & 0x3ff) << 10) | c2);
    out += hexTable[0xf0 | (c >> 18)] +
      hexTable[0x80 | ((c >> 12) & 0x3f)] +
      hexTable[0x80 | ((c >> 6) & 0x3f)] +
      hexTable[0x80 | (c & 0x3f)];
  }
  if (lastPos === 0) return str;
  if (lastPos < len) return out + str.slice(lastPos);
  return out;
}

/**
 * Produces a URL query string from a given obj by iterating through the object's "own properties".
 * @param obj The object to serialize into a URL query string.
 * @param sep The substring used to delimit key and value pairs in the query string. Default: '&'.
 * @param eq The substring used to delimit keys and values in the query string. Default: '='.
 * @param options The stringify options
 */
export function stringify(
  // deno-lint-ignore no-explicit-any
  obj: Record<string, any>,
  sep = "&",
  eq = "=",
  { encodeURIComponent = escape }: StringifyOptions = {},
): string {
  const final = [];

  for (const entry of Object.entries(obj)) {
    if (Array.isArray(entry[1])) {
      for (const val of entry[1]) {
        final.push(encodeURIComponent(entry[0]) + eq + encodeURIComponent(val));
      }
    } else if (typeof entry[1] !== "object" && entry[1] !== undefined) {
      final.push(entry.map(encodeURIComponent).join(eq));
    } else {
      final.push(encodeURIComponent(entry[0]) + eq);
    }
  }

  return final.join(sep);
}

/** Alias of querystring.parse() */
export const decode = parse;
/** Alias of querystring.stringify() */
export const encode = stringify;
export const unescape = decodeURIComponent;
export const escape = encodeURIComponent;

export default {
  parse,
  encodeStr,
  stringify,
  hexTable,
  decode,
  encode,
  unescape,
  escape,
};
