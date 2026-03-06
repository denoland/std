// Copyright 2018-2026 the Deno authors. MIT license.
// Copyright @dsherret and dsherret/conditional-type-checks contributors. All rights reserved. MIT license.

/**
 * Testing utilities for types.
 *
 * ```ts expect-error ignore
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
 * @module
 */

/**
 * Asserts at compile time that the provided type argument's type resolves to the expected boolean literal type.
 *
 * @example Usage
 * ```ts expect-error ignore
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
 *
 * @typeParam T The type to assert is true.
 */
export type AssertTrue<T extends true> = never;

/**
 * Asserts at compile time that the provided type argument's type resolves to false.
 *
 * @example Usage
 * ```ts
 * import { AssertFalse, IsNever } from "@std/testing/types";
 *
 * const result = 1 as string | number | null;
 *
 * type doTest = AssertFalse<IsNever<typeof result>>;
 * ```
 *
 * @typeParam T The type to assert is false.
 */
export type AssertFalse<T extends false> = never;

/**
 * Asserts at compile time that the provided type argument's type resolves to the expected boolean literal type.
 *
 * @example Usage
 * ```ts
 * import { Assert, Has } from "@std/testing/types";
 *
 * const result = 1 as string | number | null;
 *
 * type doTest = Assert<Has<typeof result, number>, true>;
 * ```
 *
 * @typeParam T The type to assert is the expected boolean literal type.
 * @typeParam Expected The expected boolean literal type.
 */
export type Assert<T extends boolean, Expected extends T> = never;

/**
 * Checks if type `T` has the specified type `U`.
 *
 * @example Usage
 * ```ts
 * import { assertType, Has } from "@std/testing/types";
 *
 * assertType<Has<string | number, string>>(true);
 * assertType<Has<any, number>>(true);
 *
 * assertType<Has<string | number, Date>>(false);
 * assertType<Has<string, number>>(false);
 * assertType<Has<number, any>>(false);
 * ```
 *
 * @typeParam T The type to check if it has the specified type `U`.
 * @typeParam U The type to check if it is in the type `T`.
 */
export type Has<T, U> = IsAny<T> extends true ? true
  : IsAny<U> extends true ? false
  : Extract<T, U> extends never ? false
  : true;

/**
 * Checks if type `T` does not have the specified type `U`.
 *
 * @example Usage
 * ```ts
 * import { assertType, NotHas } from "@std/testing/types";
 *
 * assertType<NotHas<string | number, Date>>(true);
 * assertType<NotHas<string, number>>(true);
 * assertType<NotHas<number, any>>(true);
 *
 * assertType<NotHas<string | number, string>>(false);
 * assertType<NotHas<any, number>>(false);
 * ```
 *
 * @typeParam T The type to check if it does not have the specified type `U`.
 * @typeParam U The type to check if it is not in the type `T`.
 */
export type NotHas<T, U> = Has<T, U> extends false ? true : false;

/**
 * Checks if type `T` is possibly null or undefined.
 *
 * @example Usage
 * ```ts
 * import { assertType, IsNullable } from "@std/testing/types";
 *
 * assertType<IsNullable<string | null>>(true);
 * assertType<IsNullable<string | undefined>>(true);
 * assertType<IsNullable<null | undefined>>(true);
 *
 * assertType<IsNullable<string>>(false);
 * assertType<IsNullable<any>>(false);
 * assertType<IsNullable<never>>(false);
 * ```
 *
 * @typeParam T The type to check if it is nullable.
 */
export type IsNullable<T> = Extract<T, null | undefined> extends never ? false
  : true;

/**
 * Checks if type `T` exactly matches type `U`.
 *
 * @example Usage
 * ```ts
 * import { assertType, IsExact } from "@std/testing/types";
 *
 * assertType<IsExact<string | number, string | number>>(true);
 * assertType<IsExact<any, any>>(true); // ok to have any for both
 * assertType<IsExact<never, never>>(true);
 * assertType<IsExact<{ prop: string }, { prop: string }>>(true);
 *
 * assertType<IsExact<string | number | Date, string | number>>(false);
 * assertType<IsExact<string, string | number>>(false);
 * assertType<IsExact<string | undefined, string>>(false);
 * assertType<IsExact<string | undefined, any | string>>(false);
 * ```
 *
 * @typeParam T The type to check if it exactly matches type `U`.
 * @typeParam U The type to check if it exactly matches type `T`.
 */
export type IsExact<T, U> = ParametersAndReturnTypeMatches<
  FlatType<AnyToBrand<T>>,
  FlatType<AnyToBrand<U>>
> extends true ? ParametersAndReturnTypeMatches<
    FlatType<DeepPrepareIsExact<T>>,
    FlatType<DeepPrepareIsExact<U>>
  > extends true ? true
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
 *
 * @example Usage
 * ```ts
 * import { assertType, IsAny } from "@std/testing/types";
 *
 * assertType<IsAny<any>>(true);
 * assertType<IsAny<unknown>>(false);
 * ```
 *
 * @typeParam T The type to check if it is the `any` type.
 */
// https://stackoverflow.com/a/49928360/3406963
export type IsAny<T> = 0 extends (1 & T) ? true : false;

/**
 * Checks if type `T` is the `never` type.
 *
 * @example Usage
 * ```ts
 * import { assertType, IsNever } from "@std/testing/types";
 *
 * assertType<IsNever<never>>(true);
 * assertType<IsNever<unknown>>(false);
 * ```
 *
 * @typeParam T The type to check if it is the `never` type.
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Checks if type `T` is the `unknown` type.
 *
 * @example Usage
 * ```ts
 * import { assertType, IsUnknown } from "@std/testing/types";
 *
 * assertType<IsUnknown<unknown>>(true);
 * assertType<IsUnknown<never>>(false);
 * ```
 *
 * @typeParam T The type to check if it is the `unknown` type.
 */
export type IsUnknown<T> = unknown extends T
  ? ([T] extends [null] ? false : true)
  : false;

/**
 * The internal utility type to match the given types as return types.
 *
 * @internal
 */
export type ParametersAndReturnTypeMatches<T, U> = Matches<
  <X>(_: T) => X extends T ? 1 : 2,
  <X>(_: U) => X extends U ? 1 : 2
>;

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

/**
 * The utility type to flatten record types.
 *
 * @internal
 */
export type FlatType<T> = T extends Record<PropertyKey, unknown>
  ? { [K in keyof T]: FlatType<T[K]> }
  : T;
