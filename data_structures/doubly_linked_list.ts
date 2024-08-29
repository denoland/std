// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Represents a doubly linked list's node.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface DoublyLinkedNode<T> {
  /** The value of the node. */
  value: T;
  /** The next node. */
  next: DoublyLinkedNode<T> | null;
  /** The previous node. */
  prev: DoublyLinkedNode<T> | null;
}

/**
 * A doubly linked list is a linked data structure that consists of
 * a set of nodes. Each node contains a value and two link fields,
 * one linking to the previous node and one linking to the next node.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * | Method                 | Average Case | Worst Case |
 * | ---------------------- | ------------ | ---------- |
 * | push(value)            | O(1)         | O(1)       |
 * | pop()                  | O(1)         | O(1)       |
 * | unshift(value)         | O(1)         | O(1)       |
 * | shift()                | O(1)         | O(1)       |
 * | insert(index, value)   | O(n)         | O(n)       |
 * | remove(index)          | O(n)         | O(n)       |
 * | set(index, value)      | O(n)         | O(n)       |
 * | includes(value)        | O(n)         | O(n)       |
 *
 * @example Usage
 * ```ts
 * import { DoublyLinkedList } from "@std/data-structures";
 * import { assertEquals } from "@std/assert";
 *
 * const list = new DoublyLinkedList<string>();
 * assertEquals(list.length, 0);
 *
 * list.push("a", "b", "c");
 * list.unshift("x", "y");
 *
 * assertEquals(list.length, 5);
 * assertEquals(list.pop(), "c");
 * assertEquals(list.shift(), "y");
 * assertEquals([...list], ["x", "a", "b"]);
 *
 * list.insert(1, "z");
 * list.insert(4, "d");
 *
 * assertEquals([...list], ["x", "z", "a", "b", "d"]);
 * assertEquals(list.remove(2), "a");
 * assertEquals(list.includes("d"), true);
 * assertEquals(list.includes("a"), false);
 * assertEquals([...list], ["x", "z", "b", "d"]);
 *
 * assertEquals(list.set(3, "c"), "d");
 * assertEquals([...list], ["x", "z", "b", "c"]);
 * ```
 *
 * @typeparam T The type of the values being stored in the list.
 */
export class DoublyLinkedList<T> implements Iterable<T> {
  /** The number of nodes in the linked list. */
  #length: number;
  /** The first node of the linked list. */
  #head: DoublyLinkedNode<T> | null;
  /** The last node of the linked list. */
  #tail: DoublyLinkedNode<T> | null;

  constructor() {
    this.#length = 0;
    this.#head = null;
    this.#tail = null;
  }

  /**
   * The number of nodes in the linked list.
   *
   * @returns The number of nodes.
   *
   * @example Usage
   * ```ts
   * import { DoublyLinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = DoublyLinkedList.from([1, 2, 3, 4]);
   * assertEquals(list.length, 4);
   * ```
   */
  get length(): number {
    return this.#length;
  }

  /**
   * Gets the first node of the linked list.
   *
   * @returns The head of the list.
   *
   * @example Usage
   * ```ts
   * import { DoublyLinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = DoublyLinkedList.from([1, 3, 5]);
   * assertEquals(list.head?.value, 1);
   * ```
   */
  get head(): DoublyLinkedNode<T> | null {
    return this.#head;
  }

  /**
   * Gets the last node of the linked list.
   *
   * @returns The tail of the list.
   *
   * @example Usage
   * ```ts
   * import { DoublyLinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = DoublyLinkedList.from([1, 3, 5]);
   * assertEquals(list.tail?.value, 5);
   * ```
   */
  get tail(): DoublyLinkedNode<T> | null {
    return this.#tail;
  }

  /**
   * Creates a new linked list from an iterable object.
   *
   * @param iterable An iterable object whose elements are added to the linked list.
   * @returns A new linked list.
   *
   * @example Usage
   * ```ts
   * import { DoublyLinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = DoublyLinkedList.from([1, 2, 3]);
   * assertEquals([...list], [1, 2, 3]);
   * ```
   *
   * @typeparam T The type of the values being stored in the list.
   */
  static from<T>(
    iterable: ArrayLike<T> | Iterable<T> | DoublyLinkedList<T>,
  ): DoublyLinkedList<T> {
    const list = new DoublyLinkedList<T>();
    const data = Array.from(iterable);
    for (const value of data) list.push(value);
    return list;
  }

  /**
   * Appends one or more values to the back of the linked list.
   *
   * The complexity of this operation is O(1).
   *
   * @param value The values to be added.
   * @returns The new length of the list.
   *
   * @example Usage
   * ```ts
   * import { DoublyLinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = new DoublyLinkedList();
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
  push(...values: T[]): number {
    for (const value of values) {
      const node: DoublyLinkedNode<T> = { value, prev: this.#tail, next: null };

      if (this.#tail) {
        this.#tail.next = node;
      } else {
        this.#head = node;
      }

      this.#tail = node;
    }
    this.#length += values.length;
    return this.#length;
  }

  /**
   * Removes the last node of the linked list and returns its value, if any.
   *
   * The complexity of this operation is O(1).
   *
   * @returns The removed node's value, `undefined` if the list is empty.
   *
   * @example Usage
   * ```ts
   * import { DoublyLinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = DoublyLinkedList.from(["a", "b", "c", "d"]);
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
   * Appends one or more values to the front of the linked list.
   *
   * The complexity of this operation is O(1).
   *
   * @param value The values to be added.
   * @returns The new length of the list.
   *
   * @example Usage
   * ```ts
   * import { DoublyLinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = new DoublyLinkedList();
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
  unshift(...values: T[]): number {
    for (const value of values) {
      const node: DoublyLinkedNode<T> = { value, prev: null, next: this.#head };

      if (this.#head) {
        this.#head.prev = node;
      } else {
        this.#tail = node;
      }

      this.#head = node;
    }
    this.#length += values.length;
    return this.#length;
  }

  /**
   * Removes the first node of the linked list and returns its value, if any.
   *
   * The complexity of this operation is O(1).
   *
   * @returns The removed node's value, `undefined` if the list is empty.
   *
   * @example Usage
   * ```ts
   * import { DoublyLinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = DoublyLinkedList.from(["a", "b", "c", "d"]);
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
   * Inserts the given value to the given index.
   *
   * The complexity of this operation is linear O(n).
   *
   * @param value The value to insert.
   * @param index The position to insert.
   * @returns The new length of the list.
   * @throws If `index < 0` or `index > length`
   *
   * @example Usage
   * ```ts
   * import { DoublyLinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = DoublyLinkedList.from([2, 4, 6, 8]);
   * assertEquals([...list], [2, 4, 6, 8]);
   *
   * list.insert(0, 1);
   * assertEquals([...list], [1, 2, 4, 6, 8]);
   *
   * list.insert(2, 3);
   * assertEquals([...list], [1, 2, 3, 4, 6, 8]);
   *
   * list.insert(4, 5);
   * assertEquals([...list], [1, 2, 3, 4, 5, 6, 8]);
   *
   * list.insert(6, 7);
   * assertEquals([...list], [1, 2, 3, 4, 5, 6, 7, 8]);
   * ```
   */
  insert(index: number, value: T): number {
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

    const node: DoublyLinkedNode<T> = { value, prev: null, next: null };
    let ptr: DoublyLinkedNode<T>;

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
    ptr.prev = ptr.prev!.next;

    ++this.#length;
    return this.#length;
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
   * import { DoublyLinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = DoublyLinkedList.from([2, 4, 6, 8]);
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

    let ptr: DoublyLinkedNode<T>;

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
   * Sets a new value to the node at the given index.
   *
   * The complexity of this operation is linear O(n).
   *
   * @param value The new value to set.
   * @param index The position of the node to change the value.
   * @returns The old value of the node. `undefined` if `index < 0` or `index >= length`.
   *
   * @example Usage
   * ```ts
   * import { DoublyLinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = DoublyLinkedList.from([2, 4, 6, 8]);
   *
   * assertEquals(list.set(0, 1), 2);
   * assertEquals(list.set(3, 9), 8);
   * assertEquals([...list], [1, 4, 6, 9]);
   * ```
   */
  set(index: number, value: T): T | undefined {
    if (!this.#head || !this.#tail) {
      return undefined;
    }

    const dt = this.#length - index - 1;

    if (index < 0 || dt < 0) {
      return undefined;
    }

    let ptr: DoublyLinkedNode<T>;

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

    const oldValue = ptr.value;
    ptr.value = value;

    return oldValue;
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
   * import { DoublyLinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = DoublyLinkedList.from([2, 4, 6, 8]);
   *
   * assertEquals(list.includes(4), true);
   * assertEquals(list.includes(0), false);
   * ```
   */
  includes(value: T): boolean {
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
   * Removes all nodes from the linked list.
   *
   * The complexity of this operation is O(1).
   *
   * @example Usage
   * ```ts
   * import { DoublyLinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = DoublyLinkedList.from(["hello", "world"]);
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
   * import { DoublyLinkedList } from "@std/data-structures";
   * import { assertEquals } from "@std/assert";
   *
   * const list = DoublyLinkedList.from([1, 2, 3, 4, 5]);
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
