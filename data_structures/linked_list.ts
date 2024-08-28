// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/** Represents a linked list's node. */
export interface LinkedNode<T> {
  /** The value of the node. */
  value: T;
  /** The next node. */
  next: LinkedNode<T> | null;
  /** The previous node. */
  prev: LinkedNode<T> | null;
}

/**
 * A doubly linked list is a linked data structures that consists
 * of a set of nodes. Each node contains a value and two link fields,
 * one linking to the previous node and one linking to the next node.
 *
 * | Method                 | Average Case | Worst Case |
 * | ---------------------- | ------------ | ---------- |
 * | push(value)            | O(1)         | O(1)       |
 * | pop()                  | O(1)         | O(1)       |
 * | unshift(value)         | O(1)         | O(1)       |
 * | shift()                | O(1)         | O(1)       |
 * | insert(value, index)   | O(n)         | O(n)       |
 * | remove(index)          | O(n)         | O(n)       |
 * | has(value)             | O(n)         | O(n)       |
 *
 * @example Usage
 * ```ts
 * import { LinkedList } from "@std/data-structures";
 * import { assertEquals } from "@std/assert";
 *
 * const list = new LinkedList<string>();
 * assertEquals(list.length, 0);
 *
 * list.push("a");
 * list.push("b");
 * list.push("c");
 * list.unshift("x");
 * list.unshift("y");
 *
 * assertEquals(list.length, 5);
 * assertEquals(list.pop(), "c");
 * assertEquals(list.shift(), "y");
 * assertEquals([...list], ["x", "a", "b"]);
 *
 * list.insert("z", 1);
 * list.insert("d", 4);
 *
 * assertEquals([...list], ["x", "z", "a", "b", "d"]);
 * assertEquals(list.remove(2), "a");
 * assertEquals(list.has("d"), true);
 * assertEquals(list.has("a"), false);
 * ```
 *
 * @typeparam T The type of the values being stored in the list.
 */
export class LinkedList<T> implements Iterable<T> {
  /** The number of nodes in the linked list. */
  #length: number;
  /** The first node of the linked list. */
  #head: LinkedNode<T> | null;
  /** The last node of the linked list. */
  #tail: LinkedNode<T> | null;

  constructor() {
    this.#length = 0;
    this.#head = null;
    this.#tail = null;
  }

  /** The number of nodes in the linked list. */
  get length(): number {
    return this.#length;
  }

  /**
   * Creates a new linked list from an iterable object.
   *
   * @param iterable An iterable object whose elements are added to the linked list.
   * @returns A new linked list.
   *
   * @example Usage
   * ```ts
   * import { LinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = LinkedList.from([1, 2, 3]);
   * assertEquals([...list], [1, 2, 3]);
   * ```
   */
  static from<T>(
    iterable: ArrayLike<T> | Iterable<T> | LinkedList<T>,
  ): LinkedList<T> {
    const list = new LinkedList<T>();
    const data = Array.from(iterable);
    for (const value of data) list.push(value);
    return list;
  }

  /**
   * Appends a new value to the back of the linked list.
   *
   * The complexity of this operation is O(1).
   *
   * @param value The value to be added.
   *
   * @example Usage
   * ```ts
   * import { LinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = new LinkedList();
   * assertEquals(list.length, 0);
   *
   * list.push(1);
   * list.push(2);
   * list.push(3);
   *
   * assertEquals(list.length, 3);
   * assertEquals([...list], [1, 2, 3]);
   * ```
   */
  push(value: T): void {
    const node: LinkedNode<T> = { value, prev: this.#tail, next: null };

    if (this.#tail) {
      this.#tail.next = node;
    } else {
      this.#head = node;
    }

    this.#tail = node;
    ++this.#length;
  }

  /**
   * Removes the last node of the linked list and returns its value, if any.
   *
   * The complexity of this operation is O(1).
   *
   * @returns The removed node's value, `undefined` if this list is empty.
   *
   * @example Usage
   * ```ts
   * import { LinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = LinkedList.from(["a", "b", "c", "d"]);
   * assertEquals(list.length, 4);
   *
   * assertEquals(list.pop(), "d");
   * assertEquals(list.pop(), "c");
   * assertEquals(list.pop(), "b");
   *
   * assertEquals(list.length, 1);
   * ```
   */
  pop(): T | undefined {
    if (!this.#tail) {
      return undefined;
    }

    const node = this.#tail;
    this.#tail = node.prev;

    if (this.#tail) {
      this.#tail.next = null;
    } else {
      this.#head = null;
    }

    --this.#length;
    return node.value;
  }

  /**
   * Appends a new value to the front of the linked list.
   *
   * The complexity of this operation is O(1).
   *
   * @param value The value to be added.
   *
   * @example Usage
   * ```ts
   * import { LinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = new LinkedList();
   * assertEquals(list.length, 0);
   *
   * list.unshift(1);
   * list.unshift(2);
   * list.unshift(3);
   *
   * assertEquals(list.length, 3);
   * assertEquals([...list], [3, 2, 1]);
   * ```
   */
  unshift(value: T): void {
    const node: LinkedNode<T> = { value, prev: null, next: this.#head };

    if (this.#head) {
      this.#head.prev = node;
    } else {
      this.#tail = node;
    }

    this.#head = node;
    ++this.#length;
  }

  /**
   * Removes the first node of the linked list and returns its value, if any.
   *
   * The complexity of this operation is O(1).
   *
   * @returns The removed node's value, `undefined` if this list is empty.
   *
   * @example Usage
   * ```ts
   * import { LinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = LinkedList.from(["a", "b", "c", "d"]);
   * assertEquals(list.length, 4);
   *
   * assertEquals(list.shift(), "a");
   * assertEquals(list.shift(), "b");
   * assertEquals(list.shift(), "c");
   *
   * assertEquals(list.length, 1);
   * ```
   */
  shift(): T | undefined {
    if (!this.#head) {
      return undefined;
    }

    const node = this.#head;
    this.#head = node.next;

    if (this.#head) {
      this.#head.prev = null;
    } else {
      this.#tail = null;
    }

    --this.#length;
    return node.value;
  }

  /**
   * Inserts the given value to the specified index.
   *
   * The complexity of this operation is linear O(n).
   *
   * @param value The value to insert.
   * @param index The position to insert.
   * @throws If `index < 0` or `index > length`
   *
   * @example Usage
   * ```ts
   * import { LinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = LinkedList.from([2, 4, 6, 8]);
   * assertEquals([...list], [2, 4, 6, 8]);
   *
   * list.insert(1, 0);
   * assertEquals([...list], [1, 2, 4, 6, 8]);
   *
   * list.insert(3, 2);
   * assertEquals([...list], [1, 2, 3, 4, 6, 8]);
   *
   * list.insert(5, 4);
   * assertEquals([...list], [1, 2, 3, 4, 5, 6, 8]);
   *
   * list.insert(7, 6);
   * assertEquals([...list], [1, 2, 3, 4, 5, 6, 7, 8]);
   * ```
   */
  insert(value: T, index: number): void {
    if (index === 0) {
      return this.unshift(value);
    }

    if (index === this.#length) {
      return this.push(value);
    }

    const dt = this.#length - index - 1;

    if (index < 0 || dt < 0) {
      throw new RangeError(
        "Cannot insert the value: The index is out of range",
      );
    }

    const node: LinkedNode<T> = { value, prev: null, next: null };
    let ptr: LinkedNode<T>;

    if (dt < this.#length / 2) {
      ptr = this.#tail!;
      for (let i = 0; i < dt; ++i) {
        ptr = ptr.prev!;
      }
    } else {
      ptr = this.#head!;
      for (let i = 0; i < index; ++i) {
        ptr = ptr.next!;
      }
    }

    node.next = ptr;
    node.prev = ptr.prev;
    ptr.prev!.next = node;
    ptr.prev = node;

    ++this.#length;
  }

  /**
   * Removes the node at the given index and returns its value, if any.
   *
   * The complexity of this operation is linear O(n).
   *
   * @param index The position to remove.
   * @returns The removed node's value, `undefined` is returned if:
   * - `length == 0`
   * - `index < 0`
   * - `index >= length`
   *
   * @example Usage
   * ```ts
   * import { LinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = LinkedList.from([2, 4, 6, 8]);
   * assertEquals([...list], [2, 4, 6, 8]);
   *
   * list.remove(1);
   * assertEquals([...list], [2, 6, 8]);
   *
   * list.remove(2);
   * assertEquals([...list], [2, 6]);
   * ```
   */
  remove(index: number): T | undefined {
    if (index === 0) {
      return this.shift();
    }

    if (index === this.#length - 1) {
      return this.pop();
    }

    const dt = this.#length - index - 1;

    if (index < 0 || dt < 0) {
      return undefined;
    }

    let ptr: LinkedNode<T>;

    if (dt < this.#length / 2) {
      ptr = this.#tail!;
      for (let i = 0; i < dt; ++i) {
        ptr = ptr.prev!;
      }
    } else {
      ptr = this.#head!;
      for (let i = 0; i < index; ++i) {
        ptr = ptr.next!;
      }
    }

    const value = ptr.value;
    ptr.next!.prev = ptr.prev;
    ptr.prev!.next = ptr.next;

    --this.#length;
    return value;
  }

  /**
   * Determines whether the linked list contains a node whose value
   * equals to the given value.
   *
   * The complexity of this operation is linear O(n).
   *
   * @param value The value to check
   * @returns `true` if the list contains the given value.
   *
   * @example Usage
   * ```ts
   * import { LinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = LinkedList.from([2, 4, 6, 8]);
   *
   * assertEquals(list.has(4), true);
   * assertEquals(list.has(0), false);
   * ```
   */
  has(value: T): boolean {
    if (!this.#head || !this.#tail) {
      return false;
    }

    let head = this.#head;
    let tail = this.#tail;

    while ((head !== tail) && (head.next !== tail)) {
      if (head.value === value || tail.value === value) {
        return true;
      }

      head = head.next!;
      tail = tail.prev!;
    }

    return head.value === value || tail.value === value;
  }

  /**
   * Removes all nodes of the linked list.
   *
   * The complexity of this operation is O(1).
   *
   * @example Usage
   * ```ts
   * import { LinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = LinkedList.from(["hello", "world"]);
   * assertEquals(list.length, 2);
   *
   * list.clear();
   *
   * assertEquals(list.length, 0);
   * assertEquals(list.pop(), undefined);
   * assertEquals(list.shift(), undefined);
   * ```
   */
  clear(): void {
    this.#head = null;
    this.#tail = null;
    this.#length = 0;
  }

  /**
   * Create an iterator that retrieves values from the linked list.
   *
   * @example Getting an iterator for the linked list
   * ```ts
   * import { LinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = LinkedList.from([1, 2, 3, 4, 5]);
   *
   * assertEquals([...list], [1, 2, 3, 4, 5]);
   * ```
   *
   * @returns An iterator for retrieving values from the linked list.
   */
  *[Symbol.iterator](): IterableIterator<T> {
    let ptr = this.#head;
    while (ptr) {
      yield ptr.value;
      ptr = ptr.next;
    }
  }
}
