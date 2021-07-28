/** Deep merge options */
interface deepMergeOptions {
  /** Merging strategy for arrays */
  arrays?:"replace"|"concat",
  /** Merging strategy for Maps */
  maps?:"replace"|"concat",
  /** Merging strategy for Sets */
  sets?:"replace"|"concat",
  /** Whether to include non enumerable properties */
  includeNonEnumerable?:boolean
}

/**
 * Merges the two given Records, recursively merging any nested Records with the second collection overriding the first in case of conflict
 *
 * For arrays, maps and sets, a merging strategy can be specified to either "replace" values, or "concat" them instead.
 * Use "includeNonEnumerable" option to include non enumerable properties too.
 */
export function deepMerge<T extends Record<keyof any, unknown>>(collection: Partial<T>, other: Partial<T>, options?:deepMergeOptions): T
export function deepMerge<T extends Record<keyof any, unknown>, U extends Record<keyof unknown, unknown>>(collection: T, other: U, options?:deepMergeOptions): T & U
export function deepMerge(collection:any, other:any, {arrays = "replace", maps = "replace", sets = "replace", includeNonEnumerable = false} = {}) {

  //Extract property and symbols
  const keys = [...Object.getOwnPropertyNames(other), ...Object.getOwnPropertySymbols(other)].filter(key => includeNonEnumerable || other.propertyIsEnumerable(key))

  //Iterate through each key of other object and use correct merging strategy
  for (const key of keys) {
    const a = collection[key], b = other[key]

    //Handle arrays
    if ((Array.isArray(a))&&(Array.isArray(b))) {
      if (arrays === "concat")
        collection[key] = a.concat(...b)
      else
        collection[key] = b
      continue
    }

    //Handle maps
    if ((a instanceof Map)&&(b instanceof Map)) {
      if (maps === "concat") {
        for (const [k, v] of b.entries())
          a.set(k, v)
      }
      else
        collection[key] = b
      continue
    }

    //Handle sets
    if ((a instanceof Set)&&(b instanceof Set)) {
      if (sets === "concat") {
        for (const v of b.values())
          a.add(v)
      }
      else
        collection[key] = b
      continue
    }

    //Recursively merge mergeable objects
    if (isMergeable(a) && isMergeable(b)) {
      collection[key] = deepMerge(collection[key] ?? {}, b)
      continue
    }

    //Override value
    collection[key] = b
  }

  return collection
}

/**
 * Test whether a value is mergeable or not
 * Builtins object like, null and user classes are not considered mergeable
 */
function isMergeable(value:unknown) {
  //Ignore null
  if (value === null)
    return false
  //Ignore builtins
  if ((value instanceof RegExp)||(value instanceof Date))
    return false
  //Ignore classes
  if ((typeof value === "object")&&("constructor" in value!))
    return !/^class /.test(value.constructor.toString())
  return typeof value === "object"
}
