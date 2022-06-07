// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { Buffer } from "../buffer.ts";

export const timingSafeEqual = (
  a: Buffer | DataView | ArrayBuffer,
  b: Buffer | DataView | ArrayBuffer,
): boolean => {
  if (a instanceof DataView) a = Buffer.from(a.buffer);
  if (b instanceof DataView) b = Buffer.from(b.buffer);
  if (a instanceof ArrayBuffer) a = Buffer.from(a);
  if (b instanceof ArrayBuffer) b = Buffer.from(b);

  let result = 0;
  if (a.byteLength !== b.byteLength) {
    b = a;
    result = 1;
  }

  for (let i = 0; i < a.byteLength; i++) {
    result |= (a as Buffer)[i] ^ (b as Buffer)[i];
  }

  return result === 0;
};
