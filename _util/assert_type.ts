// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Original author: @dsherret https://github.com/dsherret/conditional-type-checks

/**
 * Asserts at compile time that the provided type argument's type resolves to the expected boolean literal type.
 * @param _expectTrue - True if the passed in type argument resolved to true.
 */
export function assertType<T extends true | false>(_expectTrue: T) {}

/**
 * Checks if type `T` exactly matches type `U`.
 */
export type IsExact<T, U> = TupleMatches<AnyToBrand<T>, AnyToBrand<U>> extends
  true ? TupleMatches<
    DeepMakeRequiredForIsExact<T>,
    DeepMakeRequiredForIsExact<U>
  > extends true // catch optional properties
    ? true
  : false
  : false;

type DeepMakeRequiredForIsExact<T> = {
  [P in keyof T]-?: DeepMakeRequiredForIsExact<AnyToBrand<T[P]>>;
};

/**
 * Checks if type `T` is the `any` type.
 */
// https://stackoverflow.com/a/49928360/3406963
export type IsAny<T> = 0 extends (1 & T) ? true : false;

type TupleMatches<T, U> = Matches<[T], [U]> extends true ? true : false;
type Matches<T, U> = T extends U ? U extends T ? true : false : false;

type AnyToBrand<T> = IsAny<T> extends true
  ? { __conditionalTypeChecksAny__: undefined }
  : T;
