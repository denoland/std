// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

const hexTable: string[] = [];

for (let i = 0; i < 256; ++i) {
  hexTable.push(i < 0x10 ? "0" + i.toString(16) : i.toString(16));
}

/**
 * Converts the byte array to a UUID string
 * @param bytes Used to convert Byte to Hex
 */
export function bytesToUuid(bytes: number[] | Uint8Array): string {
  return (
    hexTable[bytes[0]!]! +
    hexTable[bytes[1]!]! +
    hexTable[bytes[2]!]! +
    hexTable[bytes[3]!]! +
    "-" +
    hexTable[bytes[4]!]! +
    hexTable[bytes[5]!]! +
    "-" +
    hexTable[bytes[6]!]! +
    hexTable[bytes[7]!]! +
    "-" +
    hexTable[bytes[8]!]! +
    hexTable[bytes[9]!]! +
    "-" +
    hexTable[bytes[10]!]! +
    hexTable[bytes[11]!]! +
    hexTable[bytes[12]!]! +
    hexTable[bytes[13]!]! +
    hexTable[bytes[14]!]! +
    hexTable[bytes[15]!]!
    // Use .toLowerCase() to avoid the v8 engine memory issue
    // when concatenating strings with "+" operator. See:
    // - https://issues.chromium.org/issues/42206473
    // - https://github.com/uuidjs/uuid/pull/434
  ).toLowerCase();
}

/**
 * Converts a string to a byte array by converting the hex value to a number.
 * @param uuid Value that gets converted.
 */
export function uuidToBytes(uuid: string): Uint8Array {
  const bytes = new Uint8Array(16);
  let i = 0;

  for (const str of uuid.split("-")) {
    const hex = parseInt(str, 16);
    switch (str.length) {
      case 4: {
        bytes[i++] = (hex >>> 8) & 0xff;
        bytes[i++] = hex & 0xff;
        break;
      }
      case 8: {
        bytes[i++] = (hex >>> 24) & 0xff;
        bytes[i++] = (hex >>> 16) & 0xff;
        bytes[i++] = (hex >>> 8) & 0xff;
        bytes[i++] = hex & 0xff;
        break;
      }
      case 12: {
        bytes[i++] = (hex / 0x10000000000) & 0xff;
        bytes[i++] = (hex / 0x100000000) & 0xff;
        bytes[i++] = (hex >>> 24) & 0xff;
        bytes[i++] = (hex >>> 16) & 0xff;
        bytes[i++] = (hex >>> 8) & 0xff;
        bytes[i++] = hex & 0xff;
        break;
      }
    }
  }

  return bytes;
}
