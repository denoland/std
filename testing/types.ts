// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright @dsherret and dsherret/conditional-type-checks contributors. All rights reserved. MIT license.

/**
 * Asserts at compile time that the provided type argument's type resolves to the expected boolean literal type.
 *
 * @example Usage
 * ```ts ignore
 * import { assertType, IsExact, IsNullable } from "@std/testing/types";
 *
 * const result = "some result" as string | number;
 *
 * // compile error if the type of `result` is not exactly `string | number`
 * assertType<IsExact<typeof result, string | number>>(true);
 *
 * // causes a compile error that `true` is not assignable to `false`
 * assertType<IsNullable<string>>(true); // error: string is not nullable
 * ```
 *
 * @typeParam T The expected type (`true` or `false`)
 * @param expectTrue True if the passed in type argument resolved to true.
 */
export function assertType<T extends boolean>(
  // deno-lint-ignore no-unused-vars
  expectTrue: T,
) {}

/**
 * Asserts at compile time that the provided type argument's type resolves to true.
 *
 * @example Usage
 * ```ts
 * import { AssertTrue, Has, IsNullable } from "@std/testing/types";
 *
 * const result = 1 as string | number | null;
 *
 * type doTest = AssertTrue<Has<typeof result, string> | IsNullable<typeof result>>;
 * ```
 */
export type AssertTrue<T extends true> = never;

/**
 * Asserts at compile time that the provided type argument's type resolves to false.
 * @example Usage
 * ```ts
 * import { AssertFalse, IsNever } from "@std/testing/types";
 *
 * const result = 1 as string | number | null;
 *
 * type doTest = AssertFalse<IsNever<typeof result>>;
 * ```
 */
export type AssertFalse<T extends false> = never;

/**
 * Asserts at compile time that the provided type argument's type resolves to the expected boolean literal type.
 * @example Usage
 * ```ts
 * import { Assert, Has } from "@std/testing/types";
 *
 * const result = 1 as string | number | null;
 *
 * type doTest = Assert<Has<typeof result, number>, true>;
 * ```
 */
export type Assert<T extends boolean, Expected extends T> = never;

/**
 * Checks if type `T` has the specified type `U`.
 */
export type Has<T, U> = IsAny<T> extends true ? true
  : IsAny<U> extends true ? false
  : Extract<T, U> extends never ? false
  : true;

/**
 * Checks if type `T` does not have the specified type `U`.
 */
export type NotHas<T, U> = Has<T, U> extends false ? true : false;

/**
 * Checks if type `T` is possibly null or undefined.
 */
export type IsNullable<T> = Extract<T, null | undefined> extends never ? false
  : true;

/**
 * Checks if type `T` exactly matches type `U`.
 */
export type IsExact<T, U> = TupleMatches<AnyToBrand<T>, AnyToBrand<U>> extends
  true
  ? TupleMatches<DeepPrepareIsExact<T>, DeepPrepareIsExact<U>> extends true
    ? true
  : false
  : false;

/** @internal */
export type DeepPrepareIsExact<T, VisitedTypes = never> = {
  // make optional properties required
  [P in keyof T]-?: IsAny<T[P]> extends true ? AnyBrand
    : DeepPrepareIsExactProp<T[P], T, VisitedTypes>;
};

/** @internal */
export type DeepPrepareIsExactProp<Prop, Parent, VisitedTypes> = Prop extends
  VisitedTypes
  // recursive, bail
  ? Prop
  // not recursive, keep going and add the parent type as a visited type
  : DeepPrepareIsExact<Prop, VisitedTypes | Parent>;

/**
 * Checks if type `T` is the `any` type.
 */
// https://stackoverflow.com/a/49928360/3406963
export type IsAny<T> = 0 extends (1 & T) ? true : false;

/**
 * Checks if type `T` is the `never` type.
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Checks if type `T` is the `unknown` type.
 */
export type IsUnknown<T> = unknown extends T
  ? ([T] extends [null] ? false : true)
  : false;

/**
 * The internal utility type to match the given types as tuples.
 *
 * @internal
 */
export type TupleMatches<T, U> = Matches<[T], [U]>;

/**
 * The internal utility type to match the given types.
 *
 * @internal
 */
export type Matches<T, U> = T extends U ? U extends T ? true : false : false;

/**
 * The utility type to convert any to {@linkcode AnyBrand}.
 *
 * @internal
 */
export type AnyToBrand<T> = IsAny<T> extends true ? AnyBrand : T;

/**
 * The utility type to represent any type.
 *
 * @internal
 */
export type AnyBrand = { __conditionalTypeChecksAny__: undefined };
