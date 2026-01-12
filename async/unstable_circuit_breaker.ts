// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Circuit breaker states following the standard pattern.
 * - `"closed"`: Normal operation, requests pass through
 * - `"open"`: Failing, all requests rejected immediately
 * - `"half_open"`: Testing recovery, limited requests allowed
 */
export type CircuitState = "closed" | "open" | "half_open";

/** Options for {@linkcode CircuitBreaker}. */
export interface CircuitBreakerOptions<T> {
  /**
   * Number of failures before opening the circuit.
   *
   * Note: For high-volume services, a low absolute threshold may cause
   * premature circuit opening during normal transient errors. Consider
   * a higher value proportional to your request volume, or combine with
   * a shorter {@linkcode failureWindowMs} to implement rate-based detection.
   *
   * @default {5}
   */
  failureThreshold?: number;

  /**
   * Duration in milliseconds the circuit stays open before entering half-open.
   *
   * @default {30000}
   */
  cooldownMs?: number;

  /**
   * Number of consecutive successes needed to close from half-open state.
   *
   * @default {2}
   */
  successThreshold?: number;

  /**
   * Maximum concurrent requests allowed in half-open state.
   *
   * @default {3}
   */
  halfOpenMaxConcurrent?: number;

  /**
   * Time window in milliseconds for counting failures.
   * Failures older than this are forgotten (sliding window).
   * Set to `0` to disable decay.
   *
   * @default {60000}
   */
  failureWindowMs?: number;

  /**
   * Custom predicate to determine if an error should count as a circuit failure.
   * By default, any thrown error is a failure.
   *
   * @param error The error that was thrown.
   * @returns `true` if the error should count as a circuit failure.
   */
  isFailure?: (error: unknown) => boolean;

  /**
   * Custom predicate to determine if a successful result should count as failure.
   * Useful for HTTP responses where status codes indicate logical failures.
   *
   * @param result The successful result.
   * @returns `true` if the result should count as a circuit failure.
   */
  isResultFailure?: (result: T) => boolean;

  /**
   * Callback invoked when circuit state changes.
   *
   * @param from Previous state.
   * @param to New state.
   */
  onStateChange?: (from: CircuitState, to: CircuitState) => void;

  /**
   * Callback invoked when a failure is recorded.
   *
   * @param error The error that caused the failure.
   * @param failureCount Current number of failures in the window.
   */
  onFailure?: (error: unknown, failureCount: number) => void;

  /**
   * Callback invoked when circuit opens.
   *
   * @param failureCount Number of failures that triggered the open.
   */
  onOpen?: (failureCount: number) => void;

  /**
   * Callback invoked when circuit enters half-open state (testing recovery).
   */
  onHalfOpen?: () => void;

  /**
   * Callback invoked when circuit closes (recovery complete).
   */
  onClose?: () => void;
}

/** Options for {@linkcode CircuitBreaker.execute}. */
export interface CircuitBreakerExecuteOptions {
  /**
   * An optional abort signal that can be used to cancel the operation
   * before it starts. If the signal is already aborted when `execute` is
   * called, the operation will fail immediately without executing the function.
   *
   * Note: This only checks the abort status before execution. It does not
   * interrupt an in-progress operation — pass the signal to your async
   * function for that behavior.
   */
  signal?: AbortSignal;
}

/** Statistics returned by {@linkcode CircuitBreaker.getStats}. */
export interface CircuitBreakerStats {
  /** Current state of the circuit breaker. */
  readonly state: CircuitState;
  /** Number of failures in the current window. */
  readonly failureCount: number;
  /** Number of consecutive successes (relevant in half-open state). */
  readonly consecutiveSuccesses: number;
  /** Whether the circuit is currently allowing requests. */
  readonly isAvailable: boolean;
}

/**
 * Error thrown when {@linkcode CircuitBreaker} is open and rejects a request.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { CircuitBreaker, CircuitBreakerOpenError } from "@std/async/unstable-circuit-breaker";
 * import { assert } from "@std/assert";
 *
 * const breaker = new CircuitBreaker({ failureThreshold: 1 });
 *
 * // Trigger a failure to open the circuit
 * try {
 *   await breaker.execute(() => Promise.reject(new Error("fail")));
 * } catch (_) {
 *   // Expected to fail
 * }
 *
 * // Now the circuit is open
 * try {
 *   await breaker.execute(() => Promise.resolve("ok"));
 * } catch (error) {
 *   assert(error instanceof CircuitBreakerOpenError);
 *   assert(error.remainingCooldownMs >= 0);
 * }
 * ```
 */
export class CircuitBreakerOpenError extends Error {
  /**
   * Milliseconds until the circuit breaker cooldown expires.
   *
   * @example Usage
   * ```ts
   * import { CircuitBreakerOpenError } from "@std/async/unstable-circuit-breaker";
   * import { assertEquals } from "@std/assert";
   *
   * const error = new CircuitBreakerOpenError(5000);
   * assertEquals(error.remainingCooldownMs, 5000);
   * ```
   */
  readonly remainingCooldownMs: number;

  /**
   * Constructs a new {@linkcode CircuitBreakerOpenError} instance.
   *
   * @param remainingCooldownMs Milliseconds until cooldown expires.
   */
  constructor(remainingCooldownMs: number) {
    super(
      `Circuit breaker is open. Retry after ${remainingCooldownMs}ms.`,
    );
    this.name = "CircuitBreakerOpenError";
    this.remainingCooldownMs = remainingCooldownMs;
  }
}

/** Base properties shared by all circuit breaker states. */
interface CircuitBreakerStateBase {
  /** Failure timestamps in milliseconds since epoch. */
  readonly failureTimestamps: readonly number[];
  readonly consecutiveSuccesses: number;
  readonly halfOpenInFlight: number;
}

/** Internal state managed by the circuit breaker (discriminated union). */
type CircuitBreakerState =
  | (CircuitBreakerStateBase & {
    readonly state: "closed";
    /** Timestamp when circuit opened, in milliseconds since epoch. */
    readonly openedAt: null;
  })
  | (CircuitBreakerStateBase & {
    readonly state: "open";
    /** Timestamp when circuit opened, in milliseconds since epoch. */
    readonly openedAt: number;
  })
  | (CircuitBreakerStateBase & {
    readonly state: "half_open";
    /** Timestamp when circuit opened, in milliseconds since epoch. */
    readonly openedAt: number;
  });

/** Creates initial circuit breaker state. */
function createInitialState(): CircuitBreakerState & { state: "closed" } {
  return {
    state: "closed",
    failureTimestamps: [],
    consecutiveSuccesses: 0,
    openedAt: null,
    halfOpenInFlight: 0,
  };
}

/**
 * Removes failure timestamps outside the decay window.
 *
 * @param timestamps Readonly array of failure timestamps in ms.
 * @param windowMs Duration window in milliseconds.
 * @param nowMs Current time in milliseconds.
 * @returns Readonly filtered array of timestamps within the window.
 */
function pruneOldFailures(
  timestamps: readonly number[],
  windowMs: number,
  nowMs: number,
): readonly number[] {
  if (windowMs === 0) return timestamps;
  const cutoff = nowMs - windowMs;
  return timestamps.filter((ts) => ts > cutoff);
}

/**
 * A circuit breaker that wraps async operations to prevent cascading failures.
 *
 * The circuit breaker monitors for failures and "trips" (opens) when a threshold
 * is reached, rejecting subsequent requests immediately without executing them.
 * After a cooldown period, it enters a "half-open" state to test if the service
 * has recovered.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { CircuitBreaker } from "@std/async/unstable-circuit-breaker";
 * import { assertEquals } from "@std/assert";
 *
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   cooldownMs: 30000,
 * });
 *
 * assertEquals(breaker.state, "closed");
 *
 * const result = await breaker.execute(() => Promise.resolve("success"));
 * assertEquals(result, "success");
 * ```
 *
 * @example Handling open circuit
 * ```ts
 * import { CircuitBreaker, CircuitBreakerOpenError } from "@std/async/unstable-circuit-breaker";
 *
 * const breaker = new CircuitBreaker({ failureThreshold: 5 });
 *
 * try {
 *   const result = await breaker.execute(() => fetch("https://api.example.com"));
 * } catch (error) {
 *   if (error instanceof CircuitBreakerOpenError) {
 *     console.log(`Service unavailable, retry in ${error.remainingCooldownMs}ms`);
 *   }
 * }
 * ```
 *
 * @example With custom failure detection
 * ```ts no-assert
 * import { CircuitBreaker } from "@std/async/unstable-circuit-breaker";
 *
 * const breaker = new CircuitBreaker<Response>({
 *   failureThreshold: 3,
 *   // Only count server errors as circuit failures
 *   isResultFailure: (response) => response.status >= 500,
 *   onStateChange: (from, to) => console.log(`Circuit: ${from} → ${to}`),
 * });
 * ```
 *
 * @example Composing with retry and AbortSignal
 * ```ts ignore
 * import { retry } from "@std/async/retry";
 * import { CircuitBreaker } from "@std/async/unstable-circuit-breaker";
 *
 * const breaker = new CircuitBreaker({ failureThreshold: 5 });
 *
 * // Timeout applies to the entire operation (circuit breaker + retries)
 * const signal = AbortSignal.timeout(5000);
 *
 * const result = await breaker.execute(
 *   () => retry(() => fetch("https://api.example.com"), { signal }),
 *   { signal },
 * );
 * ```
 *
 * @typeParam T The type of value returned by the executed function.
 */
export class CircuitBreaker<T = unknown> {
  #failureThreshold: number;
  #cooldownMs: number;
  #successThreshold: number;
  #halfOpenMaxConcurrent: number;
  #failureWindowMs: number;
  #isFailure: (error: unknown) => boolean;
  #isResultFailure: (result: T) => boolean;
  #onStateChange: ((from: CircuitState, to: CircuitState) => void) | undefined;
  #onFailure: ((error: unknown, failureCount: number) => void) | undefined;
  #onOpen: ((failureCount: number) => void) | undefined;
  #onHalfOpen: (() => void) | undefined;
  #onClose: (() => void) | undefined;
  #state: CircuitBreakerState;

  /**
   * Constructs a new {@linkcode CircuitBreaker} instance.
   *
   * @param options Configuration options for the circuit breaker.
   * @throws {RangeError} If any numeric option is not a finite number within its valid range.
   */
  constructor(options: CircuitBreakerOptions<T> = {}) {
    const {
      failureThreshold = 5,
      cooldownMs = 30_000,
      successThreshold = 2,
      halfOpenMaxConcurrent = 3,
      failureWindowMs = 60_000,
      isFailure = () => true,
      isResultFailure = () => false,
      onStateChange,
      onFailure,
      onOpen,
      onHalfOpen,
      onClose,
    } = options;

    if (!Number.isFinite(failureThreshold) || failureThreshold < 1) {
      throw new RangeError(
        `Cannot create circuit breaker as 'failureThreshold' must be a finite number >= 1: received ${failureThreshold}`,
      );
    }
    if (!Number.isFinite(cooldownMs) || cooldownMs < 0) {
      throw new RangeError(
        `Cannot create circuit breaker as 'cooldownMs' must be a finite non-negative number: received ${cooldownMs}`,
      );
    }
    if (!Number.isFinite(successThreshold) || successThreshold < 1) {
      throw new RangeError(
        `Cannot create circuit breaker as 'successThreshold' must be a finite number >= 1: received ${successThreshold}`,
      );
    }
    if (!Number.isFinite(halfOpenMaxConcurrent) || halfOpenMaxConcurrent < 1) {
      throw new RangeError(
        `Cannot create circuit breaker as 'halfOpenMaxConcurrent' must be a finite number >= 1: received ${halfOpenMaxConcurrent}`,
      );
    }
    if (!Number.isFinite(failureWindowMs) || failureWindowMs < 0) {
      throw new RangeError(
        `Cannot create circuit breaker as 'failureWindowMs' must be a finite non-negative number: received ${failureWindowMs}`,
      );
    }

    this.#failureThreshold = failureThreshold;
    this.#cooldownMs = cooldownMs;
    this.#successThreshold = successThreshold;
    this.#halfOpenMaxConcurrent = halfOpenMaxConcurrent;
    this.#failureWindowMs = failureWindowMs;
    this.#isFailure = isFailure;
    this.#isResultFailure = isResultFailure;
    this.#onStateChange = onStateChange;
    this.#onFailure = onFailure;
    this.#onOpen = onOpen;
    this.#onHalfOpen = onHalfOpen;
    this.#onClose = onClose;
    this.#state = createInitialState();
  }

  /**
   * Current stored state of the circuit breaker.
   *
   * Note: This returns the stored state without resolving time-based
   * transitions. After a cooldown expires, this may still show `"open"`
   * until the next {@linkcode execute} call or {@linkcode isAvailable}
   * check triggers the transition to `"half_open"`.
   *
   * @example Usage
   * ```ts
   * import { CircuitBreaker } from "@std/async/unstable-circuit-breaker";
   * import { assertEquals } from "@std/assert";
   *
   * const breaker = new CircuitBreaker();
   * assertEquals(breaker.state, "closed");
   * ```
   *
   * @returns The stored {@linkcode CircuitState}.
   */
  get state(): CircuitState {
    return this.#state.state;
  }

  /**
   * Number of failures in the current window.
   *
   * @example Usage
   * ```ts
   * import { CircuitBreaker } from "@std/async/unstable-circuit-breaker";
   * import { assertEquals } from "@std/assert";
   *
   * const breaker = new CircuitBreaker();
   * assertEquals(breaker.failureCount, 0);
   * ```
   *
   * @returns The number of failures recorded in the sliding window.
   */
  get failureCount(): number {
    return pruneOldFailures(
      this.#state.failureTimestamps,
      this.#failureWindowMs,
      Date.now(),
    ).length;
  }

  /**
   * Whether the circuit is currently allowing requests.
   *
   * Unlike {@linkcode state}, this resolves any pending time-based
   * transitions (e.g., `"open"` → `"half_open"` after cooldown) to ensure
   * the returned value reflects current availability.
   *
   * @example Usage
   * ```ts
   * import { CircuitBreaker } from "@std/async/unstable-circuit-breaker";
   * import { assertEquals } from "@std/assert";
   *
   * const breaker = new CircuitBreaker();
   * assertEquals(breaker.isAvailable, true);
   * ```
   *
   * @returns `true` if requests will be attempted, `false` if rejected.
   */
  get isAvailable(): boolean {
    const resolved = this.#resolveCurrentState();
    if (resolved.state === "closed") return true;
    if (resolved.state === "open") return false;
    // half_open: available if under concurrent limit
    return resolved.halfOpenInFlight < this.#halfOpenMaxConcurrent;
  }

  /**
   * Executes a function through the circuit breaker.
   *
   * The function can be synchronous or asynchronous. The result is always
   * returned as a promise.
   *
   * @example Usage with async function
   * ```ts ignore
   * import { CircuitBreaker } from "@std/async/unstable-circuit-breaker";
   *
   * const breaker = new CircuitBreaker({ failureThreshold: 5 });
   * const response = await breaker.execute(() => fetch("https://api.example.com"));
   * ```
   *
   * @example With timeout
   * ```ts ignore
   * import { CircuitBreaker } from "@std/async/unstable-circuit-breaker";
   *
   * const breaker = new CircuitBreaker({ failureThreshold: 5 });
   *
   * // Abort if operation takes longer than 5 seconds
   * const response = await breaker.execute(
   *   () => fetch("https://api.example.com"),
   *   { signal: AbortSignal.timeout(5000) },
   * );
   * ```
   *
   * @example Usage with sync function
   * ```ts
   * import { CircuitBreaker } from "@std/async/unstable-circuit-breaker";
   * import { assertEquals } from "@std/assert";
   *
   * const breaker = new CircuitBreaker({ failureThreshold: 5 });
   * const result = await breaker.execute(() => "sync result");
   * assertEquals(result, "sync result");
   * ```
   *
   * @typeParam R The return type of the function, must extend T.
   * @param fn The function to execute (sync or async).
   * @param options Optional execution options including an abort signal.
   * @returns A promise that resolves to the result of the operation.
   * @throws {CircuitBreakerOpenError} If circuit is open.
   * @throws {DOMException} If the abort signal is already aborted.
   */
  async execute<R extends T>(
    fn: () => R | Promise<R>,
    options?: CircuitBreakerExecuteOptions,
  ): Promise<R> {
    options?.signal?.throwIfAborted();

    const currentTime = Date.now();
    const currentState = this.#resolveCurrentState();

    // Check if we should reject
    if (currentState.state === "open") {
      const cooldownEnd = currentState.openedAt + this.#cooldownMs;
      const remainingMs = Math.max(0, cooldownEnd - currentTime);
      throw new CircuitBreakerOpenError(Math.round(remainingMs));
    }

    // In half-open, check concurrent limit
    if (currentState.state === "half_open") {
      if (currentState.halfOpenInFlight >= this.#halfOpenMaxConcurrent) {
        throw new CircuitBreakerOpenError(0);
      }
      this.#state = {
        ...this.#state,
        halfOpenInFlight: this.#state.halfOpenInFlight + 1,
      };
    }

    let result: R;
    try {
      result = await fn();
    } catch (error) {
      this.#handleFailure(error, currentState.state);
      throw error;
    } finally {
      // Decrement half-open in-flight counter
      if (currentState.state === "half_open") {
        this.#state = {
          ...this.#state,
          halfOpenInFlight: Math.max(0, this.#state.halfOpenInFlight - 1),
        };
      }
    }

    // Check if successful result should count as failure
    if (this.#isResultFailure(result)) {
      const syntheticError = new Error("Result classified as failure");
      this.#handleFailure(syntheticError, currentState.state);
      return result; // Still return the result, but record the failure
    }

    // Success path
    this.#handleSuccess(currentState.state);
    return result;
  }

  /**
   * Forces the circuit breaker to open state.
   * Useful for maintenance or known outages.
   *
   * @example Usage
   * ```ts
   * import { CircuitBreaker } from "@std/async/unstable-circuit-breaker";
   * import { assertEquals } from "@std/assert";
   *
   * const breaker = new CircuitBreaker();
   * breaker.forceOpen();
   * assertEquals(breaker.state, "open");
   * ```
   */
  forceOpen(): void {
    const previous = this.#state.state;
    this.#state = {
      ...this.#state,
      state: "open",
      openedAt: Date.now(),
      consecutiveSuccesses: 0,
    };
    if (previous !== "open") {
      this.#onStateChange?.(previous, "open");
      this.#onOpen?.(this.failureCount);
    }
  }

  /**
   * Forces the circuit breaker to closed state.
   * Resets all failure counters.
   *
   * @example Usage
   * ```ts
   * import { CircuitBreaker } from "@std/async/unstable-circuit-breaker";
   * import { assertEquals } from "@std/assert";
   *
   * const breaker = new CircuitBreaker();
   * breaker.forceOpen();
   * breaker.forceClose();
   * assertEquals(breaker.state, "closed");
   * ```
   */
  forceClose(): void {
    const previous = this.#state.state;
    this.#state = createInitialState();
    if (previous !== "closed") {
      this.#onStateChange?.(previous, "closed");
      this.#onClose?.();
    }
  }

  /**
   * Resets the circuit breaker to initial state.
   *
   * @example Usage
   * ```ts
   * import { CircuitBreaker } from "@std/async/unstable-circuit-breaker";
   * import { assertEquals } from "@std/assert";
   *
   * const breaker = new CircuitBreaker();
   * breaker.reset();
   * assertEquals(breaker.state, "closed");
   * assertEquals(breaker.failureCount, 0);
   * ```
   */
  reset(): void {
    const previous = this.#state.state;
    this.#state = createInitialState();
    if (previous !== "closed") {
      this.#onStateChange?.(previous, "closed");
    }
  }

  /**
   * Returns circuit breaker statistics for monitoring.
   *
   * @example Usage
   * ```ts
   * import { CircuitBreaker } from "@std/async/unstable-circuit-breaker";
   * import { assertEquals } from "@std/assert";
   *
   * const breaker = new CircuitBreaker();
   * const stats = breaker.getStats();
   * assertEquals(stats.state, "closed");
   * assertEquals(stats.failureCount, 0);
   * assertEquals(stats.isAvailable, true);
   * ```
   *
   * @returns Current stats including state, failure count, and availability.
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      consecutiveSuccesses: this.#state.consecutiveSuccesses,
      isAvailable: this.isAvailable,
    };
  }

  /**
   * Resolves the current state, handling automatic transitions.
   * OPEN → HALF_OPEN after cooldown expires.
   */
  #resolveCurrentState(): CircuitBreakerState {
    if (this.#state.state !== "open") {
      return this.#state;
    }

    const cooldownEnd = this.#state.openedAt + this.#cooldownMs;
    if (Date.now() < cooldownEnd) {
      return this.#state;
    }

    // Auto-transition from OPEN to HALF_OPEN after cooldown
    this.#state = {
      ...this.#state,
      state: "half_open",
      consecutiveSuccesses: 0,
      halfOpenInFlight: 0,
    };
    this.#onStateChange?.("open", "half_open");
    this.#onHalfOpen?.();
    return this.#state;
  }

  /** Records a failure and potentially opens the circuit. */
  #handleFailure(error: unknown, previousState: CircuitState): void {
    // Check if this error should count as a failure
    if (!this.#isFailure(error)) {
      return;
    }

    const currentTime = Date.now();

    // Prune old failures and add new one
    const prunedFailures = pruneOldFailures(
      this.#state.failureTimestamps,
      this.#failureWindowMs,
      currentTime,
    );
    const newFailures = [...prunedFailures, currentTime];

    this.#onFailure?.(error, newFailures.length);

    // In half-open, any failure reopens the circuit
    if (previousState === "half_open") {
      this.#state = {
        ...this.#state,
        state: "open",
        failureTimestamps: newFailures,
        openedAt: currentTime,
        consecutiveSuccesses: 0,
      };
      this.#onStateChange?.("half_open", "open");
      this.#onOpen?.(newFailures.length);
      return;
    }

    // In closed state, check threshold
    if (newFailures.length >= this.#failureThreshold) {
      this.#state = {
        ...this.#state,
        state: "open",
        failureTimestamps: newFailures,
        openedAt: currentTime,
        consecutiveSuccesses: 0,
      };
      this.#onStateChange?.("closed", "open");
      this.#onOpen?.(newFailures.length);
    } else {
      this.#state = {
        ...this.#state,
        failureTimestamps: newFailures,
        consecutiveSuccesses: 0,
      };
    }
  }

  /** Records a success and potentially closes the circuit from half-open. */
  #handleSuccess(previousState: CircuitState): void {
    if (previousState === "closed") {
      this.#state = { ...this.#state, consecutiveSuccesses: 0 };
      return;
    }

    const newSuccessCount = this.#state.consecutiveSuccesses + 1;
    if (newSuccessCount >= this.#successThreshold) {
      // Recovered! Close the circuit
      this.#state = createInitialState();
      this.#onStateChange?.("half_open", "closed");
      this.#onClose?.();
      return;
    }

    this.#state = { ...this.#state, consecutiveSuccesses: newSuccessCount };
  }
}
