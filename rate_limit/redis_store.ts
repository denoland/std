// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * A Redis-backed {@linkcode RateLimitStore} for distributed rate limiting.
 *
 * All rate limit state is stored in Redis and manipulated atomically via
 * Lua scripts, making this safe for multi-process / multi-server deployments.
 * The store uses `redis.call('TIME')` inside Lua for server-side timestamps,
 * so clock skew between application servers does not affect correctness.
 *
 * The store does not own the Redis connection — disposal is a no-op.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Creating a Redis store
 * ```ts ignore
 * import { createRedisStore } from "@std/rate-limit/redis-store";
 * import { createRateLimiter } from "@std/rate-limit/rate-limiter";
 *
 * const store = createRedisStore({
 *   redis: myRedisClient,
 *   algorithm: "sliding-window",
 *   limit: 100,
 *   window: 60_000,
 * });
 *
 * await using limiter = createRateLimiter({ store });
 * const result = await limiter.limit(ip);
 * ```
 *
 * @module
 */

import type {
  AlgorithmOptions,
  RateLimitResult,
  RateLimitStore,
} from "./store_types.ts";
import { assertPositiveFinite, assertPositiveInteger } from "./_validation.ts";
import {
  type CachedScript,
  getScripts,
  LUA_DELETE_KEY,
  parseResult,
  runScript,
  sha1Hex,
  toEvalConnection,
} from "./_redis_scripts.ts";

/**
 * Redis connection that exposes `eval` and `evalsha` methods. This is
 * the interface used by clients such as `ioredis`, `node-redis`, and
 * `@db/redis`.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface RedisEvalConnection {
  /**
   * Execute a Lua script on the Redis server.
   *
   * @param script The Lua script source.
   * @param keys Redis keys the script operates on.
   * @param args Additional arguments passed to the script.
   * @returns The script's return value.
   */
  eval(script: string, keys: string[], args: string[]): Promise<unknown>;

  /**
   * Execute a cached Lua script by its SHA1 hash.
   *
   * @param sha The SHA1 digest of the script.
   * @param keys Redis keys the script operates on.
   * @param args Additional arguments passed to the script.
   * @returns The script's return value.
   */
  evalsha(sha: string, keys: string[], args: string[]): Promise<unknown>;
}

/**
 * Redis connection that exposes a single `sendCommand` method. This is
 * the interface used by `@iuioiua/redis` and other minimal clients.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface RedisSendCommandConnection {
  /**
   * Send a raw Redis command and return the parsed reply.
   *
   * @param args The command arguments (e.g. `["SET", "key", "value"]`).
   * @returns The server's reply.
   */
  sendCommand(args: readonly (string | number)[]): Promise<unknown>;
}

/**
 * A Redis connection accepted by {@linkcode createRedisStore}.
 *
 * Supports two shapes:
 * - `eval`/`evalsha` methods (ioredis, node-redis, `@db/redis`)
 * - `sendCommand` (e.g. `@iuioiua/redis`)
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export type RedisConnection = RedisEvalConnection | RedisSendCommandConnection;

/**
 * Options for {@linkcode createRedisStore}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface RedisStoreOptions extends AlgorithmOptions {
  /** The Redis connection to use. */
  redis: RedisConnection;
  /**
   * Key prefix for Redis keys.
   *
   * @default {"rl"}
   */
  prefix?: string;
}

/**
 * Create a Redis-backed rate limit store. All state is stored in Redis
 * and manipulated atomically via Lua scripts.
 *
 * The store does not own the Redis connection — `[Symbol.asyncDispose]`
 * is a no-op. The caller is responsible for closing the connection.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Basic usage
 * ```ts ignore
 * import { createRedisStore } from "@std/rate-limit/redis-store";
 * import { createRateLimiter } from "@std/rate-limit/rate-limiter";
 *
 * const store = createRedisStore({
 *   redis: myRedisClient,
 *   algorithm: "sliding-window",
 *   limit: 100,
 *   window: 60_000,
 * });
 *
 * await using limiter = createRateLimiter({ store });
 * const result = await limiter.limit(ip);
 * ```
 *
 * @param options Configuration for the Redis store.
 * @returns A {@linkcode RateLimitStore}.
 */
export function createRedisStore(
  options: RedisStoreOptions,
): RateLimitStore {
  const context = "redis store";
  assertPositiveInteger(context, "limit", options.limit);
  assertPositiveFinite(context, "window", options.window);

  const {
    redis: rawRedis,
    algorithm: algorithmName = "sliding-window",
    limit,
    window: windowMs,
    segmentsPerWindow = 10,
    tokensPerPeriod = limit,
    prefix = "rl",
  } = options;

  const redis = toEvalConnection(rawRedis);

  if (algorithmName === "sliding-window") {
    if (!Number.isInteger(segmentsPerWindow) || segmentsPerWindow < 2) {
      throw new RangeError(
        `Cannot create ${context}: 'segmentsPerWindow' must be an integer >= 2, received ${segmentsPerWindow}`,
      );
    }
    if (windowMs % segmentsPerWindow !== 0) {
      throw new RangeError(
        `Cannot create ${context}: 'window' (${windowMs}) must be evenly divisible by 'segmentsPerWindow' (${segmentsPerWindow})`,
      );
    }
  }

  if (algorithmName === "token-bucket") {
    assertPositiveInteger(context, "tokensPerPeriod", tokensPerPeriod);
    if (tokensPerPeriod > limit) {
      throw new RangeError(
        `Cannot create ${context}: 'tokensPerPeriod' (${tokensPerPeriod}) exceeds 'limit' (${limit})`,
      );
    }
  }

  const scripts = getScripts(algorithmName);

  let consumeScript: CachedScript | undefined;
  let peekScript: CachedScript | undefined;
  let deleteScript: CachedScript | undefined;
  let initScripts: Promise<void> | undefined;

  function ensureScripts(): Promise<void> {
    if (initScripts) return initScripts;
    initScripts = (async () => {
      const [consumeSha, peekSha, deleteSha] = await Promise.all([
        sha1Hex(scripts.consume),
        sha1Hex(scripts.peek),
        sha1Hex(LUA_DELETE_KEY),
      ]);
      consumeScript = { source: scripts.consume, sha: consumeSha };
      peekScript = { source: scripts.peek, sha: peekSha };
      deleteScript = { source: LUA_DELETE_KEY, sha: deleteSha };
    })();
    return initScripts;
  }

  function redisKey(key: string): string {
    return `${prefix}:${key}`;
  }

  function buildArgs(): string[] {
    const args = [String(limit), String(windowMs)];
    if (algorithmName === "sliding-window") {
      return [...args, "", String(segmentsPerWindow)];
    }
    if (algorithmName === "token-bucket") {
      return [...args, "", String(tokensPerPeriod)];
    }
    return [...args, ""];
  }

  const baseArgs = buildArgs();

  return {
    get capacity(): number {
      return limit;
    },
    get window(): number {
      return windowMs;
    },
    async consume(key: string, cost: number): Promise<RateLimitResult> {
      await ensureScripts();
      const args = [...baseArgs];
      args[2] = String(cost);
      const raw = await runScript(
        redis,
        consumeScript!,
        [redisKey(key)],
        args,
      );
      return parseResult(raw, limit);
    },
    async peek(key: string, cost: number): Promise<RateLimitResult> {
      await ensureScripts();
      const args = [...baseArgs];
      args[2] = String(cost);
      const raw = await runScript(
        redis,
        peekScript!,
        [redisKey(key)],
        args,
      );
      return parseResult(raw, limit);
    },
    async reset(key: string): Promise<void> {
      await ensureScripts();
      await runScript(redis, deleteScript!, [redisKey(key)], []);
    },
    [Symbol.asyncDispose](): Promise<void> {
      return Promise.resolve();
    },
  };
}
