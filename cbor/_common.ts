// Copyright 2018-2026 the Deno authors. MIT license.

export type ReleaseLock = (value?: unknown) => void;

export function numberToArray(bytes: number, x: number | bigint): Uint8Array {
  const view = new DataView(new ArrayBuffer(8));
  if (typeof x === "bigint" || x % 1 === 0) view.setBigUint64(0, BigInt(x));
  else view.setFloat64(0, x);
  return new Uint8Array(view.buffer.slice(-bytes));
}

export function arrayToNumber(
  buffer: ArrayBufferLike & { BYTES_PER_ELEMENT?: never },
  isInteger: true,
): number | bigint;
export function arrayToNumber(
  buffer: ArrayBufferLike & { BYTES_PER_ELEMENT?: never },
  isInteger: false,
): number;
export function arrayToNumber(
  buffer: ArrayBufferLike & { BYTES_PER_ELEMENT?: never },
  isInteger: boolean,
): number | bigint {
  const view = new DataView(buffer);
  if (isInteger) {
    switch (buffer.byteLength) {
      case 1:
        return view.getUint8(0);
      case 2:
        return view.getUint16(0);
      case 4:
        return view.getUint32(0);
      default:
        return view.getBigUint64(0);
    }
  }
  switch (buffer.byteLength) {
    case 2:
      return view.getFloat16(0);
    case 4:
      return view.getFloat32(0);
    default:
      return view.getFloat64(0);
  }
}
