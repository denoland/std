type IsAny<T> = 0 extends (1 & T) ? true : false;
// @ts-ignore Uint8array is not generic in TS < 5.7
type NewUint8Array<T> = Uint8Array<T>;

type IsOld = IsAny<NewUint8Array<ArrayBuffer>>;
type Uint8Array2<T = ArrayBufferLike> = IsOld extends true ? Uint8Array
  : NewUint8Array<T>;
export type { Uint8Array2 as Uint8Array };
