// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { ascend } from "./comparators.ts";

/**
 * A key-priority pair returned by {@linkcode IndexedHeap} methods.
 *
 * Fields are `readonly` to signal that mutating a returned entry has no
 * effect on the heap.
 *
 * @typeParam K The type of the key.
 * @typeParam P The type of the priority. Defaults to `number`.
 */
export interface HeapEntry<K, P = number> {
  /** The key that identifies this entry in the heap. */
  readonly key: K;
  /** The priority of this entry (smaller = higher priority by default). */
  readonly priority: P;
}

/**
 * Read-only view of an {@linkcode IndexedHeap}. Exposes query and
 * iteration methods, hiding all methods that modify the heap. Follows
 * the same pattern as `ReadonlyMap` and `ReadonlySet`.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam K The type of the keys in the heap.
 * @typeParam P The type of the priority. Defaults to `number`.
 */
export type ReadonlyIndexedHeap<K, P = number> = Pick<
  IndexedHeap<K, P>,
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

/**
 * Throws if `priority` is the literal `NaN` value, which would silently
 * corrupt the heap (`NaN` compares as neither less, greater, nor equal).
 *
 * `Number.isNaN` returns `false` for any non-number, so this is a no-op
 * for non-numeric priorities (e.g., `bigint`, tuples, strings).
 */
function checkPriority(priority: unknown): void {
  if (typeof priority === "number" && Number.isNaN(priority)) {
    throw new RangeError("Cannot set priority: value is NaN");
  }
}

/**
 * A priority queue that supports looking up, removing, and re-prioritizing
 * entries by key. Each entry is a unique `(key, priority)` pair. The entry
 * with the smallest priority (under the comparator) is always at the front.
 *
 * Unlike {@linkcode BinaryHeap}, which only allows popping the top element,
 * `IndexedHeap` lets you delete or change the priority of any entry by its
 * key in logarithmic time.
 *
 * Priorities default to `number` and are sorted smallest-first via
 * {@linkcode ascend}. Pass a different comparator (e.g.,
 * {@linkcode descend} for max-heap order) or a different priority type
 * (e.g., `[number, number]` for stable tie-breaking) via the `compare`
 * option.
 *
 * | Method              | Time complexity                       |
 * | ------------------- | ------------------------------------- |
 * | peek()              | Constant                              |
 * | peekKey()           | Constant                              |
 * | peekPriority()      | Constant                              |
 * | pop()               | Logarithmic in the number of entries  |
 * | push(key, priority) | Logarithmic in the number of entries  |
 * | set(key, priority)  | Logarithmic in the number of entries  |
 * | delete(key)         | Logarithmic in the number of entries  |
 * | has(key)            | Constant                              |
 * | getPriority(key)    | Constant                              |
 * | toArray()           | Linear in the number of entries       |
 * | clear()             | Linear in the number of entries       |
 * | drain()             | Linearithmic in the number of entries |
 * | [Symbol.iterator]   | Linear in the number of entries       |
 *
 * Iterating with `for...of` or the spread operator yields entries in
 * arbitrary (heap-internal) order **without** modifying the heap. To
 * consume entries in sorted order, use
 * {@linkcode IndexedHeap.prototype.drain | drain}.
 *
 * Priorities are stored by reference. For primitive priority types
 * (`number`, `bigint`, `string`, etc.) this is invisible. With object
 * priorities such as tuples, treat them as immutable: the entries
 * returned by {@linkcode IndexedHeap.prototype.peek | peek},
 * {@linkcode IndexedHeap.prototype.peekPriority | peekPriority},
 * {@linkcode IndexedHeap.prototype.getPriority | getPriority},
 * {@linkcode IndexedHeap.prototype.toArray | toArray}, and iteration
 * share the priority reference with the heap, so mutating a returned
 * priority's contents (e.g., `heap.peek().priority[0] = 0`) corrupts
 * the heap invariant. Use
 * {@linkcode IndexedHeap.prototype.set | set} to change a key's
 * priority.
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
 * @example Max-heap via `descend`
 * ```ts
 * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
 * import { descend } from "@std/data-structures";
 * import { assertEquals } from "@std/assert";
 *
 * const heap = new IndexedHeap<string>(null, { compare: descend });
 * heap.push("a", 1);
 * heap.push("b", 5);
 * heap.push("c", 3);
 *
 * assertEquals(heap.peek(), { key: "b", priority: 5 });
 * ```
 *
 * @example Tuple priority for stable tie-breaking
 * ```ts
 * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
 * import { assertEquals } from "@std/assert";
 *
 * // Order primarily by score, then by insertion order for ties.
 * const heap = new IndexedHeap<string, [number, number]>(null, {
 *   compare: (a, b) => a[0] - b[0] || a[1] - b[1],
 * });
 * heap.push("first", [5, 0]);
 * heap.push("second", [5, 1]);
 * heap.push("third", [3, 2]);
 *
 * assertEquals([...heap.drain()].map((e) => e.key), [
 *   "third",
 *   "first",
 *   "second",
 * ]);
 * ```
 *
 * @typeParam K The type of the keys in the heap. Keys are compared the
 * same way as `Map` keys — by reference for objects, by value for
 * primitives.
 * @typeParam P The type of the priority. Defaults to `number`.
 */
export class IndexedHeap<K, P = number> implements Iterable<HeapEntry<K, P>> {
  #data: { key: K; priority: P }[] = [];
  #index: Map<K, number> = new Map();
  #compare: (a: P, b: P) => number;

  /**
   * Creates an empty {@linkcode IndexedHeap}, optionally populated from an
   * iterable of `[key, priority]` pairs and/or configured with a custom
   * comparator. Heapified in linear time.
   *
   * Use {@linkcode IndexedHeap.from} for inputs that are array-like instead
   * of iterable, or to copy from another `IndexedHeap`.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param entries An optional iterable of `[key, priority]` pairs. Each key
   * must be unique; duplicates throw a `TypeError`. Pass `null` or
   * `undefined` to create an empty heap with options.
   * @param options Optional configuration. `compare` overrides the default
   * ascending-numeric ordering; pass {@linkcode descend} for max-heap
   * order, or a custom function for tuple/`bigint`/etc. priorities.
   *
   * @example Empty heap
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * assertEquals(heap.size, 0);
   * ```
   *
   * @example With initial entries
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>([["a", 3], ["b", 1], ["c", 2]]);
   * assertEquals(heap.peek(), { key: "b", priority: 1 });
   * ```
   *
   * @example From a Map
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const tasks = new Map([["task-a", 3], ["task-b", 1]]);
   * const heap = new IndexedHeap(tasks);
   * assertEquals(heap.peek(), { key: "task-b", priority: 1 });
   * ```
   *
   * @example Max-heap via `descend`
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { descend } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>([["a", 1], ["b", 5], ["c", 3]], {
   *   compare: descend,
   * });
   * assertEquals(heap.peek(), { key: "b", priority: 5 });
   * ```
   */
  constructor(
    entries?: Iterable<readonly [K, P]> | null,
    options?: { compare?: (a: P, b: P) => number },
  ) {
    const compare = options?.compare ?? (ascend as (a: P, b: P) => number);
    if (typeof compare !== "function") {
      throw new TypeError(
        "Cannot construct an IndexedHeap: the 'compare' option is not a function",
      );
    }
    this.#compare = compare;
    if (entries === undefined || entries === null) return;
    if (
      typeof entries !== "object" && typeof entries !== "string" ||
      !(Symbol.iterator in Object(entries))
    ) {
      throw new TypeError(
        "Cannot construct an IndexedHeap: the 'entries' parameter is not iterable, did you mean to call IndexedHeap.from?",
      );
    }
    this.#bulkLoad(entries);
  }

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
   * {@linkcode IndexedHeap}. When copying from another `IndexedHeap`, the
   * source's comparator is inherited unless `options.compare` overrides it.
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
   * @example Re-ordering an existing heap with a different comparator
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { descend } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const minHeap = new IndexedHeap<string>([["a", 1], ["b", 5], ["c", 3]]);
   * const maxHeap = IndexedHeap.from(minHeap, { compare: descend });
   *
   * assertEquals(minHeap.peek(), { key: "a", priority: 1 });
   * assertEquals(maxHeap.peek(), { key: "b", priority: 5 });
   * ```
   *
   * @typeParam K The type of the keys in the heap.
   * @typeParam P The type of the priority. Defaults to `number`.
   * @param collection An iterable or array-like of `[key, priority]` pairs,
   *   or an existing {@linkcode IndexedHeap} to copy.
   * @param options Optional configuration. `compare` overrides the
   *   ordering; when copying from another `IndexedHeap`, omitting this
   *   inherits the source's comparator.
   * @returns A new heap containing all entries from the collection.
   */
  static from<K, P = number>(
    collection:
      | IndexedHeap<K, P>
      | Iterable<readonly [K, P]>
      | ArrayLike<readonly [K, P]>,
    options?: { compare?: (a: P, b: P) => number },
  ): IndexedHeap<K, P> {
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
    if (collection instanceof IndexedHeap) {
      const heap = new IndexedHeap<K, P>(null, {
        compare: options?.compare ?? collection.#compare,
      });
      for (const entry of collection.#data) {
        const pos = heap.#data.length;
        heap.#data.push({ key: entry.key, priority: entry.priority });
        heap.#index.set(entry.key, pos);
      }
      // If the comparator is overridden, the source's heap-array order is
      // no longer valid under the new ordering — re-heapify in O(n).
      if (options?.compare) {
        for (let i = (heap.#data.length >>> 1) - 1; i >= 0; i--) {
          heap.#siftDown(i);
        }
      }
      return heap;
    }
    const heap = new IndexedHeap<K, P>(null, options);
    heap.#bulkLoad(
      Symbol.iterator in Object(collection)
        ? collection as Iterable<readonly [K, P]>
        : Array.from(collection as ArrayLike<readonly [K, P]>),
    );
    return heap;
  }

  /**
   * Append all `[key, priority]` pairs and heapify in linear time. Used by
   * the constructor and by {@linkcode IndexedHeap.from} for the
   * non-`IndexedHeap` input branch.
   */
  #bulkLoad(entries: Iterable<readonly [K, P]>): void {
    for (const [key, priority] of entries) {
      checkPriority(priority);
      if (this.#index.has(key)) {
        throw new TypeError(
          "Cannot push into IndexedHeap: key already exists",
        );
      }
      const pos = this.#data.length;
      this.#data.push({ key, priority });
      this.#index.set(key, pos);
    }
    for (let i = (this.#data.length >>> 1) - 1; i >= 0; i--) {
      this.#siftDown(i);
    }
  }

  /** Bubble the entry at `pos` up toward the root while it is smaller than its parent. */
  #siftUp(pos: number): number {
    const data = this.#data;
    const index = this.#index;
    const compare = this.#compare;
    const entry = data[pos]!;
    const priority = entry.priority;
    while (pos > 0) {
      const parentPos = (pos - 1) >>> 1;
      const parent = data[parentPos]!;
      if (compare(priority, parent.priority) < 0) {
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
    const compare = this.#compare;
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
        if (compare(rp, childPri) < 0) {
          childPos = right;
          childPri = rp;
        }
      }
      if (compare(childPri, priority) < 0) {
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
   * exists — use {@linkcode IndexedHeap.prototype.set | set} for upsert
   * semantics instead.
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
   * @param priority The priority (smaller = higher priority by default).
   */
  push(key: K, priority: P): void {
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
  pop(): HeapEntry<K, P> | undefined {
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
   * The returned wrapper is a fresh object — replacing its `key` or
   * `priority` property has no effect on the heap. Object-typed
   * priorities (e.g., tuples) share their reference with the heap and
   * must not be mutated; see the class-level note on priority
   * mutability.
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
   * @returns A wrapper around the front entry, or `undefined` if empty.
   */
  peek(): HeapEntry<K, P> | undefined {
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
  peekPriority(): P | undefined {
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

    if (this.#compare(last.priority, removedPriority) < 0) {
      this.#siftUp(pos);
    } else {
      this.#siftDown(pos);
    }
    return true;
  }

  /**
   * Set the priority of a key, inserting it if absent. This is the upsert
   * counterpart to {@linkcode IndexedHeap.prototype.push | push} (which
   * throws on existing keys) and is the natural operation for relaxation
   * steps in graph algorithms like Dijkstra's.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Inserting and updating
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.set("a", 10);
   * assertEquals(heap.getPriority("a"), 10);
   *
   * heap.set("a", 5);
   * assertEquals(heap.getPriority("a"), 5);
   * ```
   *
   * @example Decrease-key reorders the heap
   * ```ts
   * import { IndexedHeap } from "@std/data-structures/unstable-indexed-heap";
   * import { assertEquals } from "@std/assert";
   *
   * const heap = new IndexedHeap<string>();
   * heap.push("a", 10);
   * heap.push("b", 20);
   *
   * heap.set("b", 1);
   * assertEquals(heap.peek(), { key: "b", priority: 1 });
   * ```
   *
   * @param key The key to insert or update.
   * @param priority The priority to set.
   */
  set(key: K, priority: P): void {
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
    if (this.#compare(priority, oldPriority) < 0) {
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
  getPriority(key: K): P | undefined {
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
  *drain(): IterableIterator<HeapEntry<K, P>> {
    while (!this.isEmpty()) {
      yield this.pop() as HeapEntry<K, P>;
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
  toArray(): HeapEntry<K, P>[] {
    return this.#data.map(({ key, priority }) => ({ key, priority }));
  }

  /**
   * Yield all entries without removing them. The order is the internal
   * heap-array order (not sorted by priority). The heap is not modified
   * (unlike {@linkcode BinaryHeap}, whose iterator drains).
   *
   * Use {@linkcode IndexedHeap.prototype.drain | drain} to iterate in
   * sorted (smallest-first) order (which empties the heap).
   *
   * Mutating the heap (`push`, `pop`, `set`, `delete`, `clear`) while
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
  *[Symbol.iterator](): IterableIterator<HeapEntry<K, P>> {
    for (const { key, priority } of this.#data) {
      yield { key, priority };
    }
  }
}
