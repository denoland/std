// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Utilities for handling Deno KV entries, keys, and values as structures
 * which can be serialized and deserialized to JSON.
 *
 * This is useful when communicating entries and values outside of the runtime
 * environment.
 *
 * @example Converting to a maybe entry to JSON
 *
 * ```ts
 * import { entryMaybeToJSON } from "@std/kv/json";
 *
 * const db = await Deno.openKv();
 * const entryMaybe = await db.get(["a"]);
 *
 * // `json` is now an object which can be safely converted to a JSON string
 * const json = entryMaybeToJSON(entryMaybe);
 * db.close();
 * ```
 *
 * @example Converting a JSON value to a Deno KV value
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 *
 * // `json` represents a `Uint8Array` with the bytes of [1, 2, 3]
 * const json = { type: "Uint8Array", value: "AQID" } as const;
 *
 * const db = await Deno.openKv();
 * await db.set(["a"], toValue(json));
 * db.close();
 * ```
 *
 * @module
 */

import { decodeBase64Url, encodeBase64Url } from "@std/encoding/base64url";

// Deno KV Key types

/**
 * A JSON representation of a {@linkcode bigint} Deno KV key part. The value
 * is a string representation of the integer, for example `100n` would be:
 *
 * ```json
 * { "type": "bigint", "value": "100" }
 * ```
 */
export interface KvBigIntJSON {
  /**
   * The type of the key part, which is always `"bigint"`.
   */
  type: "bigint";
  /**
   * The string representation of the bigint value.
   */
  value: string;
}

/**
 * A JSON representation of a {@linkcode boolean} Deno KV key part. The value
 * is the boolean value, for example `true` would be:
 *
 * ```json
 * { "type": "boolean", "value": true }
 * ```
 */
export interface KvBooleanJSON {
  /**
   * The type of the key part, which is always `"boolean"`.
   */
  type: "boolean";
  /**
   * The boolean value.
   */
  value: boolean;
}

/**
 * A JSON representation of a {@linkcode number} Deno KV key part. The value
 * is the number value, for example `100` would be:
 *
 * ```json
 * { "type": "number", "value": 100 }
 * ```
 *
 * For special numbers, the value is a string representation of the number, for
 * example `Infinity` would be:
 *
 * ```json
 * { "type": "number", "value": "Infinity" }
 * ```
 */
export interface KvNumberJSON {
  /**
   * The type of the key part, which is always `"number"`.
   */
  type: "number";
  /**
   * The number value.
   */
  value: number | "Infinity" | "-Infinity" | "NaN";
}

/**
 * A JSON representation of a {@linkcode string} Deno KV key part. The value is
 * the string value, for example `"value"` would be:
 *
 * ```json
 * { "type": "string", "value": "value" }
 * ```
 */
export interface KvStringJSON {
  /**
   * The type of the key part, which is always `"string"`.
   */
  type: "string";
  /**
   * The string value.
   */
  value: string;
}

/**
 * A JSON representation of a {@linkcode Uint8Array} Deno KV key part. The value
 * is a URL safe base64 encoded value, for example an array with the values of
 * `[ 1, 2, 3 ]` would be:
 *
 * ```json
 * { "type": "Uint8Array", "value": "AQID" }
 * ```
 *
 * While Deno KV accepts anything that is array view like as a key part, when
 * the value is read as part of an entry, it is always represented as a
 * `Uint8Array`.
 */
export interface KvUint8ArrayJSON {
  /**
   * The type of the key part, which is always `"Uint8Array"`.
   */
  type: "Uint8Array";
  /**
   * The URL safe base64 encoded value of the array.
   */
  value: string;
}

/**
 * JSON representations of {@linkcode Deno.KvKeyPart}. This represents each key
 * part type that is supported by Deno KV.
 */
export type KvKeyPartJSON =
  | KvBigIntJSON
  | KvBooleanJSON
  | KvNumberJSON
  | KvStringJSON
  | KvUint8ArrayJSON;

/**
 * A JSON representation of a {@linkcode Deno.KvKey}, which is an array of
 * {@linkcode KvKeyPartJSON} items.
 */
export type KvKeyJSON = readonly KvKeyPartJSON[];

// Deno KV Value types

/**
 * A representation of an {@linkcode ArrayBuffer} Deno KV value. The value is
 * the bytes of the array buffer encoded as a URL safe base64 string, for
 * example an array buffer with the byte values of `[ 1, 2, 3 ]` would be:
 *
 * ```json
 * { "type": "ArrayBuffer", "value": "AQID" }
 * ```
 */
export interface KvArrayBufferJSON {
  /**
   * The type of the value, which is always `"ArrayBuffer"`.
   */
  type: "ArrayBuffer";
  /**
   * The URL safe base64 encoded value of the array buffer.
   */
  value: string;
}

/**
 * A representation of an {@linkcode Array} Deno KV value. The value is the
 * JSON serialized version of the elements of the array.
 */
export interface KvArrayJSON {
  /**
   * The type of the value, which is always `"Array"`.
   */
  type: "Array";
  /**
   * The JSON serialized version of the array.
   */
  value: readonly KvValueJSON[];
}

/**
 * A representation of an {@linkcode DataView} Deno KV value. The value is
 * the bytes of the buffer encoded as a URL safe base64 string, for example a
 * data view with the byte values of `[ 1, 2, 3 ]` would be:
 *
 * ```json
 * { "type": "DataView", "value": "AQID" }
 * ```
 */
export interface KvDataViewJSON {
  /**
   * The type of the value, which is always `"DataView"`.
   */
  type: "DataView";
  /**
   * The URL safe base64 encoded value of the data view.
   */
  value: string;
}

/**
 * A representation of a {@linkcode Date} Deno KV value. The value is the
 * [ISO string representation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
 * of the date.
 */
export interface KvDateJSON {
  /**
   * The type of the value, which is always `"Date"`.
   */
  type: "Date";
  /**
   * The ISO string representation of the date.
   */
  value: string;
}

/**
 * Error instances which are
 * [cloneable](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#error_types)
 * and therefore can be stored in a Deno KV store.
 *
 * This type is used to allow type inference when deserializing from JSON.
 */
export interface CloneableErrors {
  /** {@linkcode Error} which is cloneable. */
  Error: Error;
  /** {@linkcode EvalError} which is cloneable. */
  EvalError: EvalError;
  /** {@linkcode RangeError} which is cloneable. */
  RangeError: RangeError;
  /** {@linkcode ReferenceError} which is cloneable. */
  ReferenceError: ReferenceError;
  /** {@linkcode SyntaxError} which is cloneable. */
  SyntaxError: SyntaxError;
  /** {@linkcode TypeError} which is cloneable. */
  TypeError: TypeError;
  /** {@linkcode URIError} which is cloneable. */
  URIError: URIError;
}

/**
 * The keys of {@linkcode CloneableErrors} which is used for type inference
 * when deserializing from JSON.
 */
export type CloneableErrorTypes = keyof CloneableErrors;

/**
 * A representation of {@linkcode Error}s that can be stored as Deno KV values.
 * The value is set to a serialized version of the value. Instances that are
 * not one of the specified types, but inherit from `Error` will be serialized
 * as `Error`.
 */
export interface KvErrorJSON<
  ErrorType extends CloneableErrorTypes = CloneableErrorTypes,
> {
  /**
   * The type of the error, which is one of the cloneable error types.
   */
  type: ErrorType;
  /**
   * The value of the error, which is a JSON serialized version of the error.
   */
  value: {
    message: string;
    cause?: KvValueJSON | undefined;
    stack?: string | undefined;
  };
}

/**
 * A representation of a {@linkcode Deno.KvU64} value. The value is the string
 * representation of the unsigned integer.
 */
export interface KvKvU64JSON {
  /**
   * The type of the value, which is always `"KvU64"`.
   */
  type: "KvU64";
  /**
   * The string representation of the unsigned integer value.
   */
  value: string;
}

/**
 * A representation of a {@linkcode Map} Deno KV value. The value is an array
 * of map entries where is map entry is a tuple of a JSON serialized key and
 * value.
 */
export interface KvMapJSON {
  /**
   * The type of the value, which is always `"Map"`.
   */
  type: "Map";
  /**
   * The JSON serialized version of the map entries.
   */
  value: readonly [key: KvValueJSON, value: KvValueJSON][];
}

/**
 * A representation of a {@linkcode null} Deno KV value. The value is `null`.
 */
export interface KvNullJSON {
  /**
   * The type of the value, which is always `"null"`.
   */
  type: "null";
  /**
   * The value of the value, which is always `null`.
   */
  value: null;
}

/**
 * A representation of a {@linkcode object} Deno KV value. The value is a JSON
 * serialized version of the value.
 */
export interface KvObjectJSON {
  /**
   * The type of the value, which is always `"object"`.
   */
  type: "object";
  /**
   * The JSON serialized version of the object.
   */
  value: { [key: string]: KvValueJSON };
}

/**
 * A representation of a {@linkcode RegExp} Deno KV value. The value is a string
 * representation of the regular expression value.
 */
export interface KvRegExpJSON {
  /**
   * The type of the value, which is always `"RegExp"`.
   */
  type: "RegExp";
  /**
   * The string representation of the regular expression value.
   */
  value: string;
}

/**
 * A representation of a {@linkcode Set} Deno KV value. The value is an array
 * of the JSON serialized values of the set.
 */
export interface KvSetJSON {
  /**
   * The type of the value, which is always `"Set"`.
   */
  type: "Set";
  /**
   * The JSON serialized version of the set values.
   */
  value: readonly KvValueJSON[];
}

/** Used internally to identify a typed array. */
export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

/**
 * Used internally to be able to map the name of the typed array to its instance
 * type.
 */
export interface TypedArrayMap {
  /** {@linkcode Int8Array} which is a typed array. */
  Int8Array: Int8Array;
  /** {@linkcode Uint8Array} which is a typed array. */
  Uint8Array: Uint8Array;
  /** {@linkcode Uint8ClampedArray} which is a typed array. */
  Uint8ClampedArray: Uint8ClampedArray;
  /** {@linkcode Int16Array} which is a typed array. */
  Int16Array: Int16Array;
  /** {@linkcode Uint16Array} which is a typed array. */
  Uint16Array: Uint16Array;
  /** {@linkcode Int32Array} which is a typed array. */
  Int32Array: Int32Array;
  /** {@linkcode Uint32Array} which is a typed array. */
  Uint32Array: Uint32Array;
  /** {@linkcode Float32Array} which is a typed array. */
  Float32Array: Float32Array;
  /** {@linkcode Float64Array} which is a typed array. */
  Float64Array: Float64Array;
  /** {@linkcode BigInt64Array} which is a typed array. */
  BigInt64Array: BigInt64Array;
  /** {@linkcode BigUint64Array} which is a typed array. */
  BigUint64Array: BigUint64Array;
}

/** Used internally. The string literal types of the names of the type. */
export type TypedArrayTypes = keyof TypedArrayMap;

/**
 * A representation of a typed array Deno KV value. The value is a URL safe
 * base64 encoded string which represents the individual bytes of the array.
 */
export interface KvTypedArrayJSON<
  ArrayType extends TypedArrayTypes = TypedArrayTypes,
> {
  /**
   * The type of the value.
   */
  type: ArrayType;
  /**
   * The URL safe base64 encoded value of the typed array.
   */
  value: string;
}

/**
 * A representation of a {@linkcode undefined} Deno KV value. The value is
 * undefined, and therefore elided when serialized. Therefore there is only one
 * form of this entity:
 *
 * ```json
 * { "type": "undefined" }
 * ```
 */
export interface KvUndefinedJSON {
  /**
   * The type of the value, which is always `"undefined"`.
   */
  type: "undefined";
}

/**
 * JSON representations of {@linkcode Deno.Kv} values, where the value types are
 * exhaustive of what Deno KV supports and are allowed via
 * [structured cloning](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).
 */
export type KvValueJSON =
  | KvArrayBufferJSON
  | KvArrayJSON
  | KvBigIntJSON
  | KvBooleanJSON
  | KvDataViewJSON
  | KvDateJSON
  | KvErrorJSON
  | KvKvU64JSON
  | KvMapJSON
  | KvNullJSON
  | KvNumberJSON
  | KvObjectJSON
  | KvRegExpJSON
  | KvSetJSON
  | KvStringJSON
  | KvTypedArrayJSON
  | KvUndefinedJSON;

// Deno KV Entry types

/**
 * A representation of a {@linkcode Deno.KvEntry} where the key and value are
 * encoded in a JSON serializable format.
 */
export interface KvEntryJSON {
  /**
   * The key of the entry.
   */
  key: KvKeyJSON;
  /**
   * The value of the entry.
   */
  value: KvValueJSON;
  /**
   * The versionstamp of the entry.
   */
  versionstamp: string;
}

/**
 * A representation of a {@linkcode Deno.KvEntryMaybe} where the key and value
 * are encoded in a JSON serializable format.
 */
export type KvEntryMaybeJSON = KvEntryJSON | {
  /**
   * The key of the entry.
   */
  key: KvKeyJSON;
  /**
   * The value of the entry.
   */
  value: null;
  /**
   * The versionstamp of the entry.
   */
  versionstamp: null;
};

// Serializing to JSON

/**
 * Internal function to serialize various classes of errors to JSON.
 *
 * @param error The error to serialize.
 * @returns The JSON representation of the error.
 *
 * @private
 */
function errorToJSON(error: Error): KvErrorJSON {
  const { message, stack, cause } = error;
  const value: KvErrorJSON["value"] = { message };
  if (cause) {
    value.cause = valueToJSON(cause);
  }
  if (stack) {
    value.stack = stack;
  }
  if (error instanceof EvalError) {
    return { type: "EvalError", value };
  }
  if (error instanceof RangeError) {
    return { type: "RangeError", value };
  }
  if (error instanceof ReferenceError) {
    return { type: "ReferenceError", value };
  }
  if (error instanceof SyntaxError) {
    return { type: "SyntaxError", value };
  }
  if (error instanceof TypeError) {
    return { type: "TypeError", value };
  }
  if (error instanceof URIError) {
    return { type: "URIError", value };
  }
  return { type: "Error", value };
}

/**
 * Internal function to serialize various typed arrays to JSON.
 *
 * @param typedArray The typed array to serialize.
 * @returns The JSON representation of the typed array.
 *
 * @private
 */
function typedArrayToJSON(typedArray: ArrayBufferView): KvTypedArrayJSON {
  const value = encodeBase64Url(typedArray.buffer);
  if (typedArray instanceof Int8Array) {
    return { type: "Int8Array", value };
  }
  if (typedArray instanceof Uint8Array) {
    return { type: "Uint8Array", value };
  }
  if (typedArray instanceof Uint8ClampedArray) {
    return { type: "Uint8ClampedArray", value };
  }
  if (typedArray instanceof Int16Array) {
    return { type: "Int16Array", value };
  }
  if (typedArray instanceof Uint16Array) {
    return { type: "Uint16Array", value };
  }
  if (typedArray instanceof Int32Array) {
    return { type: "Int32Array", value };
  }
  if (typedArray instanceof Uint32Array) {
    return { type: "Uint32Array", value };
  }
  if (typedArray instanceof Float32Array) {
    return { type: "Float32Array", value };
  }
  if (typedArray instanceof Float64Array) {
    return { type: "Float64Array", value };
  }
  if (typedArray instanceof BigInt64Array) {
    return { type: "BigInt64Array", value };
  }
  if (typedArray instanceof BigUint64Array) {
    return { type: "BigUint64Array", value };
  }
  throw TypeError("Unexpected typed array type, could not serialize.");
}

/**
 * Internal function to encode an object.
 *
 * @param object The object to encode.
 * @returns The encoded object.
 *
 * @private
 */
function encodeObject(object: object): { [key: string]: KvValueJSON } {
  const result: { [key: string]: KvValueJSON } = {};
  for (const [key, value] of Object.entries(object)) {
    result[key] = valueToJSON(value);
  }
  return result;
}

/**
 * Internal function to decode an object.
 *
 * @param json The JSON object to decode.
 * @returns The decoded object.
 *
 * @private
 */
function decodeObject(json: { [key: string]: KvValueJSON }): object {
  const result: { [key: string]: unknown } = {};
  for (const [key, value] of Object.entries(json)) {
    result[key] = toValue(value);
  }
  return result;
}

/**
 * Serialize a {@linkcode Deno.KvKeyPart} to JSON.
 *
 * @param value The key part to serialize.
 * @returns The JSON representation of the key part.
 * @example Serialize a key part to JSON
 *
 * ```ts
 * import { keyPartToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const keyPart = 100n;
 * const json = keyPartToJSON(keyPart);
 * assertEquals(json, { type: "bigint", value: "100" });
 * ```
 */
export function keyPartToJSON(value: Deno.KvKeyPart): KvKeyPartJSON {
  switch (typeof value) {
    case "bigint":
      return { type: "bigint", value: String(value) };
    case "boolean":
      return { type: "boolean", value };
    case "number":
      if (Number.isNaN(value)) {
        return { type: "number", value: "NaN" };
      } else if (value === Infinity) {
        return { type: "number", value: "Infinity" };
      } else if (value === -Infinity) {
        return { type: "number", value: "-Infinity" };
      }
      return { type: "number", value };
    case "object":
      if (value instanceof Uint8Array) {
        return { type: "Uint8Array", value: encodeBase64Url(value) };
      }
      break;
    case "string":
      return { type: "string", value };
  }
  throw new TypeError("Unable to serialize value.");
}

/**
 * Serialize a {@linkcode Deno.KvKey} to JSON.
 *
 * @param value The key to serialize.
 * @returns The JSON representation of the key.
 * @example Serialize a key to JSON
 *
 * ```ts
 * import { keyToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const key = ["a", 100n];
 * const json = keyToJSON(key);
 * assertEquals(json, [
 *   { type: "string", value: "a" },
 *   { type: "bigint", value: "100" },
 * ]);
 * ```
 */
export function keyToJSON(value: Deno.KvKey): KvKeyJSON {
  return value.map(keyPartToJSON);
}

/**
 * Serialize an array that can be stored in Deno KV to JSON.
 *
 * @param value The array value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = valueToJSON([["a", 1], ["b", 2]]);
 * assertEquals(json, { type: "Array", value: [
 *   { type: "Array", value: [{ type: "string", value: "a" }, { type: "number", value: 1 }] },
 *   { type: "Array", value: [{ type: "string", value: "b" }, { type: "number", value: 2 }] },
 * ] });
 * ```
 */
export function valueToJSON(value: unknown[]): KvArrayJSON;
/**
 * Serialize a bigint that can be stored in Deno KV to JSON.
 *
 * @param value The bigint value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = 100n;
 * const json = valueToJSON(value);
 * assertEquals(json, { type: "bigint", value: "100" });
 * ```
 */
export function valueToJSON(value: bigint): KvBigIntJSON;
/**
 * Serialize a boolean that can be stored in Deno KV to JSON.
 *
 * @param value The boolean value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = true;
 * const json = valueToJSON(value);
 * assertEquals(json, { type: "boolean", value: true });
 * ```
 */
export function valueToJSON(value: boolean): KvBooleanJSON;
/**
 * Serialize a {@linkcode Date} that can be stored in Deno KV to JSON.
 *
 * @param value The date value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = new Date();
 * const json = valueToJSON(value);
 * assertEquals(json.type, "Date");
 * ```
 */
export function valueToJSON(value: Date): KvDateJSON;
/**
 * Serialize an error that can be stored in Deno KV to JSON.
 *
 * @typeParam ErrorType The type of error that can be serialized
 * @param value The error value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = new TypeError("That is the wrong type!");
 * const json = valueToJSON(value);
 * assertEquals(json, {
 *   type: "TypeError",
 *   value: { message: "That is the wrong type!", stack: value.stack },
 * });
 * ```
 */
export function valueToJSON<ErrorType extends CloneableErrorTypes>(
  value: Error,
): KvErrorJSON<ErrorType>;
/**
 * Serialize a {@linkcode Deno.KvU64} that can be stored in Deno KV to JSON.
 *
 * @param value The value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = new Deno.KvU64(100n);
 * const json = valueToJSON(value);
 * assertEquals(json, { type: "KvU64", value: "100" });
 * ```
 */
export function valueToJSON(value: Deno.KvU64): KvKvU64JSON;
/**
 * Serialize a {@linkcode Map} that can be stored in Deno KV to JSON.
 *
 * @param value The map value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = new Map([["a", 1], ["b", 2]]);
 * const json = valueToJSON(value);
 * assertEquals(json, { type: "Map", value: [
 *   [{ type: "string", value: "a" }, { type: "number", value: 1 }],
 *   [{ type: "string", value: "b" }, { type: "number", value: 2 }],
 * ] });
 * ```
 */
export function valueToJSON(value: Map<unknown, unknown>): KvMapJSON;
/**
 * Serialize a `null` that can be stored in Deno KV to JSON.
 *
 * @param value The value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = null;
 * const json = valueToJSON(value);
 * assertEquals(json, { type: "null", value: null });
 * ```
 */
export function valueToJSON(value: null): KvNullJSON;
/**
 * Serialize a number that can be stored in Deno KV to JSON.
 *
 * This includes special numbers like `Infinity`, `-Infinity`, and `NaN`.
 *
 * @param value The number value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = 100;
 * const json = valueToJSON(value);
 * assertEquals(json, { type: "number", value: 100 });
 * ```
 */
export function valueToJSON(value: number): KvNumberJSON;
/**
 * Serialize a {@linkcode RegExp} that can be stored in Deno KV to JSON.
 *
 * @param value The regex value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = /1234/i;
 * const json = valueToJSON(value);
 * assertEquals(json, { type: "RegExp", value: "/1234/i" });
 * ```
 */
export function valueToJSON(value: RegExp): KvRegExpJSON;
/**
 * Serialize a {@linkcode Set} that can be stored in Deno KV to JSON.
 *
 * @param value The set value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = new Set([1, 2, 3]);
 * const json = valueToJSON(value);
 * assertEquals(json, { type: "Set", value: [
 *   { type: "number", value: 1 },
 *   { type: "number", value: 2 },
 *   { type: "number", value: 3 },
 * ] });
 * ```
 */
export function valueToJSON(value: Set<unknown>): KvSetJSON;
/**
 * Serialize a string that can be stored in Deno KV to JSON.
 *
 * @param value The string value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = "hello, world!";
 * const json = valueToJSON(value);
 * assertEquals(json, { type: "string", value: "hello, world!" });
 * ```
 */
export function valueToJSON(value: string): KvStringJSON;
/**
 * Serialize a typed array that can be stored in Deno KV to JSON.
 *
 * @typeParam TA The type of the typed array, which is inferred from the value
 * @param value The typed array value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = new Uint8Array([1, 2, 3]);
 * const json = valueToJSON(value);
 * assertEquals(json, { type: "Uint8Array", value: "AQID" });
 * ```
 */
export function valueToJSON<TA extends TypedArray>(
  value: TA,
): KvTypedArrayJSON<TA[typeof Symbol.toStringTag]>;
/**
 * Serialize an {@linkcode ArrayBuffer} that can be stored in Deno KV to JSON.
 *
 * @param value The array buffer value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = new Uint8Array([1, 2, 3]).buffer;
 * const json = valueToJSON(value);
 * assertEquals(json, { type: "ArrayBuffer", value: "AQID" });
 * ```
 */
export function valueToJSON(value: ArrayBufferLike): KvArrayBufferJSON;
/**
 * Serialize a {@linkcode DataView} that can be stored in Deno KV to JSON.
 *
 * @param value The data view value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = new DataView(new Uint8Array([1, 2, 3]).buffer);
 * const json = valueToJSON(value);
 * assertEquals(json, { type: "DataView", value: "AQID" });
 * ```
 */
export function valueToJSON(value: DataView): KvDataViewJSON;
/**
 * Serialize an `undefined` value that can be stored in Deno KV to JSON.
 *
 * @param value The `undefined` value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = undefined;
 * const json = valueToJSON(value);
 * assertEquals(json, { type: "undefined" });
 * ```
 */
export function valueToJSON(value: undefined): KvUndefinedJSON;
/**
 * Serialize an object value that can be stored in Deno KV to JSON.
 *
 * @param value The object to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = { a: 1, b: 2 };
 * const json = valueToJSON(value);
 * assertEquals(json, {
 *   type: "object",
 *   value: {
 *     a: { type: "number", value: 1 },
 *     b: { type: "number", value: 2 },
 *   }
 * });
 * ```
 */
export function valueToJSON(value: object): KvObjectJSON;
/**
 * Serialize a value that can be stored in Deno KV to JSON.
 *
 * @param value The value to serialize
 * @returns The JSON representation of the value
 * @example Serialize a value to JSON
 *
 * ```ts
 * import { valueToJSON } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = new Map([["a", 1], ["b", 2]]);
 * const json = valueToJSON(value);
 * assertEquals(json, { type: "Map", value: [
 *  [{ type: "string", value: "a" }, { type: "number", value: 1 }],
 *  [{ type: "string", value: "b" }, { type: "number", value: 2 }],
 * ] });
 * ```
 */
export function valueToJSON(value: unknown): KvValueJSON;
export function valueToJSON(value: unknown): KvValueJSON {
  switch (typeof value) {
    case "bigint":
    case "boolean":
    case "number":
    case "string":
      return keyPartToJSON(value);
    case "undefined":
      return { type: "undefined" };
    case "object":
      if (Array.isArray(value)) {
        return { type: "Array", value: value.map(valueToJSON) };
      }
      if (value instanceof DataView) {
        return { type: "DataView", value: encodeBase64Url(value.buffer) };
      }
      if (ArrayBuffer.isView(value)) {
        return typedArrayToJSON(value);
      }
      if (value instanceof ArrayBuffer) {
        return { type: "ArrayBuffer", value: encodeBase64Url(value) };
      }
      if (value instanceof Date) {
        return { type: "Date", value: value.toJSON() };
      }
      if ("Deno" in globalThis && value instanceof Deno.KvU64) {
        return { type: "KvU64", value: String(value) };
      }
      if (value instanceof Error) {
        return errorToJSON(value);
      }
      if (value instanceof Map) {
        const mapped: [KvValueJSON, KvValueJSON][] = [];
        for (const [key, val] of value.entries()) {
          mapped.push([valueToJSON(key), valueToJSON(val)]);
        }
        return { type: "Map", value: mapped };
      }
      if (value === null) {
        return { type: "null", value };
      }
      if (value instanceof RegExp) {
        return { type: "RegExp", value: String(value) };
      }
      if (value instanceof Set) {
        return { type: "Set", value: [...value].map(valueToJSON) };
      }
      return { type: "object", value: encodeObject(value) };
    default:
      throw new TypeError("Unexpected value type, unable to serialize.");
  }
}

/**
 * Serialize a {@linkcode Deno.KvEntry} to JSON.
 *
 * @param entry The entry to serialize.
 * @returns The JSON representation of the entry.
 * @example Serialize an entry to JSON
 *
 * ```ts
 * import { assert } from "@std/assert/assert";
 * import { entryToJSON } from "@std/kv/json";
 *
 * const db = await Deno.openKv();
 * const maybeEntry = await db.get(["a"]);
 * assert(maybeEntry.versionstamp);
 * const json = entryToJSON(maybeEntry);
 * db.close();
 * ```
 */
export function entryToJSON(
  { key, value, versionstamp }: Deno.KvEntry<unknown>,
): KvEntryJSON {
  return {
    key: key.map(keyPartToJSON),
    value: valueToJSON(value),
    versionstamp,
  };
}

/**
 * Serialize a {@linkcode Deno.KvEntryMaybe} to JSON.
 *
 * @param entryMaybe The maybe entry to serialize.
 * @returns The JSON representation of the maybe entry.
 * @example Serialize a maybe entry to JSON as a response
 *
 * ```ts ignore
 * import { entryMaybeToJSON } from "@std/kv";
 *
 * const db = await Deno.openKv();
 *
 * Deno.serve(async (_req) => {
 *   const maybeEntry = await db.get(["a"]);
 *   const json = entryMaybeToJSON(maybeEntry);
 *   return Response.json(json);
 * });
 * ```
 */
export function entryMaybeToJSON(
  entryMaybe: Deno.KvEntryMaybe<unknown>,
): KvEntryMaybeJSON {
  const { key, value, versionstamp } = entryMaybe;
  return {
    key: key.map(keyPartToJSON),
    value: value === null && versionstamp === null ? null : valueToJSON(value),
    versionstamp,
  } as KvEntryMaybeJSON;
}

// Deserializing from JSON

/**
 * Internal function to deserialize an error.
 *
 * @param param0 The JSON representation of the value.
 * @returns The deserialized error.
 * @private
 */
function toError(
  { type, value: { message, stack, cause } }: KvErrorJSON,
): Error {
  let error: Error;
  const options = cause ? { cause: toValue(cause) } : undefined;
  switch (type) {
    case "EvalError":
      error = new EvalError(message, options);
      break;
    case "RangeError":
      error = new RangeError(message, options);
      break;
    case "ReferenceError":
      error = new ReferenceError(message, options);
      break;
    case "SyntaxError":
      error = new SyntaxError(message, options);
      break;
    case "TypeError":
      error = new TypeError(message, options);
      break;
    case "URIError":
      error = new URIError(message, options);
      break;
    default:
      error = new Error(message, options);
  }
  if (stack) {
    Object.defineProperty(error, "stack", {
      value: stack,
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }
  return error;
}

/**
 * Internal function to deserialize typed arrays.
 *
 * @param json The JSON representation of the typed array.
 * @returns The deserialized typed array.
 * @private
 */
function toTypedArray(json: KvTypedArrayJSON): ArrayBufferView {
  const u8 = decodeBase64Url(json.value);
  switch (json.type) {
    case "BigInt64Array":
      return new BigInt64Array(u8.buffer);
    case "BigUint64Array":
      return new BigUint64Array(u8.buffer);
    case "Float32Array":
      return new Float32Array(u8.buffer);
    case "Float64Array":
      return new Float64Array(u8.buffer);
    case "Int16Array":
      return new Int16Array(u8.buffer);
    case "Int32Array":
      return new Int32Array(u8.buffer);
    case "Int8Array":
      return new Int8Array(u8.buffer);
    case "Uint16Array":
      return new Uint16Array(u8.buffer);
    case "Uint32Array":
      return new Uint32Array(u8.buffer);
    case "Uint8Array":
      return u8;
    case "Uint8ClampedArray":
      return new Uint8ClampedArray(u8.buffer);
  }
}

/**
 * Deserialize {@linkcode KvBigIntJSON} to a bigint.
 *
 * @param json The JSON representation of the key part.
 * @returns The deserialized key part.
 * @example Deserialize a key part from JSON
 *
 * ```ts
 * import { toKeyPart } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "bigint", value: "100" } as const;
 * const keyPart = toKeyPart(json);
 * assertEquals(keyPart, 100n);
 * ```
 */
export function toKeyPart(json: KvBigIntJSON): bigint;
/**
 * Deserialize {@linkcode KvBooleanJSON} to a boolean.
 *
 * @param json The JSON representation of the key part.
 * @returns The deserialized key part.
 * @example Deserialize a key part from JSON
 *
 * ```ts
 * import { toKeyPart } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "boolean", value: true } as const;
 * const keyPart = toKeyPart(json);
 * assertEquals(keyPart, true);
 * ```
 */
export function toKeyPart(json: KvBooleanJSON): boolean;
/**
 * Deserialize {@linkcode KvNumberJSON} to a number.
 *
 * @param json The JSON representation of the key part.
 * @returns The deserialized key part.
 * @example Deserialize a key part from JSON
 *
 * ```ts
 * import { toKeyPart } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "number", value: 100 } as const;
 * const keyPart = toKeyPart(json);
 * assertEquals(keyPart, 100);
 * ```
 */
export function toKeyPart(json: KvNumberJSON): number;
/**
 * Deserialize {@linkcode KvStringJSON} to a string.
 *
 * @param json The JSON representation of the key part.
 * @returns The deserialized key part.
 * @example Deserialize a key part from JSON
 *
 * ```ts
 * import { toKeyPart } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "string", value: "abc" } as const;
 * const keyPart = toKeyPart(json);
 * assertEquals(keyPart, "abc");
 * ```
 */
export function toKeyPart(json: KvStringJSON): string;
/**
 * Deserialize {@linkcode KvUint8ArrayJSON} to a {@linkcode Uint8Array}.
 *
 * @param json The JSON representation of the key part.
 * @returns The deserialized key part.
 * @example Deserialize a key part from JSON
 *
 * ```ts
 * import { toKeyPart } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "Uint8Array", value: "AQID" } as const;
 * const keyPart = toKeyPart(json);
 * assertEquals(keyPart, new Uint8Array([1, 2, 3]));
 * ```
 */
export function toKeyPart(json: KvUint8ArrayJSON): Uint8Array;
/**
 * Deserialize {@linkcode KvKeyPartJSON} to a {@linkcode Deno.KvKeyPart}.
 *
 * @param json The JSON representation of the key part.
 * @returns The deserialized key part.
 * @example Deserialize a key part from JSON
 *
 * ```ts
 * import { toKeyPart } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "bigint", value: "100" } as const;
 * const keyPart = toKeyPart(json);
 * assertEquals(keyPart, 100n);
 * ```
 */
export function toKeyPart(json: KvKeyPartJSON): Deno.KvKeyPart;
export function toKeyPart(json: KvKeyPartJSON): Deno.KvKeyPart {
  switch (json.type) {
    case "Uint8Array":
      return decodeBase64Url(json.value);
    case "bigint":
      return BigInt(json.value);
    case "boolean":
    case "string":
      return json.value;
    case "number":
      if (json.value === "Infinity") {
        return Infinity;
      }
      if (json.value === "-Infinity") {
        return -Infinity;
      }
      if (json.value === "NaN") {
        return NaN;
      }
      return json.value;
    default:
      // deno-lint-ignore no-explicit-any
      throw new TypeError(`Unexpected key part type: "${(json as any).type}".`);
  }
}

/**
 * Deserialize {@linkcode KvKeyJSON} to a {@linkcode Deno.KvKey}.
 *
 * @param json The JSON representation of the key.
 * @returns The deserialized key.
 * @example Deserialize a key from JSON
 *
 * ```ts
 * import { toKey } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = [
 *   { "type": "string", "value": "a" },
 *   { "type": "bigint", "value": "100" }
 * ] as const;
 * const key = toKey(json);
 * assertEquals(key, ["a", 100n]);
 * ```
 */
export function toKey(json: KvKeyJSON): Deno.KvKey {
  return json.map(toKeyPart);
}

/**
 * Deserialize {@linkcode KvArrayBufferJSON} to an {@linkcode ArrayBuffer} which
 * can be stored in a Deno KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "ArrayBuffer", value: "AQID" } as const;
 * const value = toValue(json);
 * assertEquals(value, new Uint8Array([1, 2, 3]).buffer);
 * ```
 */
export function toValue(json: KvArrayBufferJSON): ArrayBuffer;
/**
 * Deserialize {@linkcode KvArrayJSON} to an array which can be stored in a Deno
 * KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "Array", value: [ { type: "number", value: 1 } ] } as const;
 * const value = toValue(json);
 * assertEquals(value, [1]);
 * ```
 */
export function toValue(json: KvArrayJSON): unknown[];
/**
 * Deserialize {@linkcode KvBigIntJSON} to a bigint which can be stored in a
 * Deno KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "bigint", value: "100" } as const;
 * const value = toValue(json);
 * assertEquals(value, 100n);
 * ```
 */
export function toValue(json: KvBigIntJSON): bigint;
/**
 * Deserialize {@linkcode KvBooleanJSON} to a boolean which can be stored in a
 * Deno KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "boolean", value: true } as const;
 * const value = toValue(json);
 * assertEquals(value, true);
 * ```
 */
export function toValue(json: KvBooleanJSON): boolean;
/**
 * Deserialize {@linkcode KvDataViewJSON} to a {@linkcode DataView} which can
 * be stored in a Deno KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "DataView", value: "AQID" } as const;
 * const value = toValue(json);
 * assertEquals(value, new DataView(new Uint8Array([1, 2, 3]).buffer));
 * ```
 */
export function toValue(json: KvDataViewJSON): DataView;
/**
 * Deserialize {@linkcode KvDateJSON} to a {@linkcode Date} which can be stored
 * in a Deno KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "Date", value: "2023-12-16T17:24:00.000Z" } as const;
 * const value = toValue(json);
 * assertEquals(value, new Date("2023-12-16T17:24:00.000Z"));
 * ```
 */
export function toValue(json: KvDateJSON): Date;
/**
 * Deserialize {@linkcode KvErrorJSON} to an error value which can be stored in
 * a Deno KV store.
 *
 * @typeParam ErrorType The type of error that can be deserialized
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assert } from "@std/assert";
 *
 * const json = {
 *   type: "TypeError",
 *   value: { message: "an error", stack: `Line\nLine` },
 * } as const;
 * const value = toValue(json);
 * assert(value instanceof TypeError);
 * ```
 */
export function toValue<ErrorType extends CloneableErrorTypes>(
  json: KvErrorJSON<ErrorType>,
): CloneableErrors[ErrorType];
/**
 * Deserialize {@linkcode KvKvU64JSON} to a {@linkcode Deno.KvU64} which can be
 * stored in a Deno KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "KvU64", value: "100" } as const;
 * const value = toValue(json);
 * assertEquals(value, new Deno.KvU64(100n));
 * ```
 */
export function toValue(json: KvKvU64JSON): Deno.KvU64;
/**
 * Deserialize {@linkcode KvMapJSON} to a {@linkcode Map} which can be stored in
 * a Deno KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const value = toValue({ type: "Map", value: [
 *   [{ type: "string", value: "a" }, { type: "string", value: "b" }]
 * ] });
 * assertEquals(value, new Map([["a", "b"]]));
 * ```
 */
export function toValue(json: KvMapJSON): Map<unknown, unknown>;
/**
 * Deserialize {@linkcode KvNullJSON} to a `null` which can be stored in a Deno
 * KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assert } from "@std/assert";
 *
 * const json = { type: "null", value: null } as const;
 * const value = toValue(json);
 * assert(value === null);
 * ```
 */
export function toValue(json: KvNullJSON): null;
/**
 * Deserialize {@linkcode KvNumberJSON} to a number which can be stored in a
 * Deno KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "number", value: 100 } as const;
 * const value = toValue(json);
 * assertEquals(value, 100);
 * ```
 */
export function toValue(json: KvNumberJSON): number;
/**
 * Deserialize {@linkcode KvObjectJSON} to a value which can be stored in a Deno
 * KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = {
 *   type: "object",
 *   value: { a: { type: "string", value: "b" } }
 * } as const;
 * const value = toValue(json);
 * assertEquals(value, { a: "b" });
 * ```
 */
export function toValue(json: KvObjectJSON): Record<string, unknown>;
/**
 * Deserialize {@linkcode KvRegExpJSON} to a {@linkcode RegExp} which can be
 * stored in a Deno KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assert } from "@std/assert";
 *
 * const json = { type: "RegExp", value: "/abc/i" } as const;
 * const value = toValue(json);
 * assert(value instanceof RegExp);
 * ```
 */
export function toValue(json: KvRegExpJSON): RegExp;
/**
 * Deserialize {@linkcode KvSetJSON} to a {@linkcode Set} which can be stored in
 * a Deno KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "Set", value: [{ type: "string", value: "a" }] } as const;
 * const value = toValue(json);
 * assertEquals(value, new Set(["a"]));
 * ```
 */
export function toValue(json: KvSetJSON): Set<unknown>;
/**
 * Deserialize {@linkcode KvStringJSON} to a string which can be stored in a
 * Deno KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "string", value: "value" } as const;
 * const value = toValue(json);
 * assertEquals(value, "value");
 * ```
 */
export function toValue(json: KvStringJSON): string;
/**
 * Deserialize {@linkcode KvTypedArrayJSON} to a typed array which can be stored
 * in a Deno KV store.
 *
 * @typeParam ArrayType The type of the typed array, which is inferred from the
 * value.
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "Uint8Array", value: "AQID" } as const;
 * const value = toValue(json);
 * assertEquals(value, new Uint8Array([1, 2, 3]));
 * ```
 */
export function toValue<ArrayType extends TypedArrayTypes>(
  json: KvTypedArrayJSON<ArrayType>,
): TypedArrayMap[ArrayType];
/**
 * Deserialize {@linkcode KvUndefinedJSON} to `undefined` which can be stored in
 * a Deno KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assert } from "@std/assert";
 *
 * const json = { type: "undefined" } as const;
 * const value = toValue(json);
 * assert(value === undefined);
 * ```
 */
export function toValue(json: KvUndefinedJSON): undefined;
/**
 * Deserialize {@linkcode KvValueJSON} to a value which can be stored in a Deno
 * KV store.
 *
 * @param json The JSON representation of the value.
 * @returns The deserialized value.
 * @example Deserialize a value from JSON
 *
 * ```ts
 * import { toValue } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = { type: "string", value: "value" } as const;
 * const value = toValue(json);
 * assertEquals(value, "value");
 * ```
 */
export function toValue(json: KvValueJSON): unknown;
export function toValue(json: KvValueJSON): unknown {
  switch (json.type) {
    case "Array":
      return json.value.map(toValue);
    case "Map":
      return new Map(json.value.map((
        [key, value]: [KvValueJSON, KvValueJSON],
      ) => [toValue(key), toValue(value)]) as [unknown, unknown][]);
    case "object":
      return decodeObject(json.value);
    case "Set":
      return new Set(json.value.map(toValue));
    case "null":
      return json.value;
    case "ArrayBuffer":
      return decodeBase64Url(json.value).buffer;
    case "BigInt64Array":
    case "BigUint64Array":
    case "Float32Array":
    case "Float64Array":
    case "Int16Array":
    case "Int32Array":
    case "Int8Array":
    case "Uint16Array":
    case "Uint32Array":
    case "Uint8Array":
    case "Uint8ClampedArray":
      return toTypedArray(json);
    case "DataView":
      return new DataView(decodeBase64Url(json.value).buffer);
    case "Date":
      return new Date(json.value);
    case "Error":
    case "EvalError":
    case "RangeError":
    case "ReferenceError":
    case "SyntaxError":
    case "TypeError":
    case "URIError":
      return toError(json);
    case "KvU64":
      return new Deno.KvU64(BigInt(json.value));
    case "RegExp": {
      const parts = json.value.split("/");
      const flags = parts.pop();
      const [, ...pattern] = parts;
      return new RegExp(pattern.join("/"), flags);
    }
    case "bigint":
    case "boolean":
    case "number":
    case "string":
      return toKeyPart(json);
    case "undefined":
      return undefined;
    default:
      // deno-lint-ignore no-explicit-any
      throw new TypeError(`Unexpected value type: "${(json as any).type}"`);
  }
}

/**
 * Deserialize a {@linkcode KvEntryJSON} to a {@linkcode Deno.KvEntry}.
 *
 * @typeParam T The type of the value of the entry.
 * @param entry The entry to deserialize.
 * @returns The deserialized entry.
 * @example Deserialize an entry from JSON
 *
 * ```ts
 * import { toEntry } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = {
 *   key: [ { type: "string", value: "a" } ],
 *   value: { type: "string", value: "b" },
 *   versionstamp: "00000123456789abcdef",
 * } as const;
 * const entry = toEntry(json);
 * assertEquals(entry, {
 *   key: ["a"],
 *   value: "b",
 *   versionstamp: "00000123456789abcdef",
 * });
 * ```
 */
export function toEntry<T>(entry: KvEntryJSON): Deno.KvEntry<T> {
  const { key, value, versionstamp } = entry;
  return {
    key: key.map(toKeyPart),
    value: toValue(value) as T,
    versionstamp,
  };
}

/**
 * Deserialize a {@linkcode KvEntryMaybeJSON} to a
 * {@linkcode Deno.KvEntryMaybe}.
 *
 * @typeParam T The type of the value of the entry.
 * @param maybeEntry The entry to deserialize.
 * @returns The deserialized entry.
 * @example Deserialize an entry maybe from JSON
 *
 * ```ts
 * import { toEntryMaybe } from "@std/kv/json";
 * import { assertEquals } from "@std/assert";
 *
 * const json = {
 *   key: [ { type: "string", value: "a" } ],
 *   value: null,
 *   versionstamp: null,
 * } as const;
 * const maybeEntry = toEntryMaybe(json);
 * assertEquals(maybeEntry, {
 *   key: ["a"],
 *   value: null,
 *   versionstamp: null,
 * });
 * ```
 */
export function toEntryMaybe<T>(
  maybeEntry: KvEntryMaybeJSON,
): Deno.KvEntryMaybe<T> {
  const { key, value, versionstamp } = maybeEntry;
  return {
    key: key.map(toKeyPart),
    value: value === null ? null : toValue(value),
    versionstamp,
  } as Deno.KvEntryMaybe<T>;
}
