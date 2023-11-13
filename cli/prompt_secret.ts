// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

const input = Deno.stdin;
const output = Deno.stdout;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const LF = "\n".charCodeAt(0);
const CR = "\r".charCodeAt(0);

/**
 * Shows the given message and waits for the user's input. Returns the user's input as string.
 * This is similar to `prompt()` but it print user's input as `*` to prevent password from being shown.
 * Use an empty `mask` if you don't want to show any character.
 */
export function promptSecret(
  message = "Secret ",
  mask = "*",
): string | null {
  if (!Deno.isatty(input.rid)) {
    return null;
  }

  const maskChar = encoder.encode(mask);
  const callback = mask === "" ? undefined : () => {
    output.writeSync(maskChar);
  };
  output.writeSync(encoder.encode(message));

  Deno.stdin.setRaw(true, { cbreak: true });
  try {
    return readLineFromStdinSync(callback);
  } finally {
    Deno.stdin.setRaw(false);
  }
}

// Slightly modified from Deno's runtime/js/41_prompt.js
// This implementation immediately break on CR or LF and accept callback.
// The original version waits LF when CR is received.
// https://github.com/denoland/deno/blob/e4593873a9c791238685dfbb45e64b4485884174/runtime/js/41_prompt.js#L52-L77
function readLineFromStdinSync(callback?: () => void): string {
  const c = new Uint8Array(1);
  const buf = [];

  while (true) {
    const n = input.readSync(c);
    if (n === null || n === 0) {
      break;
    }
    if (c[0] === CR || c[0] === LF) {
      break;
    }
    buf.push(c[0]);
    if (callback) callback();
  }
  return decoder.decode(new Uint8Array(buf));
}
