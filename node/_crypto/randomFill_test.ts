import { Buffer } from "../buffer.ts";
import { randomFillSync } from "./randomFill.ts";
import { assertEquals, assertThrows } from "../../testing/asserts.ts";

const validateNonZero = (buf: Buffer) => buf.some((ch) => ch > 0);
const validateZero = (buf: Buffer) => {
  buf.forEach((val) => assertEquals(val, 0));
};

Deno.test("[node/crypto.randomFillSync] Complete fill, explicit size", () => {
  const buf = Buffer.alloc(10);
  randomFillSync(buf, undefined, 10);
  validateNonZero(buf);
});

Deno.test("[randomFillSync] Complete fill", () => {
  const buf = Buffer.alloc(10);
  randomFillSync(buf);
  validateNonZero(buf);
});

Deno.test("[node/crypto.randomFillSync] Fill beginning, explicit offset+size", () => {
  const buf = Buffer.alloc(10);
  randomFillSync(buf, 0, 5);
  validateNonZero(buf);

  const untouched = buf.slice(5);
  assertEquals(untouched.length, 5);
  validateZero(untouched);
});

Deno.test("[node/crypto.randomFillSync] Invalid offst/size", () => {
  assertThrows(() => randomFillSync(Buffer.alloc(10), 1, 10));
});
