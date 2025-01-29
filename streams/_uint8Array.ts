interface Child {
  // deno-lint-ignore camelcase
  __test_property__: string;
}
interface Parent extends Uint8Array, Child {
}

// Uint8Array#reverse() started returning `this` in TS 5.7
type IsNew = ReturnType<Parent["reverse"]> extends Child ? true : false;

// @ts-ignore for old ts
type NewUint8Array<T> = Uint8Array<T>;

type LocalUint8Array<T extends ArrayBufferLike = ArrayBufferLike> =
  IsNew extends true ? NewUint8Array<T> : Uint8Array;

export type { LocalUint8Array as Uint8Array };
