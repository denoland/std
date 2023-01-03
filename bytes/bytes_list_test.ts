// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { BytesList } from "./bytes_list.ts";
import * as bytes from "./mod.ts";
function setup() {
  const arr = new BytesList();
  const part1 = new Uint8Array([0, 1, 2]);
  const part2 = new Uint8Array([3, 4, 5, 6]);
  const part3 = new Uint8Array([7]);
  const part4 = new Uint8Array([0, 0, 8, 0]);
  const part5 = new Uint8Array([0, 9]);
  arr.add(part1);
  arr.add(part2);
  arr.add(part3);
  arr.add(new Uint8Array());
  arr.add(part3, 0, 0);
  arr.add(part4, 2, 3);
  arr.add(part5, 1, 2);
  return arr;
}

Deno.test("[bytes] BytesList.size", () => {
  assertEquals(new BytesList().size(), 0);
  assertEquals(setup().size(), 10);
});

Deno.test("[bytes] BytesList.getChunkIndex", () => {
  const arr = setup();
  assertEquals(arr.getChunkIndex(-1), -1);
  assertEquals(arr.getChunkIndex(0), 0);
  assertEquals(arr.getChunkIndex(1), 0);
  assertEquals(arr.getChunkIndex(2), 0);
  assertEquals(arr.getChunkIndex(3), 1);
  assertEquals(arr.getChunkIndex(4), 1);
  assertEquals(arr.getChunkIndex(5), 1);
  assertEquals(arr.getChunkIndex(6), 1);
  assertEquals(arr.getChunkIndex(7), 2);
  assertEquals(arr.getChunkIndex(8), 3);
  assertEquals(arr.getChunkIndex(9), 4);
  assertEquals(arr.getChunkIndex(10), -1);
});

Deno.test("[bytes] BytesList.get", () => {
  const arr = setup();
  for (let i = 0; i < arr.size(); i++) {
    assertEquals(arr.get(i), i);
  }
  assertThrows(
    () => {
      arr.get(-100);
    },
    Error,
    "out of range",
  );
  assertThrows(
    () => {
      arr.get(100);
    },
    Error,
    "out of range",
  );
});

Deno.test("[bytes] BytesList.add should ignore empty buf and range", () => {
  const arr = new BytesList();
  const buf = new Uint8Array([0]);
  arr.add(new Uint8Array());
  arr.add(buf, 0, 0);
  assertEquals(arr.size(), 0);
});
Deno.test("[bytes] BytesList.add should throw if invalid range", () => {
  const arr = new BytesList();
  const buf = new Uint8Array([0]);
  assertThrows(
    () => {
      arr.add(buf, -1, 0);
    },
    Error,
    "invalid range",
  );
  assertThrows(
    () => {
      arr.add(buf, 0, -1);
    },
    Error,
    "invalid range",
  );
  assertThrows(
    () => {
      arr.add(buf, 4, 0);
    },
    Error,
    "invalid range",
  );
  assertThrows(
    () => {
      arr.add(buf, 0, 4);
    },
    Error,
    "invalid range",
  );
});
Deno.test("[bytes] BytesList.slice", () => {
  const arr = setup();
  assertEquals(
    bytes.equals(arr.slice(0, 4), new Uint8Array([0, 1, 2, 3])),
    true,
  );
  assertEquals(bytes.equals(arr.slice(3, 5), new Uint8Array([3, 4])), true);
  assertEquals(
    bytes.equals(arr.slice(0), new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])),
    true,
  );
  assertThrows(
    () => {
      arr.slice(9, 11);
    },
    Error,
    "invalid range",
  );
  assertThrows(
    () => {
      arr.slice(-1, 1);
    },
    Error,
    "invalid range",
  );
  assertThrows(
    () => {
      arr.slice(1, 0);
    },
    Error,
    "invalid range",
  );
});
Deno.test("[bytes] BytesList.concat", () => {
  const arr = setup();
  assertEquals(
    bytes.equals(
      arr.concat(),
      new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    ),
    true,
  );
});
Deno.test("[bytes] BytesList.shift", () => {
  const arr = setup();
  arr.shift(0);
  arr.shift(3);
  assertEquals(arr.size(), 7);
  assertEquals(
    bytes.equals(
      arr.concat(),
      new Uint8Array([3, 4, 5, 6, 7, 8, 9]),
    ),
    true,
  );
  arr.shift(4);
  assertEquals(arr.size(), 3);
  assertEquals(
    bytes.equals(
      arr.concat(),
      new Uint8Array([7, 8, 9]),
    ),
    true,
  );
});
Deno.test("[bytes] BytesList.shift 2", () => {
  const arr = new BytesList();
  arr.add(new Uint8Array([0, 0, 0, 1, 2, 0]), 0, 5);
  arr.shift(2);
  assertEquals(arr.size(), 3);
  assertEquals(
    bytes.equals(
      arr.concat(),
      new Uint8Array([
        0,
        1,
        2,
      ]),
    ),
    true,
  );
  arr.shift(2);
  assertEquals(arr.size(), 1);
  assertEquals(
    bytes.equals(
      arr.concat(),
      new Uint8Array([
        2,
      ]),
    ),
    true,
  );
});

Deno.test("[bytes] BytesList.shift 3", () => {
  const arr = new BytesList();
  arr.add(new Uint8Array([0, 0, 0, 1, 2, 0]), 0, 5);
  arr.shift(100);
  assertEquals(arr.size(), 0);
  assertEquals(arr.concat().byteLength, 0);
});

Deno.test("[bytes] BytesList.iterator()", () => {
  const arr = setup();
  assertEquals(Array.from(arr.iterator()), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assertEquals(Array.from(arr.iterator(5)), [5, 6, 7, 8, 9]);
  assertEquals(Array.from(arr.iterator(-1)), []);
  assertEquals(Array.from(arr.iterator(100)), []);
});
