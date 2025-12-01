// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A counting semaphore for limiting concurrent access to a resource.
 *
 * @example Usage
 * ```ts
 * import { Semaphore } from "@std/async/unstable-semaphore";
 *
 * const sem = new Semaphore(2);
 *
 * await sem.acquire();
 * // critical section
 * sem.release();
 * ```
 *
 * @example Using static registry
 * ```ts
 * import { Semaphore } from "@std/async/unstable-semaphore";
 *
 * const sem = Semaphore.get("my-resource", 3);
 * await sem.acquire();
 * // critical section
 * sem.release();
 * ```
 *
 * @module
 */

/** Internal node for the FIFO waiting queue. */
interface Node {
  res: () => void;
  next: Node | undefined;
}

/** Pre-resolved promise for zero-cost acquisition when permits are available. */
const RESOLVED = Promise.resolve();

/**
 * A counting semaphore that limits concurrent access to a shared resource.
 */
export class Semaphore {
  /** Global registry for named semaphores. */
  static #registry = new Map<unknown, Semaphore>();

  /** Maximum number of permits. */
  #max: number;
  /** Current number of available permits. */
  #count: number;
  /** Head of the waiting queue. */
  #head: Node | undefined;
  /** Tail of the waiting queue. */
  #tail: Node | undefined;

  /**
   * Creates a new semaphore with the specified number of permits.
   *
   * @param max Maximum concurrent permits. Defaults to 1 (mutex).
   */
  constructor(max: number = 1) {
    if (max <= 0) {
      throw new TypeError(
        `Cannot create semaphore as 'max' must be positive: current value is ${max}`,
      );
    }
    this.#count = this.#max = max;
  }

  /**
   * Gets or creates a named semaphore from the global registry.
   *
   * @param key The unique identifier for the semaphore.
   * @param max Maximum concurrent permits if creating new. Defaults to 1 (mutex).
   *            This parameter is ignored if a semaphore with the given key already exists.
   * @returns The semaphore associated with the key.
   */
  static get(key: unknown, max: number = 1): Semaphore {
    let sem = Semaphore.#registry.get(key);
    if (!sem) {
      sem = new Semaphore(max);
      Semaphore.#registry.set(key, sem);
    }
    return sem;
  }

  /**
   * Removes a semaphore from the global registry.
   *
   * @param key The unique identifier of the semaphore to remove.
   * @returns `true` if a semaphore was removed, `false` otherwise.
   */
  static delete(key: unknown): boolean {
    return Semaphore.#registry.delete(key);
  }

  /**
   * Acquires a permit, waiting if none are available.
   *
   * @returns A promise that resolves when a permit is acquired.
   */
  acquire(): Promise<void> {
    if (this.#count > 0) {
      this.#count--;
      return RESOLVED;
    }
    return new Promise((res) => {
      const node: Node = { res, next: undefined };
      if (this.#tail) {
        this.#tail = this.#tail.next = node;
      } else {
        this.#head = this.#tail = node;
      }
    });
  }

  /**
   * Releases a permit, allowing the next waiter to proceed.
   */
  release(): void {
    if (this.#head) {
      this.#head.res();
      this.#head = this.#head.next;
      if (!this.#head) this.#tail = undefined;
    } else if (this.#count < this.#max) {
      this.#count++;
    }
  }
}
