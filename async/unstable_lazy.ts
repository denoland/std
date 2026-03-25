// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A lazy value that is initialized at most once, with built-in deduplication of
 * concurrent callers. Prevents the common race where two concurrent `get()` calls
 * both trigger the initializer; only one initialization runs and all callers share
 * the same promise.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Concurrent deduplication
 *
 * ```ts
 * import { Lazy } from "@std/async/unstable-lazy";
 * import { assertEquals } from "@std/assert";
 *
 * let initCount = 0;
 * const config = new Lazy<number>(async () => {
 *   initCount++;
 *   return 42;
 * });
 *
 * const [a, b] = await Promise.all([config.get(), config.get()]);
 * assertEquals(a, 42);
 * assertEquals(b, 42);
 * assertEquals(initCount, 1);
 * ```
 *
 * @example Composing with retry
 *
 * ```ts ignore
 * import { Lazy } from "@std/async/unstable-lazy";
 * import { retry } from "@std/async/retry";
 *
 * const db = new Lazy(() =>
 *   retry(() => connectDb(), { minTimeout: 100, maxAttempts: 3 })
 * );
 * await db.get();
 * ```
 *
 * @typeParam T The type of the lazily initialized value.
 */
export class Lazy<T> {
  #init: () => T | Promise<T>;
  #promise: Promise<T> | undefined = undefined;
  #value: T | undefined = undefined;
  #settled = false;

  /**
   * Creates a new lazy value.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param init Initializer function, called at most once (until {@linkcode reset}).
   */
  constructor(init: () => T | Promise<T>) {
    this.#init = init;
  }

  /**
   * Returns the cached value, initializing it on first call. Concurrent callers
   * share the same in-flight promise — the initializer is never invoked more
   * than once at a time.
   *
   * Always returns a promise, even when the initializer is synchronous.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Usage
   * ```ts no-assert
   * import { Lazy } from "@std/async/unstable-lazy";
   *
   * const config = new Lazy(async () => ({ loaded: true }));
   * const value = await config.get();
   * ```
   *
   * @returns The cached or newly initialized value.
   */
  get(): Promise<T> {
    if (this.#promise !== undefined) {
      return this.#promise;
    }
    const p = Promise.resolve().then(() => this.#init());
    this.#promise = p;
    p.then(
      (value) => {
        if (this.#promise === p) {
          this.#value = value;
          this.#settled = true;
        }
        return value;
      },
      (_err) => {
        if (this.#promise === p) {
          this.#promise = undefined;
        }
      },
    );
    return p;
  }

  /**
   * Whether the value has been successfully initialized. Useful for
   * distinguishing "not yet initialized" from "initialized with `undefined`"
   * when `T` can be `undefined`.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Check initialization state
   * ```ts
   * import { Lazy } from "@std/async/unstable-lazy";
   * import { assertEquals } from "@std/assert";
   *
   * const lazy = new Lazy(() => 42);
   * assertEquals(lazy.initialized, false);
   * await lazy.get();
   * assertEquals(lazy.initialized, true);
   * ```
   *
   * @returns `true` if the value has been initialized, `false` otherwise.
   */
  get initialized(): boolean {
    return this.#settled;
  }

  /**
   * Returns the value if already resolved, `undefined` otherwise. Useful for
   * fast-path checks where you do not want to await. Returns `undefined` while
   * initialization is in-flight.
   *
   * If `T` can be `undefined`, use {@linkcode initialized} to distinguish
   * "not yet initialized" from "initialized with `undefined`".
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Fast-path when already initialized
   * ```ts no-assert
   * import { Lazy } from "@std/async/unstable-lazy";
   *
   * const config = new Lazy(async () => ({ port: 8080 }));
   * await config.get();
   *
   * const cached = config.peek();
   * if (cached !== undefined) {
   *   console.log("using cached", cached.port);
   * }
   * ```
   *
   * @returns The resolved value, or `undefined` if not yet initialized or still in-flight.
   */
  peek(): T | undefined {
    return this.#settled ? this.#value : undefined;
  }

  /**
   * Resets the lazy so the next {@linkcode get} re-runs the initializer. Does
   * not cancel an in-flight initialization; callers that already have the
   * promise will still receive its result.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @example Force reload
   * ```ts ignore
   * import { Lazy } from "@std/async/unstable-lazy";
   *
   * const config = new Lazy(async () => loadConfig());
   * await config.get();
   * config.reset();
   * const fresh = await config.get();
   * ```
   */
  reset(): void {
    this.#promise = undefined;
    this.#value = undefined;
    this.#settled = false;
  }
}
