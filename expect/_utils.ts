// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { EqualOptions, EqualOptionUtil } from "./_types.ts";

export function buildEqualOptions(options: EqualOptionUtil): EqualOptions {
  const { customMessage, customTesters = [], strictCheck } = options || {};
  return {
    customTesters,
    msg: customMessage,
    strictCheck,
  };
}

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  if (value == null) {
    return false;
  } else {
    return typeof ((value as Record<string, unknown>).then) === "function";
  }
}

// Check of these sentinel values are supported in jest (expect-utils)
// See https://github.com/jestjs/jest/blob/442c7f692e3a92f14a2fb56c1737b26fc663a0ef/packages/expect-utils/src/immutableUtils.ts#L29
// SENTINEL constants are from https://github.com/facebook/immutable-js
const IS_KEYED_SENTINEL = "@@__IMMUTABLE_KEYED__@@";
const IS_SET_SENTINEL = "@@__IMMUTABLE_SET__@@";
const IS_LIST_SENTINEL = "@@__IMMUTABLE_LIST__@@";
const IS_ORDERED_SENTINEL = "@@__IMMUTABLE_ORDERED__@@";
const IS_RECORD_SYMBOL = "@@__IMMUTABLE_RECORD__@@";

function isObjectLiteral(source: unknown): source is Record<string, unknown> {
  return source != null && typeof source === "object" && !Array.isArray(source);
}

export function isImmutableUnorderedKeyed(source: unknown): boolean {
  return Boolean(
    source &&
      isObjectLiteral(source) &&
      source[IS_KEYED_SENTINEL] &&
      !source[IS_ORDERED_SENTINEL],
  );
}

export function isImmutableUnorderedSet(source: unknown): boolean {
  return Boolean(
    source &&
      isObjectLiteral(source) &&
      source[IS_SET_SENTINEL] &&
      !source[IS_ORDERED_SENTINEL],
  );
}

export function isImmutableList(source: unknown): boolean {
  return Boolean(source && isObjectLiteral(source) && source[IS_LIST_SENTINEL]);
}

export function isImmutableOrderedKeyed(source: unknown): boolean {
  return Boolean(
    source &&
      isObjectLiteral(source) &&
      source[IS_KEYED_SENTINEL] &&
      source[IS_ORDERED_SENTINEL],
  );
}

export function isImmutableOrderedSet(source: unknown): boolean {
  return Boolean(
    source &&
      isObjectLiteral(source) &&
      source[IS_SET_SENTINEL] &&
      source[IS_ORDERED_SENTINEL],
  );
}

export function isImmutableRecord(source: unknown): boolean {
  return Boolean(source && isObjectLiteral(source) && source[IS_RECORD_SYMBOL]);
}

// deno-lint-ignore no-explicit-any
export function hasIterator(object: any) {
  return !!(object != null && object[Symbol.iterator]);
}

export function isA<T>(typeName: string, value: unknown): value is T {
  return Object.prototype.toString.apply(value) === `[object ${typeName}]`;
}

function isObject(a: unknown) {
  return a !== null && typeof a === "object";
}

// deno-lint-ignore no-explicit-any
export function entries(obj: any) {
  if (!isObject(obj)) return [];

  const symbolProperties = Object.getOwnPropertySymbols(obj)
    .filter((key) => key !== Symbol.iterator)
    .map((key) => [key, obj[key]]);

  return [...symbolProperties, ...Object.entries(obj)];
}
