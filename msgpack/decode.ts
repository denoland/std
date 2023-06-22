export function decode(uint8: Uint8Array) {
  const { value, consumed } = decodeSlice(uint8);

  if (consumed < uint8.length) {
    throw new EvalError("Messagepack decode did not consume whole array");
  }

  return value;
}

function decodeString(uint8: Uint8Array, size: number) {
  return decoder.decode(uint8.subarray(0, size));
}

function decodeArray(uint8: Uint8Array, size: number) {
  let total = 0;
  const arr: unknown[] = [];

  for (let i = 0; i < size; i++) {
    const { value, consumed } = decodeSlice(uint8);
    arr.push(value);
    uint8 = uint8.subarray(consumed);
    total += consumed;
  }

  return { value: arr, consumed: total };
}

function decodeMap(uint8: Uint8Array, size: number) {
  let total = 0;
  const map: Record<number | string, unknown> = {};

  for (let i = 0; i < size; i++) {
    const { value: key, consumed: keyConsumed } = decodeSlice(uint8);
    uint8 = uint8.subarray(keyConsumed);
    total += keyConsumed;
    const { value, consumed: valueConsumed } = decodeSlice(uint8);
    uint8 = uint8.subarray(valueConsumed);
    total += valueConsumed;

    if (typeof key !== "number" && typeof key !== "string") {
      throw new EvalError(
        "Messagepack decode came across an invalid type for a key of a map",
      );
    }

    map[key] = value;
  }

  return { value: map, consumed: total };
}

const decoder = new TextDecoder();

/**
 * Given a uint8array which contains a msgpack object,
 * return the value of the object as well as how many bytes
 * were consumed in obtaining this object
 */
function decodeSlice(uint8: Uint8Array): { value: unknown; consumed: number } {
  const dataView = new DataView(uint8.buffer);
  const type = uint8[0];

  if (type <= 0x7f) { // positive fixint
    return { value: type, consumed: 1 };
  }

  if (((type >> 4) ^ 0b1000) === 0) { // fixmap
    const size = type & 0xF;
    const { value, consumed } = decodeMap(uint8.subarray(1), size);
    return { value, consumed: 1 + consumed };
  }

  if (((type >> 4) ^ 0b1001) === 0) { // fixarray
    const size = type & 0xF;
    const { value, consumed } = decodeArray(uint8.subarray(1), size);
    return { value, consumed: 1 + consumed };
  }

  if (((type >> 5) ^ 0b101) === 0) { // fixstr
    const size = type & 0b0001111;
    return { value: decodeString(uint8.subarray(1), size), consumed: 1 + size };
  }

  if (type >= 0xe0) { // negative fixint
    return {
      value: dataView.getInt8(0),
      consumed: 1,
    };
  }

  switch (type) {
    case 0xc0: // nil
      return { value: null, consumed: 1 };
    case 0xc1: // (never used)
      throw new Error("Messagepack decode encounted a type that is never used");
    case 0xc2: // false
      return { value: false, consumed: 1 };
    case 0xc3: // true
      return { value: true, consumed: 1 };
    case 0xc4: { // bin 8
      const length = dataView.getUint8(1);
      return { value: uint8.subarray(2, 2 + length), consumed: 2 + length };
    }
    case 0xc5: { // bin 16
      const length = dataView.getUint16(1);
      return { value: uint8.subarray(3, 3 + length), consumed: 3 + length };
    }
    case 0xc6: { // bin 32
      const length = dataView.getUint32(1);
      return { value: uint8.subarray(5, 5 + length), consumed: 5 + length };
    }
    case 0xc7: // ext 8
    case 0xc8: // ext 16
    case 0xc9: // ext 32
      throw new Error("ext not implemented yet");
    case 0xca: // float 32
      return { value: dataView.getFloat32(1), consumed: 5 };
    case 0xcb: // float 64
      return { value: dataView.getFloat64(1), consumed: 9 };
    case 0xcc: // uint 8
      return { value: dataView.getUint8(1), consumed: 2 };
    case 0xcd: // uint 16
      return { value: dataView.getUint16(1), consumed: 3 };
    case 0xce: // uint 32
      return { value: dataView.getUint32(1), consumed: 5 };
    case 0xcf: // uint 64
      return { value: dataView.getBigUint64(1), consumed: 9 };
    case 0xd0: // int 8
      return { value: dataView.getInt8(1), consumed: 2 };
    case 0xd1: // int 16
      return { value: dataView.getInt16(1), consumed: 3 };
    case 0xd2: // int 32
      return { value: dataView.getInt32(1), consumed: 5 };
    case 0xd3: // int 64
      return { value: dataView.getBigInt64(1), consumed: 9 };
    case 0xd4: // fixext 1
    case 0xd5: // fixext 2
    case 0xd6: // fixext 4
    case 0xd7: // fixext 8
    case 0xd8: // fixext 16
      throw new Error("fixext not implemented yet");
    case 0xd9: { // str 8
      const length = dataView.getUint8(1);
      return {
        value: decodeString(uint8.subarray(2), length),
        consumed: 2 + length,
      };
    }
    case 0xda: { // str 16
      const length = dataView.getUint16(1);
      return {
        value: decodeString(uint8.subarray(3), length),
        consumed: 3 + length,
      };
    }
    case 0xdb: { // str 32
      const length = dataView.getUint32(1);
      return {
        value: decodeString(uint8.subarray(5), length),
        consumed: 5 + length,
      };
    }
    case 0xdc: { // array 16
      const length = dataView.getUint16(1);
      const { value, consumed } = decodeArray(uint8.subarray(3), length);
      return { value, consumed: 3 + consumed };
    }
    case 0xdd: { // array 32
      const length = dataView.getUint32(1);
      const { value, consumed } = decodeArray(uint8.subarray(5), length);
      return { value, consumed: 5 + consumed };
    }
    case 0xde: { // map 16
      const length = dataView.getUint16(1);
      const { value, consumed } = decodeMap(uint8.subarray(3), length);
      return { value, consumed: 3 + consumed };
    }
    case 0xdf: { // map 32
      const length = dataView.getUint32(1);
      const { value, consumed } = decodeMap(uint8.subarray(5), length);
      return { value, consumed: 5 + consumed };
    }
  }

  // All cases are covered for numbers between 0-255. Typescript isn't smart enough to know that.
  throw new Error("Unreachable");
}
