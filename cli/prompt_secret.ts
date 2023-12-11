// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

const input = Deno.stdin;
const output = Deno.stdout;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const LF = "\n".charCodeAt(0); // ^J - Enter on Linux
const CR = "\r".charCodeAt(0); // ^M - Enter on macOS and Windows (CRLF)
const BS = "\b".charCodeAt(0); // ^H - Backspace on Linux and Windows
const DEL = 0x7f; // ^? - Backspace on macOS
const CLR = encoder.encode("\r\u001b[K"); // Clear the current line

// The `cbreak` option is not supported on Windows
const setRawOptions = Deno.build.os === "windows"
  ? undefined
  : { cbreak: true };

export type PromptSecretOptions = {
  /** A character to print instead of the user's input. */
  mask?: string;
  /** Clear the current line after the user's input. */
  clear?: boolean;
};

/**
 * Shows the given message and waits for the user's input. Returns the user's input as string.
 * This is similar to `prompt()` but it print user's input as `*` to prevent password from being shown.
 * Use an empty `mask` if you don't want to show any character.
 */
export function promptSecret(
  message = "Secret ",
  { mask = "*", clear }: PromptSecretOptions = {},
): string | null {
  if (!Deno.isatty(input.rid)) {
    return null;
  }

  const callback = !mask ? undefined : (n: number) => {
    output.writeSync(CLR);
    output.writeSync(encoder.encode(`${message}${mask.repeat(n)}`));
  };
  output.writeSync(encoder.encode(message));

  Deno.stdin.setRaw(true, setRawOptions);
  try {
    return readLineFromStdinSync(callback);
  } finally {
    if (clear) {
      output.writeSync(CLR);
    } else {
      output.writeSync(encoder.encode("\n"));
    }
    Deno.stdin.setRaw(false);
  }
}

// Slightly modified from Deno's runtime/js/41_prompt.js
// This implementation immediately break on CR or LF and accept callback.
// The original version waits LF when CR is received.
// https://github.com/denoland/deno/blob/e4593873a9c791238685dfbb45e64b4485884174/runtime/js/41_prompt.js#L52-L77
function readLineFromStdinSync(callback?: (n: number) => void): string {
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
    if (c[0] === BS || c[0] === DEL) {
      buf.pop();
    } else {
      buf.push(c[0]);
    }
    if (callback) callback(buf.length);
  }
  return decoder.decode(new Uint8Array(buf));
}
