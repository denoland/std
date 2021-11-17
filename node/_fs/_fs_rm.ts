// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
type rmOptions = {
  force?: boolean;
  maxRetries?: number;
  recursive?: boolean;
  retryDelay?: number;
};

type rmCallback = (err?: Error) => void;

export function rm(path: string | URL, callback: rmCallback): void;
export function rm(
  path: string | URL,
  options: rmOptions,
  callback: rmCallback,
): void;
export function rm(
  path: string | URL,
  optionsOrCallback: rmOptions | rmCallback,
  maybeCallback?: rmCallback,
) {
  const callback = typeof optionsOrCallback === "function"
    ? optionsOrCallback
    : maybeCallback;
  const options = typeof optionsOrCallback === "object"
    ? optionsOrCallback
    : undefined;

  if (!callback) throw new Error("No callback function supplied");

  Deno.remove(path, { recursive: options?.recursive })
    .then((_) => callback(), (err) => {
      if (options?.force && err instanceof Deno.errors.NotFound) {
        callback();
      } else {
        callback(err);
      }
    });
}

export function rmSync(path: string | URL, options?: rmOptions) {
  try {
    Deno.removeSync(path, { recursive: options?.recursive });
  } catch (err) {
    if (options?.force && err instanceof Deno.errors.NotFound) {
      return;
    }
    throw err;
  }
}
