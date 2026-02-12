// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { random } from "./_common_test.ts";
import { decodeCbor } from "./decode_cbor.ts";
import { encodeCbor } from "./encode_cbor.ts";
import { CborTag } from "./tag.ts";
import type { CborType } from "./types.ts";

Deno.test("decodeCbor() decoding undefined", () => {
  assertEquals(decodeCbor(encodeCbor(undefined)), undefined);
});

Deno.test("decodeCbor() decoding null", () => {
  assertEquals(decodeCbor(encodeCbor(null)), null);
});

Deno.test("decodeCbor() decoding true", () => {
  assertEquals(decodeCbor(encodeCbor(true)), true);
});

Deno.test("decodeCbor() decoding false", () => {
  assertEquals(decodeCbor(encodeCbor(false)), false);
});

Deno.test("decodeCbor() decoding integers", () => {
  let num = random(0, 24);
  assertEquals(decodeCbor(encodeCbor(num)), num);
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), num);

  num = random(24, 2 ** 8);
  assertEquals(decodeCbor(encodeCbor(num)), num);
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), num);

  num = random(2 ** 8, 2 ** 16);
  assertEquals(decodeCbor(encodeCbor(num)), num);
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), num);

  num = random(2 ** 16, 2 ** 32);
  assertEquals(decodeCbor(encodeCbor(num)), num);
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), num);

  num = random(2 ** 32, Number.MAX_SAFE_INTEGER);
  assertEquals(decodeCbor(encodeCbor(num)), BigInt(num));
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), BigInt(num));

  num = -random(0, 24);
  assertEquals(decodeCbor(encodeCbor(num)), num);
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), num);

  num = -random(24, 2 ** 8);
  assertEquals(decodeCbor(encodeCbor(num)), num);
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), num);

  num = -random(2 ** 8, 2 ** 16);
  assertEquals(decodeCbor(encodeCbor(num)), num);
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), num);

  num = -random(2 ** 16, 2 ** 32);
  assertEquals(decodeCbor(encodeCbor(num)), num);
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), num);

  num = -random(2 ** 32, Number.MAX_SAFE_INTEGER);
  assertEquals(decodeCbor(encodeCbor(num)), BigInt(num));
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), BigInt(num));
});

Deno.test("decodeCbor() decoding strings", () => {
  const textDecoder = new TextDecoder();

  let text = textDecoder.decode(
    new Uint8Array(random(0, 24)).map((_) => random(97, 123)),
  ); // Range: `a` - `z`
  assertEquals(decodeCbor(encodeCbor(text)), text);

  text = textDecoder.decode(
    new Uint8Array(random(24, 2 ** 8)).map((_) => random(97, 123)),
  ); // Range: `a` - `z`
  assertEquals(decodeCbor(encodeCbor(text)), text);

  text = textDecoder.decode(
    new Uint8Array(random(2 ** 8, 2 ** 16)).map((_) => random(97, 123)),
  ); // Range: `a` - `z`
  assertEquals(decodeCbor(encodeCbor(text)), text);

  text = textDecoder.decode(
    new Uint8Array(random(2 ** 16, 2 ** 17)).map((_) => random(97, 123)),
  ); // Range: `a` - `z`
  assertEquals(decodeCbor(encodeCbor(text)), text);

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("decodeCbor() decoding Uint8Arrays", () => {
  let bytes = new Uint8Array(random(0, 24)).map((_) => random(0, 256));
  assertEquals(decodeCbor(encodeCbor(bytes)), bytes);

  bytes = new Uint8Array(random(24, 2 ** 8)).map((_) => random(0, 256));
  assertEquals(decodeCbor(encodeCbor(bytes)), bytes);

  bytes = new Uint8Array(random(2 ** 8, 2 ** 16)).map((_) => random(0, 256));
  assertEquals(decodeCbor(encodeCbor(bytes)), bytes);

  bytes = new Uint8Array(random(2 ** 16, 2 ** 17)).map((_) => random(0, 256));
  assertEquals(decodeCbor(encodeCbor(bytes)), bytes);

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("decodeCbor() decoding Dates", () => {
  const date = new Date();
  assertEquals(decodeCbor(encodeCbor(date)), date);
});

Deno.test("decodeCbor() decoding bignums", () => {
  let num = 2n ** 64n;
  assertEquals(decodeCbor(encodeCbor(num)), num);

  num = -(2n ** 64n) - 1n;
  assertEquals(decodeCbor(encodeCbor(num)), num);
});

Deno.test("decodeCbor() decoding Map<CborType, CborType>", () => {
  const map = new Map<CborType, CborType>([[1, 2], ["3", 4], [[5], { a: 6 }]]);
  assertEquals(decodeCbor(encodeCbor(map)), map);
});

Deno.test("decodeCbor() decoding Maps", () => {
  let pairs = random(0, 24);
  let map = new Map(
    new Array(pairs)
      .fill(0)
      .map((_, i) => [i, i]),
  );
  assertEquals(decodeCbor(encodeCbor(map)), map);

  pairs = random(24, 2 ** 8);
  map = new Map(
    new Array(pairs)
      .fill(0)
      .map((_, i) => [i, i]),
  );
  assertEquals(decodeCbor(encodeCbor(map)), map);

  pairs = random(2 ** 8, 2 ** 16);
  map = new Map(
    new Array(pairs)
      .fill(0)
      .map((_, i) => [i, i]),
  );
  assertEquals(decodeCbor(encodeCbor(map)), map);

  pairs = random(2 ** 16, 2 ** 17);
  map = new Map(
    new Array(pairs)
      .fill(0)
      .map((_, i) => [i, i]),
  );
  assertEquals(decodeCbor(encodeCbor(map)), map);

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("decodeCbor() decoding arrays", () => {
  let array = new Array(random(0, 24)).fill(0).map((_) => random(0, 2 ** 32));
  assertEquals(decodeCbor(encodeCbor(array)), array);

  array = new Array(random(24, 2 ** 8)).fill(0).map((_) => random(0, 2 ** 32));
  assertEquals(decodeCbor(encodeCbor(array)), array);

  array = new Array(random(2 ** 8, 2 ** 16)).fill(0).map((_) =>
    random(0, 2 ** 32)
  );
  assertEquals(decodeCbor(encodeCbor(array)), array);

  array = new Array(random(2 ** 16, 2 ** 17)).fill(0).map((_) =>
    random(0, 2 ** 32)
  );
  assertEquals(decodeCbor(encodeCbor(array)), array);

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("decodeCbor() decoding objects", () => {
  let pairs = random(0, 24);
  let object = Object.fromEntries(
    new Array(pairs).fill(0).map((_, i) => [i, i]),
  );
  assertEquals(decodeCbor(encodeCbor(object)), object);

  pairs = random(24, 2 ** 8);
  object = Object.fromEntries(new Array(pairs).fill(0).map((_, i) => [i, i]));
  assertEquals(decodeCbor(encodeCbor(object)), object);

  pairs = random(2 ** 8, 2 ** 16);
  object = Object.fromEntries(new Array(pairs).fill(0).map((_, i) => [i, i]));
  assertEquals(decodeCbor(encodeCbor(object)), object);

  pairs = random(2 ** 16, 2 ** 17);
  object = Object.fromEntries(new Array(pairs).fill(0).map((_, i) => [i, i]));
  assertEquals(decodeCbor(encodeCbor(object)), object);

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("decodeCbor() decoding CborTag()", () => {
  const tag = new CborTag(
    4,
    new Uint8Array(random(0, 24)).map((_) => random(0, 256)),
  );
  assertEquals(decodeCbor(encodeCbor(tag)), tag);
});

Deno.test("decodeCbor() rejecting empty encoded data", () => {
  assertThrows(
    () => {
      decodeCbor(new Uint8Array(0));
    },
    RangeError,
    "Cannot decode empty Uint8Array",
  );
});

Deno.test("decodeCbor() rejecting majorType 0 due to additional information", () => {
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b000_11100,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b000_11100)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b000_11101,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b000_11101)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b000_11110,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b000_11110)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b000_11111,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b000_11111)",
  );
});

Deno.test("decodeCbor() rejecting majorType 1 due to additional information", () => {
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b001_11100,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b001_11100)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b001_11101,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b001_11101)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b001_11110,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b001_11110)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b001_11111,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b001_11111)",
  );
});

Deno.test("decodeCbor() rejecting majorType 2 due to additional information", () => {
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b010_11100,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b010_11100)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b010_11101,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b010_11101)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b010_11110,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b010_11110)",
  );
});

Deno.test("decodeCbor() rejecting majorType 2 due to invalid indefinite length byte string", () => {
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([0b010_11111]));
    },
    RangeError,
    "More bytes were expected",
  );
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([0b010_11111, 0b000_00000]));
    },
    TypeError,
    "Cannot decode value (0b000_00000) inside an indefinite length byte string",
  );
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([0b010_11111, 0b010_11111]));
    },
    TypeError,
    "Indefinite length byte strings cannot contain indefinite length byte strings",
  );
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([0b010_11111, 0b010_00000]));
    },
    RangeError,
    "More bytes were expected",
  );
});

Deno.test("decodeCbor() rejecting majorType 3 due to additional information", () => {
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b011_11100,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b011_11100)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b011_11101,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b011_11101)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b011_11110,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b011_11110)",
  );
});

Deno.test("decodeCbor() rejecting majorType 3 due to invalid indefinite length text string", () => {
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([0b011_11111]));
    },
    RangeError,
    "More bytes were expected",
  );
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([0b011_11111, 0b000_00000]));
    },
    TypeError,
    "Cannot decode value (0b000_00000) inside an indefinite length text string",
  );
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([0b011_11111, 0b011_11111]));
    },
    TypeError,
    "Indefinite length text strings cannot contain indefinite length text strings",
  );
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([0b011_11111, 0b011_00000]));
    },
    RangeError,
    "More bytes were expected",
  );
});

Deno.test("decodeCbor() rejecting majorType 4 due to additional information", () => {
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b100_11100,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b100_11100)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b100_11101,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b100_11101)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b100_11110,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b100_11110)",
  );
});

Deno.test("decodeCbor() rejecting majorType 4 due to invalid indefinite length arrays", () => {
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([0b100_11111]));
    },
    RangeError,
    "More bytes were expected",
  );
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([0b100_11111, 0b000_00000]));
    },
    RangeError,
    "More bytes were expected",
  );
});

Deno.test("decodeCbor() rejecting majorType 5 due to additional information", () => {
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b101_11100,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b101_11100)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b101_11101,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b101_11101)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b101_11110,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b101_11110)",
  );
});

Deno.test("decodeCbor() rejecting majorType 5 due to maps having invalid keys", () => {
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([0b101_00001, 0b000_00000, 0b000_00000]));
    },
    TypeError,
    'Cannot decode key of type (number): This implementation only supports "text string" keys',
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b101_00010,
          0b011_00001,
          48,
          0b000_00000,
          0b011_00001,
          48,
          0b000_00001,
        ]),
      );
    },
    TypeError,
    "A Map cannot have duplicate keys: Key (0) already exists",
  );
});

Deno.test("decodeCbor() rejecting majorType 5 due to invalid indefinite length maps", () => {
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([0b101_11111]));
    },
    RangeError,
    "More bytes were expected",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([0b101_11111, 0b000_00000, 0b000_00000, 0b111_11111]),
      );
    },
    TypeError,
    'Cannot decode key of type (number): This implementation only supports "text string" keys',
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b101_11111,
          0b011_00001,
          48,
          0b000_00000,
          0b011_00001,
          48,
          0b000_00001,
          0b111_11111,
        ]),
      );
    },
    TypeError,
    "A Map cannot have duplicate keys: Key (0) already exists",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b101_11111,
          0b011_00001,
          48,
          0b000_00000,
        ]),
      );
    },
    RangeError,
    "More bytes were expected",
  );
});

Deno.test("decodeCbor() rejecting majorType 6 due to additional information", () => {
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b110_11100,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b110_11100)",
  );
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([0b110_00000, 0b000_00000]));
    },
    TypeError,
    'Invalid TagItem: Expected a "text string"',
  );
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([0b110_00001, 0b010_00000]));
    },
    TypeError,
    'Invalid TagItem: Expected a "integer" or "float"',
  );
});

Deno.test("decodeCbor() rejecting majorType 7 due to additional information", () => {
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b111_11100,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b111_11100)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b111_11101,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b111_11101)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          0b111_11110,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b111_11110)",
  );
});

Deno.test("decodeCbor() rejecting tagNumber 2 & 3 due to invalid tagContent", () => {
  assertThrows(
    () => decodeCbor(encodeCbor(new CborTag(2, "a string is invalid"))),
    TypeError,
    'Invalid TagItem: Expected a "byte string"',
  );
  assertThrows(
    () => decodeCbor(encodeCbor(new CborTag(3, "a string is invalid"))),
    TypeError,
    'Invalid TagItem: Expected a "byte string"',
  );
});

Deno.test("decodeCbor() rejecting tagNumber 259 due to additional information", () => {
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          217,
          1,
          3,
          0b101_11100,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b101_11100)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          217,
          1,
          3,
          0b101_11101,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b101_11101)",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          217,
          1,
          3,
          0b101_11110,
          ...new Array(random(0, 64)).fill(0).map((_) => random(0, 256)),
        ]),
      );
    },
    RangeError,
    "Cannot decode value (0b101_11110)",
  );
});

Deno.test("decodeCbor() rejecting TagNumber 259 due to maps having invalid keys", () => {
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          217,
          1,
          3,
          0b101_00010,
          0b011_00001,
          48,
          0b000_00000,
          0b011_00001,
          48,
          0b000_00001,
        ]),
      );
    },
    TypeError,
    "A Map cannot have duplicate keys: Key (0) already exists",
  );
});

Deno.test("decodeCbor() rejecting tagNumber 259 due to invalid indefinite length maps", () => {
  assertThrows(
    () => {
      decodeCbor(Uint8Array.from([217, 1, 3, 0b101_11111]));
    },
    RangeError,
    "More bytes were expected",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          217,
          1,
          3,
          0b101_11111,
          0b011_00001,
          48,
          0b000_00000,
          0b011_00001,
          48,
          0b000_00001,
          0b111_11111,
        ]),
      );
    },
    TypeError,
    "A Map cannot have duplicate keys: Key (0) already exists",
  );
  assertThrows(
    () => {
      decodeCbor(
        Uint8Array.from([
          217,
          1,
          3,
          0b101_11111,
          0b011_00001,
          48,
          0b000_00000,
        ]),
      );
    },
    RangeError,
    "More bytes were expected",
  );
});

Deno.test("decodeCbor() correctly decoding with subarrays", () => {
  let encodedData = encodeCbor(0);
  let buffer = new Uint8Array(encodedData.length + 7);
  buffer.set(encodedData, 7);
  assertEquals(decodeCbor(buffer.subarray(7)), 0);

  encodedData = encodeCbor(24);
  buffer = new Uint8Array(encodedData.length + 7);
  buffer.set(encodedData, 7);
  assertEquals(decodeCbor(buffer.subarray(7)), 24);

  encodedData = encodeCbor(2 ** 8);
  buffer = new Uint8Array(encodedData.length + 7);
  buffer.set(encodedData, 7);
  assertEquals(decodeCbor(buffer.subarray(7)), 2 ** 8);

  encodedData = encodeCbor(2 ** 16);
  buffer = new Uint8Array(encodedData.length + 7);
  buffer.set(encodedData, 7);
  assertEquals(decodeCbor(buffer.subarray(7)), 2 ** 16);

  encodedData = encodeCbor(2 ** 32);
  buffer = new Uint8Array(encodedData.length + 7);
  buffer.set(encodedData, 7);
  assertEquals(decodeCbor(buffer.subarray(7)), 2n ** 32n);

  encodedData = encodeCbor(3.14);
  buffer = new Uint8Array(encodedData.length + 7);
  buffer.set(encodedData, 7);
  assertEquals(decodeCbor(buffer.subarray(7)), 3.14);
});
