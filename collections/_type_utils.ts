// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

export type Arr = readonly any[];

// https://github.com/type-challenges/type-challenges/issues/18773
export type IsInteger<T extends number> = `${T}` extends `${bigint}` ? T
  : never;

export type IsUnion<T, U = T> = T extends U ? [U] extends [T] ? false : true
  : never;

// https://github.com/type-challenges/type-challenges/issues/27436
export type IsNegativeNumber<
  T extends number,
> = IsUnion<T> extends true ? never
  : number extends T ? never
  : `${T}` extends `-${string}` ? true
  : false;

export type IsPositiveNumber<T extends number> = IsUnion<T> extends true ? never
  : number extends T ? never
  : `${T}` extends `-${string}` ? false
  : true;

export type IsPositiveInteger<T extends number> = T extends 0 ? false
  : IsInteger<T> extends never ? false
  : IsPositiveNumber<T> extends true ? true
  : false;

export type IsLength<T extends Arr, N extends number> = T["length"] extends N
  ? true
  : false;

// https://github.com/type-challenges/type-challenges/blob/b4a78ba774369c436f99c24ac131e80e52fdf757/utils/index.d.ts
// deno-fmt-ignore
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false

export type NotEqual<X, Y> = true extends Equal<X, Y> ? false : true;

export type AssertEquals<T extends true> = T;
export type AssertNotEquals<T extends false> = T;
