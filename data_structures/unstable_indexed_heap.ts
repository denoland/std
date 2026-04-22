// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** Allows the class to mutate priority internally. */
interface MutableEntry<K> {
  readonly key: K;
  priority: number;
}

/**
 * A key-priority pair returned by {@linkcode IndexedHeap} methods.
 *
 * Fields are `readonly` to signal that mutating a returned entry has no
 * effect on the heap.
 *
 * @typeParam K The type of the key.
 */
export interface HeapEntry<K> {
  /** The key that identifies this entry in the heap. */
  readonly key: K;
  /** The numeric priority of this entry (smaller = higher priority). */
  readonly priority: number;
}

/**
 * Read-only view of an {@linkcode IndexedHeap}. Exposes query and
 * iteration methods, hiding all methods that modify the heap. Follows
 * the same pattern as `ReadonlyMap` and `ReadonlySet`.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam K The type of the keys in the heap.
 */
export type ReadonlyIndexedHeap<K> = Pick<
  IndexedHeap<K>,
  | "peek"
  | "peekKey"
  | "peekPriority"
  | "has"
  | "getPriority"
  | "size"
  | "isEmpty"
  | "toArray"
  | typeof Symbol.iterator
>;

/** Throws if the priority is NaN, which would silently corrupt the heap. */
function checkPriority(priority: number): void {
  if (Number.isNaN(priority)) {
    throw new RangeError("Cannot set priority: value is NaN");
  }
}

/**
 * A priority queue that supports looking up, removing, and re-prioritizing
 * entries by key. Each entry is a unique `(key, priority)` pair. The entry
 * with the smallest priority is always at the front.
 *
 * Unlike {@linkcode BinaryHeap}, which only allows popping the top element,
 * `IndexedHeap` lets you delete or update any entry by its key in
 * logarithmic time.
 *
 * Priorities are plain numbers, always sorted smallest-first. To sort
 * largest-first instead, negate the priorities.
 *
 * | Method                | Time complexity                       |
 * | --------------------- | ------------------------------------- |
 * | peek()                | Constant                              |
 * | peekKey()             | Constant                              |
 * | peekPriority()        | Constant                              |
 * | pop()                 | Logarithmic in the number of entries  |
 * | push(key, priority)   | Logarithmic in the number of entries  |
 * | delete(key)           | Logarithmic in the number of entries  |
 * | update(key, priority) | Logarithmic in the number of entries  |
 * | has(key)              | Constant                              |
 * | getPriority(key)      | Constant                              |
 * | toArray()             | Linear in the number of entries       |
 * | clear()               | Linear in the number of entries       |
 * | drain()               | Linearithmic in the number of entries |
 * | [Symbol.iterator]     | Linear in the number of entries       |
 *
 * Iterating with `for...of` or the spread operator yields entries in
 * arbitrary (heap-internal) order **without** modifying the heap. To
 * consume entries in sorted order, use
 * {@linkcode IndexedHeap.prototype.drain | drain}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
 * import { assertEquals } from "@std/assert";
 *
 * const heap = new IndexedHeap<string>();
 * heap.push("a", 3);
 * heap.push("b", 1);
 * heap.push("c", 2);
 *
 * assertEquals(heap.peek(), { key: "b", priority: 1 });
 * assertEquals(heap.pop(), { key: "b", priority: 1 });
 * assertEquals(heap.size, 2);
 *
 * assertEquals([...heap.drain()], [
 *   { key: "c", priority: 2 },
 *   { key: "a", priority: 3 },
 * ]);
 * ```
 *
 * @typeParam K The type of the keys in the heap. Keys are compared the
 * same way as `Map` keys — by reference for objects, by value for
 * primitives.
 */
export class IndexedHeap<K> implements Iterable<HeapEntry<K>> {
  #data: MutableEntry<K>[] = [];
  #index: Map<K, number> = new Map();

  /**
   * A string tag for the class, used by `Object.prototype.toString()`.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * assertEquals(heap[Symbol.toStringTag], "IndexedHeap");
   * ```
   */
  readonly [Symbol.toStringTag] = "IndexedHeap" as const;

  /**
   * Create a new {@linkcode IndexedHeap} from an iterable of key-priority
   * pairs, an array-like of key-priority pairs, or an existing
   * {@linkcode IndexedHeap}.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Creating from an array of pairs
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = IndexedHeap.from([["a", 3], ["b", 1], ["c", 2]]);
   * assertEquals(heap.peek(), { key: "b", priority: 1 });
   * assertEquals(heap.size, 3);
   * ```
   *
   * @example Creating from another IndexedHeap (shallow copy)
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const original = new IndexedHeap<string>();
   * original.push("x", 10);
   * original.push("y", 5);
   *
   * const copy = IndexedHeap.from(original);
   * assertEquals(copy.peek(), { key: "y", priority: 5 });
   * assertEquals(copy.size, 2);
   * assertEquals(original.size, 2);
   * ```
   *
   * @example Creating from a Map (iterable of [key, value] pairs)
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const map = new Map([["task-a", 3], ["task-b", 1]]);
   * const heap = IndexedHeap.from(map);
   * assertEquals(heap.peek(), { key: "task-b", priority: 1 });
   * ```
   *
   * @typeParam K The type of the keys in the heap.
   * @param collection An iterable or array-like of `[key, priority]` pairs,
   *   or an existing {@linkcode IndexedHeap} to copy.
   * @returns A new heap containing all entries from the collection.
   */
  static from<K>(
    collection:
      | IndexedHeap<K>
      | Iterable<readonly [K, number]>
      | ArrayLike<readonly [K, number]>,
  ): IndexedHeap<K> {
    if (
      collection === null || collection === undefined ||
      typeof collection !== "object" && typeof collection !== "string" ||
      !(
        Symbol.iterator in Object(collection) ||
        "length" in Object(collection)
      )
    ) {
      throw new TypeError(
        "Cannot create an IndexedHeap: the 'collection' parameter is not iterable or array-like",
      );
    }
    const heap = new IndexedHeap<K>();
    if (collection instanceof IndexedHeap) {
      for (const entry of collection.#data) {
        heap.#data.push({ key: entry.key, priority: entry.priority });
      }
      heap.#index = new Map(collection.#index);
      return heap;
    }
    const entries = Array.from(collection);
    for (let i = 0; i < entries.length; i++) {
      const [key, priority] = entries[i]!;
      checkPriority(priority);
      if (heap.#index.has(key)) {
        throw new TypeError(
          "Cannot push into IndexedHeap: key already exists",
        );
      }
      heap.#data.push({ key, priority });
      heap.#index.set(key, i);
    }
    for (let i = (heap.#data.length >>> 1) - 1; i >= 0; i--) {
      heap.#siftDown(i);
    }
    return heap;
  }

  /** Bubble the entry at `pos` up toward the root while it is smaller than its parent. */
  #siftUp(pos: number): number {
    const data = this.#data;
    const index = this.#index;
    const entry = data[pos]!;
    const priority = entry.priority;
    while (pos > 0) {
      const parentPos = (pos - 1) >>> 1;
      const parent = data[parentPos]!;
      if (priority < parent.priority) {
        data[pos] = parent;
        index.set(parent.key, pos);
        pos = parentPos;
      } else {
        break;
      }
    }
    data[pos] = entry;
    index.set(entry.key, pos);
    return pos;
  }

  /** Bubble the entry at `pos` down while a child is smaller. */
  #siftDown(pos: number): void {
    const data = this.#data;
    const index = this.#index;
    const size = data.length;
    const entry = data[pos]!;
    const priority = entry.priority;
    while (true) {
      const left = 2 * pos + 1;
      if (left >= size) break;
      const right = left + 1;
      let childPos = left;
      let childPri = data[left]!.priority;
      if (right < size) {
        const rp = data[right]!.priority;
        if (rp < childPri) {
          childPos = right;
          childPri = rp;
        }
      }
      if (childPri < priority) {
        const child = data[childPos]!;
        data[pos] = child;
        index.set(child.key, pos);
        pos = childPos;
      } else {
        break;
      }
    }
    data[pos] = entry;
    index.set(entry.key, pos);
  }

  /**
   * Insert a new key with the given priority. Throws if the key already
   * exists — use {@linkcode IndexedHeap.prototype.update | update} or
   * {@linkcode IndexedHeap.prototype.pushOrUpdate | pushOrUpdate} instead.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.push("task-1", 10);
   * assertEquals(heap.size, 1);
   * assertEquals(heap.peek(), { key: "task-1", priority: 10 });
   * ```
   *
   * @param key The key to insert.
   * @param priority The numeric priority (smaller = higher priority).
   */
  push(key: K, priority: number): void {
    checkPriority(priority);
    if (this.#index.has(key)) {
      throw new TypeError(
        "Cannot push into IndexedHeap: key already exists",
      );
    }
    const pos = this.#data.length;
    this.#data.push({ key, priority });
    this.#siftUp(pos);
  }

  /**
   * Remove and return the front entry (smallest priority), or `undefined`
   * if the heap is empty. The returned entry is removed from the heap so
   * the caller owns it.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.push("a", 2);
   * heap.push("b", 1);
   *
   * assertEquals(heap.pop(), { key: "b", priority: 1 });
   * assertEquals(heap.pop(), { key: "a", priority: 2 });
   * assertEquals(heap.pop(), undefined);
   * ```
   *
   * @returns The front entry, or `undefined` if empty.
   */
  pop(): HeapEntry<K> | undefined {
    const size = this.#data.length;
    if (size === 0) return undefined;

    const root = this.#data[0]!;
    this.#index.delete(root.key);

    if (size > 1) {
      const last = this.#data.pop()!;
      this.#data[0] = last;
      this.#siftDown(0);
    } else {
      this.#data.pop();
    }
    return { key: root.key, priority: root.priority };
  }

  /**
   * Return the front entry (smallest priority) without removing it, or
   * `undefined` if the heap is empty.
   *
   * The returned object is a copy; mutating it does not affect the heap.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.push("x", 5);
   * heap.push("y", 3);
   *
   * assertEquals(heap.peek(), { key: "y", priority: 3 });
   * assertEquals(heap.size, 2);
   * ```
   *
   * @returns A copy of the front entry, or `undefined` if empty.
   */
  peek(): HeapEntry<K> | undefined {
    const entry = this.#data[0];
    if (entry === undefined) return undefined;
    return { key: entry.key, priority: entry.priority };
  }

  /**
   * Return the key of the front entry (smallest priority), or `undefined`
   * if the heap is empty. Unlike
   * {@linkcode IndexedHeap.prototype.peek | peek}, does not allocate a
   * wrapper object.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.push("x", 5);
   * heap.push("y", 3);
   *
   * assertEquals(heap.peekKey(), "y");
   * assertEquals(heap.size, 2);
   * ```
   *
   * @returns The key of the front entry, or `undefined` if empty.
   */
  peekKey(): K | undefined {
    return this.#data[0]?.key;
  }

  /**
   * Return the priority of the front entry (smallest priority), or
   * `undefined` if the heap is empty. Unlike
   * {@linkcode IndexedHeap.prototype.peek | peek}, does not allocate a
   * wrapper object.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.push("x", 5);
   * heap.push("y", 3);
   *
   * assertEquals(heap.peekPriority(), 3);
   * assertEquals(heap.size, 2);
   * ```
   *
   * @returns The priority of the front entry, or `undefined` if empty.
   */
  peekPriority(): number | undefined {
    return this.#data[0]?.priority;
  }

  /**
   * Remove the entry with the given key.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.push("a", 1);
   * heap.push("b", 2);
   *
   * assertEquals(heap.delete("a"), true);
   * assertEquals(heap.delete("z"), false);
   * assertEquals(heap.size, 1);
   * ```
   *
   * @param key The key to remove.
   * @returns `true` if the key was present, `false` otherwise.
   */
  delete(key: K): boolean {
    const pos = this.#index.get(key);
    if (pos === undefined) return false;

    this.#index.delete(key);
    const lastIndex = this.#data.length - 1;

    if (pos === lastIndex) {
      this.#data.pop();
      return true;
    }

    const removedPriority = this.#data[pos]!.priority;
    const last = this.#data.pop()!;
    this.#data[pos] = last;

    if (last.priority < removedPriority) {
      this.#siftUp(pos);
    } else {
      this.#siftDown(pos);
    }
    return true;
  }

  /**
   * Change the priority of an existing key. Throws if the key is not
   * present — use {@linkcode IndexedHeap.prototype.push | push} or
   * {@linkcode IndexedHeap.prototype.pushOrUpdate | pushOrUpdate} instead.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.push("a", 10);
   * heap.push("b", 20);
   *
   * heap.update("b", 1);
   * assertEquals(heap.peek(), { key: "b", priority: 1 });
   * ```
   *
   * @param key The key whose priority to change.
   * @param priority The new priority.
   */
  update(key: K, priority: number): void {
    checkPriority(priority);
    const pos = this.#index.get(key);
    if (pos === undefined) {
      throw new TypeError(
        "Cannot update IndexedHeap: key does not exist",
      );
    }
    const entry = this.#data[pos]!;
    const oldPriority = entry.priority;
    if (priority === oldPriority) return;
    entry.priority = priority;
    if (priority < oldPriority) {
      this.#siftUp(pos);
    } else {
      this.#siftDown(pos);
    }
  }

  /**
   * Insert the key if absent, or update its priority if present. This is a
   * convenience method combining
   * {@linkcode IndexedHeap.prototype.push | push} and
   * {@linkcode IndexedHeap.prototype.update | update}.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.pushOrUpdate("a", 10);
   * assertEquals(heap.getPriority("a"), 10);
   *
   * heap.pushOrUpdate("a", 5);
   * assertEquals(heap.getPriority("a"), 5);
   * ```
   *
   * @param key The key to insert or update.
   * @param priority The priority to set.
   */
  pushOrUpdate(key: K, priority: number): void {
    checkPriority(priority);
    const pos = this.#index.get(key);
    if (pos === undefined) {
      const newPos = this.#data.length;
      this.#data.push({ key, priority });
      this.#siftUp(newPos);
      return;
    }
    const entry = this.#data[pos]!;
    const oldPriority = entry.priority;
    if (priority === oldPriority) return;
    entry.priority = priority;
    if (priority < oldPriority) {
      this.#siftUp(pos);
    } else {
      this.#siftDown(pos);
    }
  }

  /**
   * Check whether the key is in the heap.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.push("a", 1);
   *
   * assertEquals(heap.has("a"), true);
   * assertEquals(heap.has("b"), false);
   * ```
   *
   * @param key The key to look up.
   * @returns `true` if the key is present, `false` otherwise.
   */
  has(key: K): boolean {
    return this.#index.has(key);
  }

  /**
   * Return the priority of the given key, or `undefined` if not present.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.push("a", 42);
   *
   * assertEquals(heap.getPriority("a"), 42);
   * assertEquals(heap.getPriority("b"), undefined);
   * ```
   *
   * @param key The key to look up.
   * @returns The priority of the key, or `undefined` if not present.
   */
  getPriority(key: K): number | undefined {
    const pos = this.#index.get(key);
    if (pos === undefined) return undefined;
    return this.#data[pos]!.priority;
  }

  /**
   * The number of entries in the heap.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * assertEquals(heap.size, 0);
   * heap.push("a", 1);
   * assertEquals(heap.size, 1);
   * ```
   *
   * @returns The number of entries in the heap.
   */
  get size(): number {
    return this.#data.length;
  }

  /**
   * Remove all entries from the heap.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.push("a", 1);
   * heap.push("b", 2);
   * heap.clear();
   *
   * assertEquals(heap.size, 0);
   * assertEquals(heap.isEmpty(), true);
   * ```
   */
  clear(): void {
    this.#data.length = 0;
    this.#index.clear();
  }

  /**
   * Check whether the heap is empty.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * assertEquals(heap.isEmpty(), true);
   *
   * heap.push("a", 1);
   * assertEquals(heap.isEmpty(), false);
   * ```
   *
   * @returns `true` if the heap is empty, `false` otherwise.
   */
  isEmpty(): boolean {
    return this.#data.length === 0;
  }

  /**
   * Create an iterator that removes and yields every entry from
   * smallest to largest priority. The heap is empty when the iterator
   * finishes. If iteration is abandoned early (e.g. via `break`),
   * the heap retains the remaining entries.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.push("a", 3);
   * heap.push("b", 1);
   * heap.push("c", 2);
   *
   * assertEquals([...heap.drain()], [
   *   { key: "b", priority: 1 },
   *   { key: "c", priority: 2 },
   *   { key: "a", priority: 3 },
   * ]);
   * assertEquals(heap.size, 0);
   * ```
   *
   * @returns An iterator yielding entries from smallest to largest priority.
   */
  *drain(): IterableIterator<HeapEntry<K>> {
    while (!this.isEmpty()) {
      yield this.pop() as HeapEntry<K>;
    }
  }

  /**
   * Return a shallow copy of all entries as an array. The order is the
   * internal heap-array order (not sorted by priority). The heap is not
   * modified.
   *
   * Use {@linkcode IndexedHeap.prototype.drain | drain} to retrieve entries
   * in sorted (smallest-first) order.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.push("a", 3);
   * heap.push("b", 1);
   * heap.push("c", 2);
   *
   * const arr = heap.toArray();
   * assertEquals(arr.length, 3);
   * assertEquals(heap.size, 3);
   * ```
   *
   * @returns An array of entries in arbitrary (heap-internal) order.
   */
  toArray(): HeapEntry<K>[] {
    return this.#data.map(({ key, priority }) => ({ key, priority }));
  }

  /**
   * Yield all entries without removing them. The order is the internal
   * heap-array order (not sorted by priority). The heap is not modified.
   *
   * Use {@linkcode IndexedHeap.prototype.drain | drain} to iterate in
   * sorted (smallest-first) order (which empties the heap).
   *
   * Mutating the heap (`push`, `pop`, `update`, `delete`, `clear`) while
   * iterating is not supported and may skip or repeat entries.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.push("a", 3);
   * heap.push("b", 1);
   * heap.push("c", 2);
   *
   * const keys = [...heap].map((e) => e.key);
   * assertEquals(keys.length, 3);
   * assertEquals(heap.size, 3);
   * ```
   *
   * @returns An iterator yielding entries in arbitrary (heap-internal) order.
   */
  *[Symbol.iterator](): IterableIterator<HeapEntry<K>> {
    for (const { key, priority } of this.#data) {
      yield { key, priority };
    }
  }
}
