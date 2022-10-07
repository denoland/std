// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { Readline } from "../internal/readline/promises.mjs";

import {
  Interface as _Interface,
  kQuestion,
  kQuestionCancel,
} from "../internal/readline/interface.mjs";
import { AbortError } from "../internal/errors.ts";
import { validateAbortSignal } from "../internal/validators.mjs";

import { kEmptyObject } from "../internal/util.mjs";

export class Interface extends _Interface {
  // eslint-disable-next-line no-useless-constructor
  constructor(input, output, completer, terminal) {
    super(input, output, completer, terminal);
  }
  question(query, options = kEmptyObject) {
    return new Promise((resolve, reject) => {
      let cb = resolve;

      if (options?.signal) {
        validateAbortSignal(options.signal, "options.signal");
        if (options.signal.aborted) {
          return reject(
            new AbortError(undefined, { cause: options.signal.reason }),
          );
        }

        const onAbort = () => {
          this[kQuestionCancel]();
          reject(new AbortError(undefined, { cause: options.signal.reason }));
        };
        options.signal.addEventListener("abort", onAbort, { once: true });
        cb = (answer) => {
          options.signal.removeEventListener("abort", onAbort);
          resolve(answer);
        };
      }

      this[kQuestion](query, cb);
    });
  }
}

export function createInterface(input, output, completer, terminal) {
  return new Interface(input, output, completer, terminal);
}

export { Readline };

export default {
  Interface,
  Readline,
  createInterface,
};
