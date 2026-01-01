// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * An extension of {@linkcode Map} that allows lookup by both key and value.
 *
 * Keys and values must be unique. Setting an existing key updates its value.
 * Setting an existing value updates its key.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam K The type of the keys in the map.
 * @typeParam V The type of the values in the map.
 *
 * @example Usage
 * ```ts
 * import { BidirectionalMap } from "@std/data-structures/unstable-bidirectional-map";
 * import { assertEquals } from "@std/assert";
 *
 * const map = new BidirectionalMap([["one", 1]]);
 *
 * assertEquals(map.get("one"), 1);
 * assertEquals(map.getReverse(1), "one");
 * ```
 *
 * @example Inserting a value that already exists
 * ```ts
 * import { BidirectionalMap } from "@std/data-structures/unstable-bidirectional-map";
 * import { assertEquals } from "@std/assert";
 *
 * const map = new BidirectionalMap();
 * map.set(1, "one");
 * map.set(2, "one");
 *
 * assertEquals(map.size, 1);
 * assertEquals(map.get(1), undefined);
 * assertEquals(map.getReverse("one"), 2);
 * ```
 */
export class BidirectionalMap<K, V> extends Map<K, V> {
  #reverseMap: Map<V, K>;

  /**
   * Creates a new instance.
   *
   * @param entries An iterable of key-value pairs for the initial entries.
   */
  constructor(entries?: Iterable<readonly [K, V]> | null) {
    super();
    this.#reverseMap = new Map<V, K>();
    if (entries) {
      for (const [key, value] of entries) {
        this.set(key, value);
      }
    }
  }

  /**
   * Clears all entries.
   *
   * @example Usage
   * ```ts
   * import { BidirectionalMap } from "@std/data-structures/unstable-bidirectional-map";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new BidirectionalMap([["one", 1]]);
   * map.clear();
   * assertEquals(map.size, 0);
   * ```
   */
  override clear() {
    super.clear();
    this.#reverseMap.clear();
  }

  /**
   * Adds a new element with a specified key and value. If an entry with the
   * same key or value already exists, the entry will be updated.
   *
   * @param key The key to set.
   * @param value The value to associate with the key.
   *
   * @returns The instance.
   *
   * @example Usage
   * ```ts
   * import { BidirectionalMap } from "@std/data-structures/unstable-bidirectional-map";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new BidirectionalMap();
   * map.set("one", 1);
   *
   * assertEquals(map.get("one"), 1);
   * assertEquals(map.getReverse(1), "one");
   * ```
   */
  override set(key: K, value: V): this {
    if (super.has(key)) {
      this.#reverseMap.delete(super.get(key)!);
    }
    if (this.#reverseMap.has(value)) {
      super.delete(this.#reverseMap.get(value)!);
    }
    super.set(key, value);
    this.#reverseMap.set(value, key);
    return this;
  }

  /**
   * Returns the key associated with the specified value. If no key is
   * associated with the specified value, `undefined` is returned.
   *
   * @param value The value to search for.
   * @returns The key associated with the specified value, or `undefined` if no
   * key is found.
   *
   * @example Usage
   * ```ts
   * import { BidirectionalMap } from "@std/data-structures/unstable-bidirectional-map";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new BidirectionalMap([["one", 1]]);
   *
   * assertEquals(map.getReverse(1), "one");
   * ```
   */
  getReverse(value: V): K | undefined {
    return this.#reverseMap.get(value);
  }

  /**
   * Removes the element with the specified key. If the element does not exist,
   * the instance remains unchanged.
   *
   * @param key The key of the element to remove.
   *
   * @returns `true` if an element in the instance existed and has been removed,
   * or `false` if the element does not exist.
   *
   * @example Usage
   * ```ts
   * import { BidirectionalMap } from "@std/data-structures/unstable-bidirectional-map";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new BidirectionalMap([["one", 1]]);
   * map.delete("one");
   *
   * assertEquals(map.size, 0);
   * ```
   */
  override delete(key: K): boolean {
    if (!super.has(key)) return false;
    const value = super.get(key)!;
    return super.delete(key) && this.#reverseMap.delete(value);
  }

  /**
   * Removes the element with the specified value. If the element does not
   * exist, the instance remains unchanged.
   *
   * @param value The value of the element to remove.
   * @returns `true` if an element in the instance existed and has been removed,
   * or `false` if the element does not exist.
   *
   * @example Usage
   * ```ts
   * import { BidirectionalMap } from "@std/data-structures/unstable-bidirectional-map";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new BidirectionalMap([["one", 1]]);
   *
   * map.deleteReverse(1);
   *
   * assertEquals(map.get("one"), undefined);
   * assertEquals(map.getReverse(1), undefined);
   * assertEquals(map.size, 0);
   * ```
   */
  deleteReverse(value: V): boolean {
    if (!this.#reverseMap.has(value)) return false;
    const key = this.#reverseMap.get(value)!;
    return super.delete(key) && this.#reverseMap.delete(value);
  }

  /**
   * Checks if an element with the specified value exists.
   *
   * @param value The value to search for.
   *
   * @returns `true` if an element with the specified value exists, otherwise
   * `false`.
   *
   * @example Usage
   * ```ts
   * import { BidirectionalMap } from "@std/data-structures/unstable-bidirectional-map";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new BidirectionalMap([["one", 1]]);
   *
   * assertEquals(map.hasReverse(1), true);
   * ```
   */
  hasReverse(value: V): boolean {
    return this.#reverseMap.has(value);
  }

  /**
   * A String value that is used in the creation of the default string description of an object.
   * Called by the built-in method `Object.prototype.toString`.
   *
   * @example Usage
   * ```ts
   * import { BidirectionalMap } from "@std/data-structures/unstable-bidirectional-map";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new BidirectionalMap();
   * assertEquals(map.toString(), "[object BidirectionalMap]");
   * ```
   */
  override readonly [Symbol.toStringTag] = "BidirectionalMap";
}
