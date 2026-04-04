// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Options for {@linkcode Lazy.prototype.get}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface LazyGetOptions {
  /**
   * Signal used to abort the wait for initialization.
   *
   * Aborting does not cancel the underlying initializer — it only rejects the
   * caller's promise. Other callers and any in-flight initialization are
   * unaffected.
   */
  signal?: AbortSignal;
}

/**
 * A lazy value that is initialized at most once, with built-in deduplication of
 * concurrent callers. Prevents the common race where two concurrent `get()` calls
 * both trigger the initializer; only one initialization runs and all callers share
 * the same promise.
 *
 * If the initializer rejects, the error is propagated to all concurrent callers
 * and the internal state is cleared — the next {@linkcode Lazy.prototype.get}
 * call will re-run the initializer. Compose with {@linkcode retry} for
 * automatic back-off on transient failures.
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
 * @experimental **UNSTABLE**: New API, yet to be vetted.
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
   * @example Usage
   * ```ts no-assert
   * import { Lazy } from "@std/async/unstable-lazy";
   *
   * const config = new Lazy(async () => ({ loaded: true }));
   * const value = await config.get();
   * ```
   *
   * @example Abort a slow initialization
   * ```ts
   * import { Lazy } from "@std/async/unstable-lazy";
   * import { assertRejects } from "@std/assert";
   *
   * const slow = new Lazy(() => new Promise<string>(() => {}));
   * const controller = new AbortController();
   * controller.abort(new Error("timed out"));
   * await assertRejects(
   *   () => slow.get({ signal: controller.signal }),
   *   Error,
   *   "timed out",
   * );
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param options Optional settings for this call.
   * @returns The cached or newly initialized value.
   */
  get(options?: LazyGetOptions): Promise<T> {
    const signal = options?.signal;
    if (signal?.aborted) return Promise.reject(signal.reason);

    if (this.#promise === undefined) {
      const p = new Promise<T>((resolve, reject) => {
        Promise.resolve().then(() => this.#init()).then(
          (value) => {
            if (this.#promise === p) {
              this.#value = value;
              this.#settled = true;
            }
            resolve(value);
          },
          (err) => {
            if (this.#promise === p) {
              this.#promise = undefined;
            }
            reject(err);
          },
        );
      });
      this.#promise = p;
    }

    if (!signal) return this.#promise;

    return new Promise<T>((resolve, reject) => {
      const abort = () => reject(signal.reason);
      signal.addEventListener("abort", abort, { once: true });
      this.#promise!.then(
        (value) => {
          signal.removeEventListener("abort", abort);
          resolve(value);
        },
        (err) => {
          signal.removeEventListener("abort", abort);
          reject(err);
        },
      );
    });
  }

  /**
   * Whether the value has been successfully initialized.
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
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @returns `true` if the value has been initialized, `false` otherwise.
   */
  get initialized(): boolean {
    return this.#settled;
  }

  /**
   * Returns the value if already resolved, or indicates that it is not yet
   * available. The discriminated union avoids ambiguity when `T` itself can
   * be `undefined`.
   *
   * @example Fast-path when already initialized
   * ```ts
   * import { Lazy } from "@std/async/unstable-lazy";
   * import { assertEquals } from "@std/assert";
   *
   * const config = new Lazy(async () => ({ port: 8080 }));
   * await config.get();
   *
   * const result = config.peek();
   * assertEquals(result, { ok: true, value: { port: 8080 } });
   * ```
   *
   * @example Not yet initialized
   * ```ts
   * import { Lazy } from "@std/async/unstable-lazy";
   * import { assertEquals } from "@std/assert";
   *
   * const lazy = new Lazy(() => 42);
   * assertEquals(lazy.peek(), { ok: false });
   * ```
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @returns `{ ok: true, value }` if the value has been initialized, or
   *   `{ ok: false }` if not yet initialized or still in-flight.
   */
  peek(): { ok: true; value: T } | { ok: false } {
    return this.#settled
      ? { ok: true, value: this.#value as T }
      : { ok: false };
  }

  /**
   * Resets the lazy so the next {@linkcode get} re-runs the initializer. Does
   * not cancel an in-flight initialization; callers that already have the
   * promise will still receive its result.
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
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   */
  reset(): void {
    this.#promise = undefined;
    this.#value = undefined;
    this.#settled = false;
  }
}
