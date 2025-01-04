// Copyright 2018-2025 the Deno authors. MIT license.

/** Used internally for testing that fake time uses real time correctly. */
export const _internals = {
  Date,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  AbortSignalTimeout: AbortSignal.timeout,
};
