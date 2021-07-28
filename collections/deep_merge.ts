/** Deep merge options */
interface deepMergeOptions {
  /** Merging strategy for arrays */
  arrays?: "replace" | "concat";
  /** Merging strategy for Maps */
  maps?: "replace" | "concat";
  /** Merging strategy for Sets */
  sets?: "replace" | "concat";
  /** Whether to include non enumerable properties */
  includeNonEnumerable?: boolean;
}

//TypeScript does not support 'symbol' as index type currently though it's perfectly valid
//deno-lint-ignore no-explicit-any
type propertyKey = any;

/**
 * Merges the two given Records, recursively merging any nested Records with the second collection overriding the first in case of conflict
 *
 * For arrays, maps and sets, a merging strategy can be specified to either "replace" values, or "concat" them instead.
 * Use "includeNonEnumerable" option to include non enumerable properties too.
 */
export function deepMerge<
  T extends Record<PropertyKey, unknown>,
  U extends Record<PropertyKey, unknown>,
>(
  collection: T,
  other: U,
  {
    arrays = "replace",
    maps = "replace",
    sets = "replace",
    includeNonEnumerable = false,
  }: deepMergeOptions = {},
): T & U {
  //Extract property and symbols
  const keys = [
    ...Object.getOwnPropertyNames(other),
    ...Object.getOwnPropertySymbols(other),
  ].filter((key) => includeNonEnumerable || other.propertyIsEnumerable(key));

  //Iterate through each key of other object and use correct merging strategy
  for (const key of keys as propertyKey[]) {
    const a = collection[key], b = other[key];

    //Handle arrays
    if ((Array.isArray(a)) && (Array.isArray(b))) {
      if (arrays === "concat") {
        collection[key] = a.concat(...b);
      } else {
        collection[key] = b;
      }
      continue;
    }

    //Handle maps
    if ((a instanceof Map) && (b instanceof Map)) {
      if (maps === "concat") {
        for (const [k, v] of b.entries()) {
          a.set(k, v);
        }
      } else {
        collection[key] = b;
      }
      continue;
    }

    //Handle sets
    if ((a instanceof Set) && (b instanceof Set)) {
      if (sets === "concat") {
        for (const v of b.values()) {
          a.add(v);
        }
      } else {
        collection[key] = b;
      }
      continue;
    }

    //Recursively merge mergeable objects
    if (isMergeable<T | U>(a) && isMergeable<T | U>(b)) {
      collection[key] = deepMerge(a ?? {}, b);
      continue;
    }

    //Override value
    collection[key] = b;
  }

  return collection as T & U;
}

/**
 * Test whether a value is mergeable or not
 * Builtins object like, null and user classes are not considered mergeable
 */
function isMergeable<T>(value: unknown): value is T {
  //Ignore null
  if (value === null) {
    return false;
  }
  //Ignore builtins
  if (
    (value instanceof RegExp) || (value instanceof Date) ||
    (value instanceof Array)
  ) {
    return false;
  }
  //Ignore classes
  if ((typeof value === "object") && ("constructor" in value!)) {
    return !/^class /.test(value.constructor.toString());
  }
  return typeof value === "object";
}
