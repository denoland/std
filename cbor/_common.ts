// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

export function numberToArray(bytes: number, x: number | bigint): Uint8Array {
  const view = new DataView(new ArrayBuffer(8));
  if (typeof x === "bigint" || x % 1 === 0) view.setBigUint64(0, BigInt(x));
  else view.setFloat64(0, x);
  return new Uint8Array(view.buffer.slice(-bytes));
}
