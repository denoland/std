// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { CborTag, decodeCbor, encodeCbor } from "./mod.ts";

function random(start: number, end: number): number {
  return Math.floor(Math.random() * (end - start) + start);
}

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

  num = random(2 ** 32, 2 ** 64);
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
    2,
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

Deno.test("decodeCbor() rejecting majorType 0", () => {
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

Deno.test("decodeCbor() rejecting majorType 1", () => {
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

Deno.test("decodeCbor() rejecting majorType 2", () => {
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

Deno.test("decodeCbor() rejecting majorType 3", () => {
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

Deno.test("decodeCbor() rejecting majorType 4", () => {
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

Deno.test("decodeCbor() rejecting majorType 5", () => {
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

Deno.test("decodeCbor() rejecting majorType 7", () => {
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
