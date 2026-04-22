// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A map that associates each key with an ordered list of values.
 *
 * Unlike {@linkcode Map}, each key can hold multiple values. Values are stored
 * in insertion order, and duplicate values under the same key are preserved.
 *
 * Iterator methods ({@linkcode MultiMap.prototype.entries},
 * {@linkcode MultiMap.prototype.groups},
 * {@linkcode MultiMap.prototype.keys},
 * {@linkcode MultiMap.prototype.values}) return in constant time and iterate
 * lazily; fully draining them is linear in the total value count (or the
 * number of distinct keys, for {@linkcode MultiMap.prototype.keys}).
 *
 * | Method                                                      | Per-call time complexity         |
 * | ----------------------------------------------------------- | -------------------------------- |
 * | {@linkcode MultiMap.prototype.size}                         | Constant                         |
 * | {@linkcode MultiMap.prototype.valueCount}                   | Constant                         |
 * | {@linkcode MultiMap.prototype.add}                          | Amortized constant               |
 * | {@linkcode MultiMap.prototype.get}                          | Linear in the bucket size (copy) |
 * | {@linkcode MultiMap.prototype.has}                          | Constant                         |
 * | {@linkcode MultiMap.prototype.hasEntry}                     | Linear in the bucket size        |
 * | {@linkcode MultiMap.prototype.delete}                       | Constant                         |
 * | {@linkcode MultiMap.prototype.deleteEntry}                  | Linear in the bucket size        |
 * | {@linkcode MultiMap.prototype.clear}                        | Linear in the key count          |
 * | {@linkcode MultiMap.prototype.forEach}                      | Linear in the total value count  |
 * | {@linkcode MultiMap.prototype.toMap}                        | Linear in the total value count  |
 * | {@linkcode MultiMap.groupBy}                                | Linear in the number of items    |
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam K The type of the keys in the map.
 * @typeParam V The type of the values in the map.
 *
 * @example Usage
 * ```ts
 * import { MultiMap } from "@std/data-structures/unstable-multimap";
 * import { assertEquals } from "@std/assert";
 *
 * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
 *
 * assertEquals(map.get("a"), [1, 2]);
 * assertEquals(map.get("b"), [3]);
 * ```
 *
 * @example Preserves insertion order and duplicates
 * ```ts
 * import { MultiMap } from "@std/data-structures/unstable-multimap";
 * import { assertEquals } from "@std/assert";
 *
 * const map = new MultiMap<string, number>();
 * map.add("a", 2).add("a", 1).add("a", 2);
 *
 * assertEquals(map.get("a"), [2, 1, 2]);
 * assertEquals(map.size, 1);
 * ```
 */
export class MultiMap<K, V> implements Iterable<[K, V]> {
  #map = new Map<K, V[]>();
  #valueCount = 0;

  /**
   * Creates a new instance.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param entries An iterable of key-value pairs for the initial entries.
   * Duplicate values for the same key are preserved in insertion order.
   *
   * @example Creating an empty map
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap<string, number>();
   * assertEquals(map.size, 0);
   * ```
   *
   * @example Creating a map from an iterable
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
   * assertEquals(map.get("a"), [1, 2]);
   * ```
   */
  constructor(entries?: Iterable<readonly [K, V]> | null) {
    if (entries) {
      for (const [key, value] of entries) {
        this.add(key, value);
      }
    }
  }

  /**
   * The number of distinct keys in the map.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @returns The number of distinct keys in the map.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
   * assertEquals(map.size, 2);
   * ```
   */
  get size(): number {
    return this.#map.size;
  }

  /**
   * The total number of values stored across all keys, counting duplicates.
   *
   * In contrast to {@linkcode MultiMap.prototype.size} — which reports the
   * number of distinct keys, matching the `Map` convention — this counts
   * every individual value. Maintained in O(1): `add()` increments it,
   * `delete()` and `deleteEntry()` decrement it, and `clear()` resets it.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @returns The total number of values across all keys.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
   * assertEquals(map.size, 2);
   * assertEquals(map.valueCount, 3);
   *
   * map.add("a", 2);
   * assertEquals(map.valueCount, 4);
   *
   * map.deleteEntry("a", 1);
   * assertEquals(map.valueCount, 3);
   * ```
   */
  get valueCount(): number {
    return this.#valueCount;
  }

  /**
   * Appends a value to the list stored under the given key. Duplicate values
   * are preserved.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param key The key to add the value under.
   * @param value The value to append.
   * @returns The instance.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap<string, number>();
   * map.add("a", 1).add("a", 2);
   *
   * assertEquals(map.get("a"), [1, 2]);
   * ```
   */
  add(key: K, value: V): this {
    let list = this.#map.get(key);
    if (!list) {
      list = [];
      this.#map.set(key, list);
    }
    list.push(value);
    this.#valueCount++;
    return this;
  }

  /**
   * Returns a snapshot of the values associated with the given key, in
   * insertion order, or `undefined` if the key does not exist.
   *
   * The returned array is a fresh copy; mutating it does not affect the map,
   * and later mutations to the map are not reflected in it. For read-only
   * traversal across all keys, prefer {@linkcode MultiMap.prototype.groups}
   * to avoid the per-call copy.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param key The key to look up.
   * @returns A fresh array of values in insertion order, or `undefined`.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2]]);
   *
   * assertEquals(map.get("a"), [1, 2]);
   * assertEquals(map.get("b"), undefined);
   * ```
   */
  get(key: K): V[] | undefined {
    const list = this.#map.get(key);
    return list === undefined ? undefined : list.slice();
  }

  /**
   * Returns `true` if the key exists with at least one value.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param key The key to check.
   * @returns `true` if the key exists, `false` otherwise.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1]]);
   *
   * assertEquals(map.has("a"), true);
   * assertEquals(map.has("b"), false);
   * ```
   */
  has(key: K): boolean {
    return this.#map.has(key);
  }

  /**
   * Returns `true` if the `[key, value]` entry exists in the map (i.e. the
   * given value appears at least once under the given key).
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param key The key to look up.
   * @param value The value to check.
   * @returns `true` if the entry exists, `false` otherwise.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2]]);
   *
   * assertEquals(map.hasEntry("a", 1), true);
   * assertEquals(map.hasEntry("a", 3), false);
   * assertEquals(map.hasEntry("b", 1), false);
   * ```
   */
  hasEntry(key: K, value: V): boolean {
    // `Array.prototype.includes` uses SameValueZero, which matches the
    // hand-rolled loop in `deleteEntry()` (and the `Map`/`Set` contract) so
    // `NaN` and `±0` behave consistently across the two methods.
    return this.#map.get(key)?.includes(value) ?? false;
  }

  /**
   * Removes all values for the given key.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param key The key to remove.
   * @returns `true` if the key existed and was removed, `false` otherwise.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
   * assertEquals(map.delete("a"), true);
   * assertEquals(map.delete("a"), false);
   *
   * assertEquals(map.has("a"), false);
   * assertEquals(map.size, 1);
   * ```
   */
  delete(key: K): boolean {
    const list = this.#map.get(key);
    if (list === undefined) return false;
    this.#valueCount -= list.length;
    this.#map.delete(key);
    return true;
  }

  /**
   * Removes the first occurrence of the `[key, value]` entry from the map.
   * If the key's list becomes empty, the key is also removed.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param key The key to look up.
   * @param value The value to remove.
   * @returns `true` if an entry was removed, `false` otherwise.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["a", 1]]);
   *
   * assertEquals(map.deleteEntry("a", 1), true);
   * assertEquals(map.get("a"), [2, 1]);
   *
   * assertEquals(map.deleteEntry("a", 1), true);
   * assertEquals(map.get("a"), [2]);
   * ```
   */
  deleteEntry(key: K, value: V): boolean {
    const list = this.#map.get(key);
    if (!list) return false;
    // SameValueZero, matching `hasEntry()` / `Map` / `Set` semantics so that
    // `NaN` values can be removed. `Array.prototype.indexOf` uses strict
    // equality and would never match `NaN`.
    let index = -1;
    for (let i = 0; i < list.length; i++) {
      const v = list[i]!;
      if (v === value || (v !== v && value !== value)) {
        index = i;
        break;
      }
    }
    if (index === -1) return false;
    list.splice(index, 1);
    this.#valueCount--;
    if (list.length === 0) this.#map.delete(key);
    return true;
  }

  /**
   * Removes all entries.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["b", 2]]);
   * map.clear();
   *
   * assertEquals(map.size, 0);
   * ```
   */
  clear(): void {
    this.#map.clear();
    this.#valueCount = 0;
  }

  /**
   * Executes a provided function once for each individual value in the map,
   * in insertion order of keys and values.
   *
   * Within a bucket, the set of values to visit is fixed at the time the
   * bucket is entered, so a callback that mutates the current key's list
   * (via `add()` or `deleteEntry()`) will not extend or shift the visit.
   * Cross-bucket mutations during iteration (adding or deleting other keys)
   * are not supported and may skip or repeat keys.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @typeParam T The type of `this` when calling the callback.
   * @param callbackfn The function to call for each value.
   * @param thisArg Value to use as `this` when executing `callbackfn`.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
   * const result: [string, number][] = [];
   * map.forEach((value, key) => result.push([key, value]));
   *
   * assertEquals(result, [["a", 1], ["a", 2], ["b", 3]]);
   * ```
   *
   * @example With `thisArg`
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
   * const counter = { total: 0 };
   * map.forEach(function (value) {
   *   this.total += value;
   * }, counter);
   *
   * assertEquals(counter.total, 6);
   * ```
   */
  forEach<T = undefined>(
    callbackfn: (this: T, value: V, key: K, map: this) => void,
    thisArg?: T,
  ): void {
    if (typeof callbackfn !== "function") {
      throw new TypeError(
        `Cannot call MultiMap.prototype.forEach: "callbackfn" is not a function: received ${typeof callbackfn}`,
      );
    }
    // The bucket is snapshotted before the inner loop so mutations to the
    // current key's list (e.g. a callback calling `add()` or splicing via
    // `deleteEntry()`) do not extend, truncate, or shift the visit. This
    // mirrors the per-bucket contract of `Map.prototype.forEach`.
    for (const [key, list] of this.#map) {
      const snapshot = list.slice();
      for (let i = 0; i < snapshot.length; i++) {
        callbackfn.call(thisArg as T, snapshot[i]!, key, this);
      }
    }
  }

  /**
   * Returns an iterator of all `[key, value]` pairs, with each value yielded
   * individually across all keys, in insertion order.
   *
   * Mutating the map during iteration is not supported and may skip or repeat
   * entries.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @returns An iterator of `[key, value]` pairs.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
   *
   * assertEquals(Array.from(map.entries()), [["a", 1], ["a", 2], ["b", 3]]);
   * ```
   */
  entries(): IterableIterator<[K, V]> {
    // Hand-rolled iterator rather than a generator to avoid per-yield
    // generator-frame overhead (measured 2–4× advantage on flattened
    // iteration). `groups()` and `values()` follow the same pattern for
    // consistency. The bucket is snapshotted on first entry so mutations
    // to the current bucket during iteration (including `delete()` of the
    // current key) do not extend, truncate, or shift the visit.
    const outer = this.#map[Symbol.iterator]();
    let currentKey!: K;
    let currentList: V[] | null = null;
    let innerIndex = 0;
    const iter: IterableIterator<[K, V]> = {
      next(): IteratorResult<[K, V]> {
        while (true) {
          if (currentList !== null && innerIndex < currentList.length) {
            return {
              value: [currentKey, currentList[innerIndex++]!],
              done: false,
            };
          }
          const outerResult = outer.next();
          if (outerResult.done) {
            currentList = null;
            return { value: undefined, done: true };
          }
          currentKey = outerResult.value[0];
          currentList = outerResult.value[1].slice();
          innerIndex = 0;
        }
      },
      [Symbol.iterator]() {
        return this;
      },
    };
    return iter;
  }

  /**
   * Returns an iterator of `[key, values]` pairs, where `values` is the list
   * of values associated with that key in insertion order.
   *
   * Use this when you need both the key and its full value list, for example
   * to filter by bucket size. For individual `[key, value]` pairs, use
   * {@linkcode MultiMap.prototype.entries}.
   *
   * Each yielded array is a fresh snapshot; mutating it does not affect the
   * map, and later mutations to the map are not reflected in it. Mutating the
   * map during iteration is not supported and may skip or repeat buckets.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @returns An iterator of `[key, values]` pairs.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
   *
   * assertEquals(Array.from(map.groups()), [["a", [1, 2]], ["b", [3]]]);
   * ```
   *
   * @example Filter by bucket size
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
   * const collisions: string[] = [];
   * for (const [key, values] of map.groups()) {
   *   if (values.length > 1) collisions.push(key);
   * }
   *
   * assertEquals(collisions, ["a"]);
   * ```
   */
  groups(): IterableIterator<[K, V[]]> {
    // Hand-rolled for consistency with `entries()` / `values()`. See
    // `entries()` for the rationale. One yield per bucket (no inner loop).
    const outer = this.#map[Symbol.iterator]();
    const iter: IterableIterator<[K, V[]]> = {
      next(): IteratorResult<[K, V[]]> {
        const outerResult = outer.next();
        if (outerResult.done) return { value: undefined, done: true };
        return {
          value: [outerResult.value[0], outerResult.value[1].slice()],
          done: false,
        };
      },
      [Symbol.iterator]() {
        return this;
      },
    };
    return iter;
  }

  /**
   * Returns an iterator of all distinct keys in the map, in insertion order.
   *
   * Mutating the map during iteration is not supported and may skip or repeat
   * keys.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @returns An iterator of keys.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
   *
   * assertEquals(Array.from(map.keys()), ["a", "b"]);
   * ```
   */
  keys(): IterableIterator<K> {
    // Delegates to the underlying `Map.prototype.keys()` (a native
    // `MapIterator`); no per-bucket work is needed, so wrapping it in a
    // hand-rolled iterator would be pure overhead.
    return this.#map.keys();
  }

  /**
   * Returns an iterator of all individual values across all keys, in insertion
   * order.
   *
   * Mutating the map during iteration is not supported and may skip or repeat
   * values.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @returns An iterator of values.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
   *
   * assertEquals(Array.from(map.values()), [1, 2, 3]);
   * ```
   */
  values(): IterableIterator<V> {
    // Hand-rolled for consistency with `entries()` / `groups()`. See
    // `entries()` for the rationale. The bucket is snapshotted on first
    // entry so mutations to the current bucket during iteration do not
    // extend, truncate, or shift the visit.
    const outer = this.#map.values();
    let currentList: V[] | null = null;
    let innerIndex = 0;
    const iter: IterableIterator<V> = {
      next(): IteratorResult<V> {
        while (true) {
          if (currentList !== null && innerIndex < currentList.length) {
            return { value: currentList[innerIndex++]!, done: false };
          }
          const outerResult = outer.next();
          if (outerResult.done) {
            currentList = null;
            return { value: undefined, done: true };
          }
          currentList = outerResult.value.slice();
          innerIndex = 0;
        }
      },
      [Symbol.iterator]() {
        return this;
      },
    };
    return iter;
  }

  /**
   * Returns a new {@linkcode Map} snapshot of the multimap, with each key
   * mapped to a fresh array of its values in insertion order.
   *
   * The returned map and its value arrays are owned by the caller; mutating
   * them does not affect the multimap, and later mutations to the multimap
   * are not reflected in the snapshot. This is the natural inverse of
   * {@linkcode MultiMap.groupBy} and the `Map.groupBy` builtin.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @returns A new `Map<K, V[]>` snapshot.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
   *
   * assertEquals(map.toMap(), new Map([["a", [1, 2]], ["b", [3]]]));
   * ```
   */
  toMap(): Map<K, V[]> {
    const result = new Map<K, V[]>();
    for (const [key, list] of this.#map) {
      result.set(key, list.slice());
    }
    return result;
  }

  /**
   * Returns an iterator of all `[key, value]` pairs, with each value yielded
   * individually. The map is not modified. Same as
   * {@linkcode MultiMap.prototype.entries}.
   *
   * Mutating the map while iterating is not supported and may skip or repeat
   * entries.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @returns An iterator of `[key, value]` pairs.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
   *
   * assertEquals(Array.from(map), [["a", 1], ["a", 2], ["b", 3]]);
   * ```
   */
  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }

  /**
   * A string tag for the class, used by `Object.prototype.toString()`.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new MultiMap();
   * assertEquals(map[Symbol.toStringTag], "MultiMap");
   * ```
   */
  readonly [Symbol.toStringTag] = "MultiMap" as const;

  /**
   * Custom output for {@linkcode Deno.inspect}, rendering the multimap as
   * `MultiMap(size) { key => [values], ... }`. Each key and bucket is
   * inspected via the provided `inspect` callback so caller-configured
   * `options` (colors, depth, circular detection) are honored.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param inspect Internal inspect function.
   * @param options Inspect options forwarded from the host.
   * @returns The string representation of the multimap.
   *
   * @example Usage
   * ```ts ignore
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   *
   * const map = new MultiMap([["a", 1], ["a", 2], ["b", 3]]);
   * console.log(map);
   * ```
   */
  [Symbol.for("Deno.customInspect")](
    inspect: (value: unknown, options: unknown) => string,
    options: unknown,
  ): string {
    const size = this.#map.size;
    if (size === 0) return `MultiMap(0) {}`;
    const parts: string[] = [];
    for (const [key, list] of this.#map) {
      parts.push(`${inspect(key, options)} => ${inspect(list, options)}`);
    }
    return `MultiMap(${size}) { ${parts.join(", ")} }`;
  }

  /**
   * Groups items from an iterable by the result of `keyFn`, returning a new
   * multimap. Mirrors the shape of
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/groupBy | `Map.groupBy`},
   * but returns a {@linkcode MultiMap} so further mutation is supported.
   *
   * Item order is preserved within each bucket.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @typeParam K The type of the keys produced by `keyFn`.
   * @typeParam T The type of the items in `items`.
   * @param items The items to group.
   * @param keyFn A function called for each item with the item and its
   * zero-based index; its return value is the bucket key.
   * @returns A new `MultiMap` of grouped items.
   *
   * @example Usage
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const users = [
   *   { name: "Ada", role: "admin" },
   *   { name: "Bo", role: "user" },
   *   { name: "Cy", role: "admin" },
   * ];
   *
   * const byRole = MultiMap.groupBy(users, (u) => u.role);
   *
   * assertEquals(byRole.get("admin"), [
   *   { name: "Ada", role: "admin" },
   *   { name: "Cy", role: "admin" },
   * ]);
   * assertEquals(byRole.get("user"), [{ name: "Bo", role: "user" }]);
   * ```
   *
   * @example The key function receives the item index
   * ```ts
   * import { MultiMap } from "@std/data-structures/unstable-multimap";
   * import { assertEquals } from "@std/assert";
   *
   * const grouped = MultiMap.groupBy(
   *   ["a", "b", "c", "d"],
   *   (item, index) => index < 2 ? "first-half" : "second-half",
   * );
   *
   * assertEquals(grouped.get("first-half"), ["a", "b"]);
   * assertEquals(grouped.get("second-half"), ["c", "d"]);
   * ```
   */
  static groupBy<K, T>(
    items: Iterable<T>,
    keyFn: (item: T, index: number) => K,
  ): MultiMap<K, T> {
    if (typeof keyFn !== "function") {
      throw new TypeError(
        `Cannot call MultiMap.groupBy: "keyFn" is not a function: received ${typeof keyFn}`,
      );
    }
    const map = new MultiMap<K, T>();
    let index = 0;
    for (const item of items) {
      map.add(keyFn(item, index++), item);
    }
    return map;
  }
}
