// Copyright 2018-2026 the Deno authors. MIT license.

import { encodeHex } from "@std/encoding/hex";
import type { RateLimitResult } from "./rate_limiter.ts";
import type { RedisConnection, RedisEvalConnection } from "./redis_store.ts";

// --- Lua scripts ---
// Each script returns a flat array: [ok, remaining, resetAt, retryAfter, limit]
// `ok` is 1 for allowed, 0 for denied.
// All timestamps are in milliseconds.
// Scripts use redis.call('TIME') for server-side time.

// Redis TIME returns [seconds, microseconds]. Convert to milliseconds:
const LUA_NOW = `
local _t = redis.call('TIME')
local now = tonumber(_t[1]) * 1000 + math.floor(tonumber(_t[2]) / 1000)
`;

const LUA_FIXED_WINDOW_CONSUME = `${LUA_NOW}
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])

local data = redis.call('HMGET', key, 'count', 'windowStart')
local count = tonumber(data[1]) or 0
local windowStart = tonumber(data[2]) or now

if now - windowStart >= window then
  count = 0
  windowStart = windowStart + math.floor((now - windowStart) / window) * window
end

local resetAt = windowStart + window
local ok = 0
if count + cost <= limit then
  ok = 1
  count = count + cost
  redis.call('HMSET', key, 'count', count, 'windowStart', windowStart)
  redis.call('PEXPIRE', key, math.ceil(resetAt - now))
else
  redis.call('HMSET', key, 'count', count, 'windowStart', windowStart)
  redis.call('PEXPIRE', key, math.ceil(resetAt - now))
end

local remaining = math.max(0, limit - count)
local retryAfter = 0
if ok == 0 then
  retryAfter = resetAt - now
end
return {ok, remaining, tostring(resetAt), tostring(retryAfter), limit}
`;

const LUA_FIXED_WINDOW_PEEK = `-- peek-mode
${LUA_NOW}
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])

local data = redis.call('HMGET', key, 'count', 'windowStart')
local count = tonumber(data[1]) or 0
local windowStart = tonumber(data[2]) or now

if now - windowStart >= window then
  count = 0
  windowStart = windowStart + math.floor((now - windowStart) / window) * window
end

local resetAt = windowStart + window
local ok = 0
if count + cost <= limit then ok = 1 end
local remaining = math.max(0, limit - count)
local retryAfter = 0
if ok == 0 then retryAfter = resetAt - now end
return {ok, remaining, tostring(resetAt), tostring(retryAfter), limit}
`;

// Sliding window: uses a Hash where field = segment start time (ms string),
// value = count in that segment. On each call we remove fields whose segment
// start is older than `now - window`, then sum the remaining values.
const LUA_SLIDING_WINDOW_CONSUME = `${LUA_NOW}
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local segments = tonumber(ARGV[4])
local segDur = window / segments

local segStart = now - (now % segDur)
local cutoff = now - window

local fields = redis.call('HGETALL', key)
local total = 0
local toDel = {}
for i = 1, #fields, 2 do
  local seg = tonumber(fields[i])
  if seg <= cutoff then
    toDel[#toDel + 1] = fields[i]
  else
    total = total + tonumber(fields[i + 1])
  end
end
if #toDel > 0 then
  redis.call('HDEL', key, unpack(toDel))
end

local resetAt = segStart + segDur
local ok = 0
if total + cost <= limit then
  ok = 1
  redis.call('HINCRBY', key, tostring(segStart), cost)
  total = total + cost
  redis.call('PEXPIRE', key, window + segDur)
end

local remaining = math.max(0, limit - total)
local retryAfter = 0
if ok == 0 then retryAfter = resetAt - now end
return {ok, remaining, tostring(resetAt), tostring(retryAfter), limit}
`;

const LUA_SLIDING_WINDOW_PEEK = `-- peek-mode
${LUA_NOW}
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local segments = tonumber(ARGV[4])
local segDur = window / segments

local segStart = now - (now % segDur)
local cutoff = now - window

local fields = redis.call('HGETALL', key)
local total = 0
local toDel = {}
for i = 1, #fields, 2 do
  local seg = tonumber(fields[i])
  if seg <= cutoff then
    toDel[#toDel + 1] = fields[i]
  else
    total = total + tonumber(fields[i + 1])
  end
end
if #toDel > 0 then
  redis.call('HDEL', key, unpack(toDel))
end

local resetAt = segStart + segDur
local ok = 0
if total + cost <= limit then ok = 1 end
local remaining = math.max(0, limit - total)
local retryAfter = 0
if ok == 0 then retryAfter = resetAt - now end
return {ok, remaining, tostring(resetAt), tostring(retryAfter), limit}
`;

const LUA_TOKEN_BUCKET_CONSUME = `${LUA_NOW}
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local tokensPerPeriod = tonumber(ARGV[4])

local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(data[1])
local lastRefill = tonumber(data[2])

if tokens == nil then
  tokens = limit
  lastRefill = now
else
  local elapsed = now - lastRefill
  if elapsed >= window then
    local cycles = math.floor(elapsed / window)
    tokens = math.min(limit, tokens + cycles * tokensPerPeriod)
    lastRefill = lastRefill + cycles * window
  end
end

local ok = 0
if tokens >= cost then
  ok = 1
  tokens = tokens - cost
end

redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
local resetAt = lastRefill + window
redis.call('PEXPIRE', key, math.max(1, math.ceil(resetAt - now) + window))

local remaining = math.max(0, math.floor(tokens))
local retryAfter = 0
if ok == 0 then
  local deficit = cost - tokens
  local cycles = math.ceil(deficit / tokensPerPeriod)
  retryAfter = math.max(0, cycles * window - (now - lastRefill))
end
return {ok, remaining, tostring(resetAt), tostring(retryAfter), limit}
`;

const LUA_TOKEN_BUCKET_PEEK = `-- peek-mode
${LUA_NOW}
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local tokensPerPeriod = tonumber(ARGV[4])

local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(data[1])
local lastRefill = tonumber(data[2])

if tokens == nil then
  tokens = limit
  lastRefill = now
else
  local elapsed = now - lastRefill
  if elapsed >= window then
    local cycles = math.floor(elapsed / window)
    tokens = math.min(limit, tokens + cycles * tokensPerPeriod)
    lastRefill = lastRefill + cycles * window
  end
end

local ok = 0
if tokens >= cost then ok = 1 end
local remaining = math.max(0, math.floor(tokens))
local resetAt = lastRefill + window
local retryAfter = 0
if ok == 0 then
  local deficit = cost - tokens
  local cycles = math.ceil(deficit / tokensPerPeriod)
  retryAfter = math.max(0, cycles * window - (now - lastRefill))
end
return {ok, remaining, tostring(resetAt), tostring(retryAfter), limit}
`;

const LUA_GCRA_CONSUME = `${LUA_NOW}
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local emissionInterval = window / limit
local tau = window

local tat = tonumber(redis.call('GET', key)) or now

local allowAt = tat - tau
if now < allowAt then
  local remaining = 0
  local retryAfter = allowAt - now
  local resetAt = tat
  return {0, remaining, tostring(resetAt), tostring(retryAfter), limit}
end

local newTat = math.max(tat, now) + emissionInterval * cost
if newTat - now > tau then
  local diff = tau - (tat - now)
  local remaining = math.min(limit, math.max(0, math.floor(diff / emissionInterval)))
  local retryAfter = math.max(0, newTat - tau - now)
  local resetAt = tat
  return {0, remaining, tostring(resetAt), tostring(retryAfter), limit}
end

redis.call('SET', key, tostring(newTat), 'PX', math.ceil(newTat - now + tau))
local diff = tau - (newTat - now)
local remaining = math.min(limit, math.max(0, math.floor(diff / emissionInterval)))
return {1, remaining, tostring(newTat), '0', limit}
`;

const LUA_GCRA_PEEK = `-- peek-mode
${LUA_NOW}
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local emissionInterval = window / limit
local tau = window

local tat = tonumber(redis.call('GET', key)) or now

local allowAt = tat - tau
if now < allowAt then
  local remaining = 0
  local retryAfter = allowAt - now
  local resetAt = tat
  return {0, remaining, tostring(resetAt), tostring(retryAfter), limit}
end

local newTat = math.max(tat, now) + emissionInterval * cost
local diff = tau - (tat - now)
local remaining = math.min(limit, math.max(0, math.floor(diff / emissionInterval)))
if newTat - now > tau then
  local retryAfter = math.max(0, newTat - tau - now)
  return {0, remaining, tostring(tat), tostring(retryAfter), limit}
end
return {1, remaining, tostring(tat), '0', limit}
`;

export const LUA_DELETE_KEY = `
redis.call('DEL', KEYS[1])
return 1
`;

export interface LuaScriptPair {
  consume: string;
  peek: string;
}

export function getScripts(algorithm: string): LuaScriptPair {
  switch (algorithm) {
    case "fixed-window":
      return {
        consume: LUA_FIXED_WINDOW_CONSUME,
        peek: LUA_FIXED_WINDOW_PEEK,
      };
    case "sliding-window":
      return {
        consume: LUA_SLIDING_WINDOW_CONSUME,
        peek: LUA_SLIDING_WINDOW_PEEK,
      };
    case "token-bucket":
      return {
        consume: LUA_TOKEN_BUCKET_CONSUME,
        peek: LUA_TOKEN_BUCKET_PEEK,
      };
    case "gcra":
      return { consume: LUA_GCRA_CONSUME, peek: LUA_GCRA_PEEK };
    default:
      throw new TypeError(
        `Cannot create redis store: unknown algorithm '${algorithm}'`,
      );
  }
}

export async function sha1Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return encodeHex(hash);
}

export interface CachedScript {
  source: string;
  sha: string;
}

/**
 * Normalizes any {@linkcode RedisConnection} into the `eval`/`evalsha`
 * shape used internally. If the connection already has `eval`/`evalsha`,
 * it is returned as-is. If it only has `sendCommand`, a thin adapter is
 * created.
 */
export function toEvalConnection(
  redis: RedisConnection,
): RedisEvalConnection {
  if ("eval" in redis) return redis;
  const conn = redis;
  return {
    eval(script: string, keys: string[], args: string[]): Promise<unknown> {
      return conn.sendCommand(["EVAL", script, keys.length, ...keys, ...args]);
    },
    evalsha(sha: string, keys: string[], args: string[]): Promise<unknown> {
      return conn.sendCommand([
        "EVALSHA",
        sha,
        keys.length,
        ...keys,
        ...args,
      ]);
    },
  };
}

function isNoscriptError(err: unknown): boolean {
  if (err instanceof Error) {
    return err.message.includes("NOSCRIPT");
  }
  return String(err).includes("NOSCRIPT");
}

export async function runScript(
  redis: RedisEvalConnection,
  script: CachedScript,
  keys: string[],
  args: string[],
): Promise<unknown> {
  try {
    return await redis.evalsha(script.sha, keys, args);
  } catch (err) {
    if (isNoscriptError(err)) {
      return await redis.eval(script.source, keys, args);
    }
    throw err;
  }
}

export function parseResult(raw: unknown, limit: number): RateLimitResult {
  if (!Array.isArray(raw) || raw.length < 4) {
    throw new TypeError(
      `Cannot parse rate limit result: expected an array of length >= 4, received ${
        JSON.stringify(raw)
      }`,
    );
  }
  const ok = raw[0] === 1;
  const remaining = Number(raw[1]);
  const resetAt = Number(raw[2]);
  const retryAfter = Number(raw[3]);
  if (
    Number.isNaN(remaining) || Number.isNaN(resetAt) || Number.isNaN(retryAfter)
  ) {
    throw new TypeError(
      `Cannot parse rate limit result: numeric fields contain NaN (remaining=${
        raw[1]
      }, resetAt=${raw[2]}, retryAfter=${raw[3]})`,
    );
  }
  return { ok, remaining, resetAt, retryAfter, limit };
}
