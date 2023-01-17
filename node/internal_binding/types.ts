// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
//
// Adapted from Node.js. Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

import { core } from "../_core.ts";

const _toString = Object.prototype.toString;

const _isObjectLike = (value: unknown): boolean =>
  value !== null && typeof value === "object";

const _isFunctionLike = (value: unknown): boolean =>
  value !== null && typeof value === "function";

export function isAnyArrayBuffer(
  value: unknown,
): value is ArrayBuffer | SharedArrayBuffer {
  return (
    _isObjectLike(value) &&
    (_toString.call(value) === "[object ArrayBuffer]" ||
      _toString.call(value) === "[object SharedArrayBuffer]")
  );
}

export function isArgumentsObject(value: unknown): value is IArguments {
  return _isObjectLike(value) && _toString.call(value) === "[object Arguments]";
}

export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return (
    _isObjectLike(value) && _toString.call(value) === "[object ArrayBuffer]"
  );
}

export function isAsyncFunction(
  value: unknown,
): value is (...args: unknown[]) => Promise<unknown> {
  return (
    _isFunctionLike(value) && _toString.call(value) === "[object AsyncFunction]"
  );
}

// deno-lint-ignore ban-types
export function isBooleanObject(value: unknown): value is Boolean {
  return _isObjectLike(value) && _toString.call(value) === "[object Boolean]";
}

export function isBoxedPrimitive(
  value: unknown,
  // deno-lint-ignore ban-types
): value is Boolean | String | Number | Symbol | BigInt {
  return (
    isBooleanObject(value) ||
    isStringObject(value) ||
    isNumberObject(value) ||
    isSymbolObject(value) ||
    isBigIntObject(value)
  );
}

export function isDataView(value: unknown): value is DataView {
  return _isObjectLike(value) && _toString.call(value) === "[object DataView]";
}

export function isDate(value: unknown): value is Date {
  return _isObjectLike(value) && _toString.call(value) === "[object Date]";
}

export function isGeneratorFunction(
  value: unknown,
): value is GeneratorFunction {
  return (
    _isFunctionLike(value) &&
    _toString.call(value) === "[object GeneratorFunction]"
  );
}

export function isGeneratorObject(value: unknown): value is Generator {
  return _isObjectLike(value) && _toString.call(value) === "[object Generator]";
}

export function isMap(value: unknown): value is Map<unknown, unknown> {
  return _isObjectLike(value) && _toString.call(value) === "[object Map]";
}

export function isMapIterator(
  value: unknown,
): value is IterableIterator<[unknown, unknown]> {
  return (
    _isObjectLike(value) && _toString.call(value) === "[object Map Iterator]"
  );
}

export function isModuleNamespaceObject(
  value: unknown,
): value is Record<string | number | symbol, unknown> {
  return _isObjectLike(value) && _toString.call(value) === "[object Module]";
}

export function isNativeError(value: unknown): value is Error {
  return _isObjectLike(value) && _toString.call(value) === "[object Error]";
}

// deno-lint-ignore ban-types
export function isNumberObject(value: unknown): value is Number {
  return _isObjectLike(value) && _toString.call(value) === "[object Number]";
}

export function isBigIntObject(value: unknown): value is BigInt {
  return _isObjectLike(value) && _toString.call(value) === "[object BigInt]";
}

export function isPromise(value: unknown): value is Promise<unknown> {
  return _isObjectLike(value) && _toString.call(value) === "[object Promise]";
}

export function isProxy(
  value: unknown,
): value is Record<string | number | symbol, unknown> {
  return core.isProxy(value);
}

export function isRegExp(value: unknown): value is RegExp {
  return _isObjectLike(value) && _toString.call(value) === "[object RegExp]";
}

export function isSet(value: unknown): value is Set<unknown> {
  return _isObjectLike(value) && _toString.call(value) === "[object Set]";
}

export function isSetIterator(
  value: unknown,
): value is IterableIterator<unknown> {
  return (
    _isObjectLike(value) && _toString.call(value) === "[object Set Iterator]"
  );
}

export function isSharedArrayBuffer(
  value: unknown,
): value is SharedArrayBuffer {
  return (
    _isObjectLike(value) &&
    _toString.call(value) === "[object SharedArrayBuffer]"
  );
}

// deno-lint-ignore ban-types
export function isStringObject(value: unknown): value is String {
  return _isObjectLike(value) && _toString.call(value) === "[object String]";
}

// deno-lint-ignore ban-types
export function isSymbolObject(value: unknown): value is Symbol {
  return _isObjectLike(value) && _toString.call(value) === "[object Symbol]";
}

export function isWeakMap(
  value: unknown,
): value is WeakMap<Record<string | number | symbol, unknown>, unknown> {
  return _isObjectLike(value) && _toString.call(value) === "[object WeakMap]";
}

export function isWeakSet(
  value: unknown,
): value is WeakSet<Record<string | number | symbol, unknown>> {
  return _isObjectLike(value) && _toString.call(value) === "[object WeakSet]";
}

export default {
  isAsyncFunction,
  isGeneratorFunction,
  isAnyArrayBuffer,
  isArrayBuffer,
  isArgumentsObject,
  isBoxedPrimitive,
  isDataView,
  // isExternal,
  isMap,
  isMapIterator,
  isModuleNamespaceObject,
  isNativeError,
  isPromise,
  isSet,
  isSetIterator,
  isWeakMap,
  isWeakSet,
  isRegExp,
  isDate,
  isStringObject,
  isNumberObject,
  isBooleanObject,
  isBigIntObject,
};
