// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

const MIN_CAPACITY = 8;

/**
 * Read-only view of a {@linkcode Deque}. Strips all mutation methods,
 * following the `ReadonlyArray` / `ReadonlyMap` / `ReadonlySet` pattern.
 * A `Deque<T>` is directly assignable to `ReadonlyDeque<T>`.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam T The type of the values stored in the deque.
 */
export type ReadonlyDeque<T> = Pick<
  Deque<T>,
  | "length"
  | "isEmpty"
  | "peekFront"
  | "peekBack"
  | "at"
  | "toArray"
  | typeof Symbol.iterator
  | "reversed"
>;

function nextPowerOfTwo(n: number): number {
  if (n <= MIN_CAPACITY) return MIN_CAPACITY;
  // Bit trick: fill all bits below the highest set bit, then add 1
  n--;
  n |= n >>> 1;
  n |= n >>> 2;
  n |= n >>> 4;
  n |= n >>> 8;
  n |= n >>> 16;
  return n + 1;
}

/**
 * A double-ended queue implemented with a ring buffer. Provides O(1) amortized
 * {@linkcode Deque.prototype.pushFront | pushFront},
 * {@linkcode Deque.prototype.pushBack | pushBack},
 * {@linkcode Deque.prototype.popFront | popFront},
 * {@linkcode Deque.prototype.popBack | popBack}, and indexed access via
 * {@linkcode Deque.prototype.at | at}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { Deque } from "@std/data-structures/unstable-deque";
 * import { assertEquals } from "@std/assert";
 *
 * const deque = new Deque<number>();
 * deque.pushBack(1, 2, 3);
 * assertEquals(deque.popFront(), 1);
 * assertEquals(deque.length, 2);
 * assertEquals([...deque], [2, 3]);
 * ```
 *
 * @typeParam T The type of the values stored in the deque.
 */
export class Deque<T> implements Iterable<T>, ReadonlyDeque<T> {
  #buffer: (T | undefined)[];
  #head: number;
  #length: number;
  #mask: number;

  /**
   * Creates an empty deque, optionally populated from an iterable.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Creating an empty deque
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque<number>();
   * assertEquals(deque.length, 0);
   * ```
   *
   * @example Creating a deque from an iterable
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque([1, 2, 3]);
   * assertEquals([...deque], [1, 2, 3]);
   * ```
   *
   * @param source An optional iterable to populate the deque.
   */
  constructor(source?: Iterable<T>) {
    if (source === undefined || source === null) {
      this.#buffer = new Array(MIN_CAPACITY);
      this.#head = 0;
      this.#length = 0;
      this.#mask = MIN_CAPACITY - 1;
      return;
    }
    if (source instanceof Deque) {
      const capacity = nextPowerOfTwo(source.#length);
      this.#buffer = Deque.#copyBuffer(source, capacity);
      this.#head = 0;
      this.#length = source.#length;
      this.#mask = capacity - 1;
      return;
    }
    if (
      typeof source !== "object" && typeof source !== "string" ||
      !(Symbol.iterator in Object(source))
    ) {
      throw new TypeError(
        "Cannot construct a Deque: the 'source' parameter is not iterable, did you mean to call Deque.from?",
      );
    }
    const items = [...source];
    const capacity = nextPowerOfTwo(items.length);
    this.#buffer = new Array(capacity);
    for (let i = 0; i < items.length; i++) {
      this.#buffer[i] = items[i];
    }
    this.#head = 0;
    this.#length = items.length;
    this.#mask = capacity - 1;
  }

  /**
   * The number of elements in the deque.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Getting the length
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque([1, 2, 3]);
   * assertEquals(deque.length, 3);
   * ```
   *
   * @returns The number of elements in the deque.
   */
  get length(): number {
    return this.#length;
  }

  /**
   * Checks if the deque contains no elements.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Checking if the deque is empty
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque<number>();
   * assertEquals(deque.isEmpty(), true);
   *
   * deque.pushBack(1);
   * assertEquals(deque.isEmpty(), false);
   * ```
   *
   * @returns `true` if the deque is empty, otherwise `false`.
   */
  isEmpty(): boolean {
    return this.#length === 0;
  }

  /**
   * Append one or more values to the back of the deque.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Pushing values to the back
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque<number>();
   * deque.pushBack(1, 2, 3);
   * assertEquals([...deque], [1, 2, 3]);
   * ```
   *
   * @param value The first value to append.
   * @param rest Additional values to append.
   * @returns The new length of the deque.
   */
  pushBack(value: T, ...rest: T[]): number {
    this.#pushBackOne(value);
    for (let i = 0; i < rest.length; i++) {
      this.#pushBackOne(rest[i]!);
    }
    return this.#length;
  }

  #pushBackOne(value: T): void {
    if (this.#length === (this.#mask + 1)) this.#grow();
    this.#buffer[(this.#head + this.#length) & this.#mask] = value;
    this.#length++;
  }

  /**
   * Prepend one or more values to the front of the deque. Values are inserted
   * in argument order, so `pushFront(1, 2, 3)` results in front-to-back order
   * `[1, 2, 3, ...existing]`.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Pushing values to the front
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque([4, 5]);
   * deque.pushFront(1, 2, 3);
   * assertEquals([...deque], [1, 2, 3, 4, 5]);
   * ```
   *
   * @param value The first value to prepend.
   * @param rest Additional values to prepend.
   * @returns The new length of the deque.
   */
  pushFront(value: T, ...rest: T[]): number {
    // Insert in reverse so argument order is preserved at the front
    for (let i = rest.length - 1; i >= 0; i--) {
      this.#pushFrontOne(rest[i]!);
    }
    this.#pushFrontOne(value);
    return this.#length;
  }

  #pushFrontOne(value: T): void {
    if (this.#length === (this.#mask + 1)) this.#grow();
    this.#head = (this.#head - 1) & this.#mask;
    this.#buffer[this.#head] = value;
    this.#length++;
  }

  /**
   * Remove and return the back element, or `undefined` if the deque is empty.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Popping from the back
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque([1, 2, 3]);
   * assertEquals(deque.popBack(), 3);
   * assertEquals([...deque], [1, 2]);
   * ```
   *
   * @returns The back element, or `undefined` if empty.
   */
  popBack(): T | undefined {
    if (this.#length === 0) return undefined;
    this.#length--;
    const index = (this.#head + this.#length) & this.#mask;
    const value = this.#buffer[index];
    this.#buffer[index] = undefined;
    this.#maybeShrink();
    return value;
  }

  /**
   * Remove and return the front element, or `undefined` if the deque is empty.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Popping from the front
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque([1, 2, 3]);
   * assertEquals(deque.popFront(), 1);
   * assertEquals([...deque], [2, 3]);
   * ```
   *
   * @returns The front element, or `undefined` if empty.
   */
  popFront(): T | undefined {
    if (this.#length === 0) return undefined;
    const value = this.#buffer[this.#head];
    this.#buffer[this.#head] = undefined;
    this.#head = (this.#head + 1) & this.#mask;
    this.#length--;
    this.#maybeShrink();
    return value;
  }

  /**
   * Return the front element without removing it, or `undefined` if the deque
   * is empty.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Peeking at the front
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque([1, 2, 3]);
   * assertEquals(deque.peekFront(), 1);
   * assertEquals(deque.length, 3);
   * ```
   *
   * @returns The front element, or `undefined` if empty.
   */
  peekFront(): T | undefined {
    if (this.#length === 0) return undefined;
    return this.#buffer[this.#head];
  }

  /**
   * Return the back element without removing it, or `undefined` if the deque
   * is empty.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Peeking at the back
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque([1, 2, 3]);
   * assertEquals(deque.peekBack(), 3);
   * assertEquals(deque.length, 3);
   * ```
   *
   * @returns The back element, or `undefined` if empty.
   */
  peekBack(): T | undefined {
    if (this.#length === 0) return undefined;
    return this.#buffer[(this.#head + this.#length - 1) & this.#mask];
  }

  /**
   * Return the element at the given index (0-based from front). Negative
   * indices count from the back (`-1` is the last element). Returns `undefined`
   * for out-of-range indices.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Accessing elements by index
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque([10, 20, 30, 40]);
   * assertEquals(deque.at(0), 10);
   * assertEquals(deque.at(-1), 40);
   * assertEquals(deque.at(99), undefined);
   * ```
   *
   * @param index The zero-based index. Negative values count from the back.
   * @returns The element at the index, or `undefined` if out of range.
   */
  at(index: number): T | undefined {
    if (index < 0) index += this.#length;
    if (index < 0 || index >= this.#length) return undefined;
    return this.#buffer[(this.#head + index) & this.#mask];
  }

  /**
   * Remove all elements and release the backing buffer.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Clearing the deque
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque([1, 2, 3]);
   * deque.clear();
   * assertEquals(deque.length, 0);
   * assertEquals(deque.isEmpty(), true);
   * ```
   */
  clear(): void {
    this.#buffer = new Array(MIN_CAPACITY);
    this.#head = 0;
    this.#length = 0;
    this.#mask = MIN_CAPACITY - 1;
  }

  /**
   * Return a shallow copy of the deque's contents as an array, in
   * front-to-back order.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Converting to an array
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque([1, 2, 3]);
   * assertEquals(deque.toArray(), [1, 2, 3]);
   * ```
   *
   * @returns An array containing the deque's elements in order.
   */
  toArray(): T[] {
    const result = new Array<T>(this.#length);
    for (let i = 0; i < this.#length; i++) {
      result[i] = this.#buffer[(this.#head + i) & this.#mask] as T;
    }
    return result;
  }

  /**
   * Create a new deque from an array-like, iterable, or existing deque.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Creating a deque from an array
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = Deque.from([1, 2, 3]);
   * assertEquals([...deque], [1, 2, 3]);
   * ```
   *
   * @example Creating a deque from an existing deque
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const original = new Deque([1, 2, 3]);
   * const copy = Deque.from(original);
   * assertEquals([...copy], [1, 2, 3]);
   * ```
   *
   * @typeParam T The type of the values in the passed collection.
   * @param collection An array-like, iterable, or existing deque.
   * @returns A new deque containing the values from the collection.
   */
  static from<T>(
    collection: ArrayLike<T> | Iterable<T> | Deque<T>,
  ): Deque<T>;
  /**
   * Create a new deque from an array-like, iterable, or existing deque, with
   * a mapping function applied to each element.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Creating a deque with a mapping function
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = Deque.from([1, 2, 3], { map: (v) => v * 10 });
   * assertEquals([...deque], [10, 20, 30]);
   * ```
   *
   * @typeParam T The type of the values in the passed collection.
   * @typeParam U The type of the values stored in the new deque.
   * @typeParam V The type of the `this` value when calling the mapping function. Defaults to `undefined`.
   * @param collection An array-like, iterable, or existing deque.
   * @param options Options with a map function and optional thisArg.
   * @returns A new deque containing the mapped values from the collection.
   */
  static from<T, U, V = undefined>(
    collection: ArrayLike<T> | Iterable<T> | Deque<T>,
    options: {
      map: (value: T, index: number) => U;
      thisArg?: V;
    },
  ): Deque<U>;
  static from<T, U, V>(
    collection: ArrayLike<T> | Iterable<T> | Deque<T>,
    options?: {
      map?: (value: T, index: number) => U;
      thisArg?: V;
    },
  ): Deque<U> {
    const result = new Deque<U>();
    let unmappedValues: ArrayLike<T> | Iterable<T>;

    if (collection instanceof Deque) {
      if (!options?.map) {
        const capacity = nextPowerOfTwo(collection.#length);
        result.#buffer = Deque.#copyBuffer(
          collection,
          capacity,
        ) as (U | undefined)[];
        result.#head = 0;
        result.#length = collection.#length;
        result.#mask = capacity - 1;
        return result;
      }
      unmappedValues = collection.toArray();
    } else {
      unmappedValues = collection;
    }

    const mapped: U[] = options?.map
      ? Array.from(unmappedValues, options.map, options.thisArg)
      : Array.from(unmappedValues as unknown as Iterable<U>);

    const capacity = nextPowerOfTwo(mapped.length);
    result.#buffer = new Array(capacity);
    for (let i = 0; i < mapped.length; i++) {
      result.#buffer[i] = mapped[i];
    }
    result.#head = 0;
    result.#length = mapped.length;
    result.#mask = capacity - 1;
    return result;
  }

  /**
   * Iterate over the deque's elements from front to back. Non-destructive
   * (unlike {@linkcode BinaryHeap}).
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Iterating over the deque
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque([1, 2, 3]);
   * assertEquals([...deque], [1, 2, 3]);
   * ```
   *
   * @returns An iterator yielding elements from front to back.
   */
  *[Symbol.iterator](): IterableIterator<T> {
    for (let i = 0; i < this.#length; i++) {
      yield this.#buffer[(this.#head + i) & this.#mask] as T;
    }
  }

  /**
   * Iterate over the deque's elements from back to front.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Iterating in reverse
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque([1, 2, 3]);
   * assertEquals([...deque.reversed()], [3, 2, 1]);
   * ```
   *
   * @returns An iterator yielding elements from back to front.
   */
  *reversed(): IterableIterator<T> {
    for (let i = this.#length - 1; i >= 0; i--) {
      yield this.#buffer[(this.#head + i) & this.#mask] as T;
    }
  }

  /**
   * The string tag used by `Object.prototype.toString`.
   *
   * @example Usage
   * ```ts
   * import { Deque } from "@std/data-structures/unstable-deque";
   * import { assertEquals } from "@std/assert";
   *
   * const deque = new Deque<number>();
   * assertEquals(deque[Symbol.toStringTag], "Deque");
   * ```
   */
  readonly [Symbol.toStringTag] = "Deque" as const;

  static #copyBuffer<T>(source: Deque<T>, capacity: number): (T | undefined)[] {
    const buffer = new Array<T | undefined>(capacity);
    for (let i = 0; i < source.#length; i++) {
      buffer[i] = source.#buffer[(source.#head + i) & source.#mask];
    }
    return buffer;
  }

  #realloc(newCapacity: number): void {
    const newBuffer = new Array<T | undefined>(newCapacity);
    for (let i = 0; i < this.#length; i++) {
      newBuffer[i] = this.#buffer[(this.#head + i) & this.#mask];
    }
    this.#buffer = newBuffer;
    this.#head = 0;
    this.#mask = newCapacity - 1;
  }

  #grow(): void {
    this.#realloc((this.#mask + 1) * 2);
  }

  #maybeShrink(): void {
    const capacity = this.#mask + 1;
    if (this.#length < (capacity >>> 2) && capacity > MIN_CAPACITY) {
      this.#realloc(capacity >>> 1);
    }
  }
}
