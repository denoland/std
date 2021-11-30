// This file contains C++ node globals accesed in internal binding calls

/**
 * Adapted from
 * https://github.com/nodejs/node/blob/3b72788afb7365e10ae1e97c71d1f60ee29f09f2/src/node.h#L728-L738
 */
export enum Encodings {
  ASCII,
  UTF8,
  BASE64,
  UCS2,
  BINARY,
  HEX,
  BUFFER,
  BASE64URL,
  LATIN1 = BINARY,
}
