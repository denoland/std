/**
 * Adapted from
 * https://github.com/nodejs/node/blob/3b72788afb7365e10ae1e97c71d1f60ee29f09f2/src/node.h#L728-L738
 */
enum encoding {
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

const encodings = [];
encodings[encoding.ASCII] = "ascii";
encodings[encoding.BASE64] = "base64";
encodings[encoding.BASE64URL] = "base64url";
encodings[encoding.BUFFER] = "buffer";
encodings[encoding.HEX] = "hex";
encodings[encoding.LATIN1] = "latin1";
encodings[encoding.UCS2] = "utf16le";
encodings[encoding.UTF8] = "utf8";

console.log(encodings);

export default { encodings };
export { encodings };
