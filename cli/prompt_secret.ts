// Copyright 2018-2025 the Deno authors. MIT license.

import { isWindows } from "@std/internal/os";
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const LF = "\n".charCodeAt(0); // ^J - Enter on Linux
const CR = "\r".charCodeAt(0); // ^M - Enter on macOS and Windows (CRLF)
const BS = "\b".charCodeAt(0); // ^H - Backspace on Linux and Windows
const DEL = 0x7f; // ^? - Backspace on macOS
const CLR = encoder.encode("\r\u001b[K"); // Clear the current line
const MOVE_LINE_UP = encoder.encode("\r\u001b[1F"); // Move to previous line

// The `cbreak` option is not supported on Windows
const setRawOptions = isWindows ? undefined : { cbreak: true };

/** Options for {@linkcode promptSecret}. */
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
 *
 * @param message The prompt message to show to the user.
 * @param options The options for the prompt.
 * @returns The string that was entered or `null` if stdin is not a TTY.
 *
 * @example Usage
 * ```ts ignore
 * import { promptSecret } from "@std/cli/prompt-secret";
 *
 * const password = promptSecret("Please provide the password:");
 * if (password !== "some-password") {
 *   throw new Error("Access denied");
 * }
 * ```
 */
export function promptSecret(
  message = "Secret",
  options?: PromptSecretOptions,
): string | null {
  const input = Deno.stdin;
  const output = Deno.stdout;
  const { mask = "*", clear } = options ?? {};

  if (!input.isTerminal()) {
    return null;
  }

  const { columns } = Deno.consoleSize();
  let previousLength = 0;
  // Make the output consistent with the built-in prompt()
  message += " ";
  const callback = !mask ? undefined : (n: number) => {
    let line = `${message}${mask.repeat(n)}`;
    const currentLength = line.length;
    const charsPastLineLength = line.length % columns;

    if (line.length > columns) {
      line = line.slice(
        -1 * (charsPastLineLength === 0 ? columns : charsPastLineLength),
      );
    }

    // If the user has deleted a character
    if (currentLength < previousLength) {
      // Then clear the current line.
      output.writeSync(CLR);
      if (charsPastLineLength === 0) {
        // And if there's no characters on the current line, return to previous line.
        output.writeSync(MOVE_LINE_UP);
      }
    } else {
      // Always jump the cursor back to the beginning of the line unless it's the first character.
      if (charsPastLineLength !== 1) {
        output.writeSync(CLR);
      }
    }

    output.writeSync(encoder.encode(line));

    previousLength = currentLength;
  };

  output.writeSync(encoder.encode(message));

  input.setRaw(true, setRawOptions);
  try {
    return readLineFromStdinSync(callback);
  } finally {
    if (clear) {
      output.writeSync(CLR);
    } else {
      output.writeSync(encoder.encode("\n"));
    }
    input.setRaw(false);
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
    const n = Deno.stdin.readSync(c);
    if (n === null || n === 0) {
      break;
    }
    if (c[0] === CR || c[0] === LF) {
      break;
    }
    if (c[0] === BS || c[0] === DEL) {
      buf.pop();
    } else {
      buf.push(c[0]!);
    }
    if (callback) callback(buf.length);
  }
  return decoder.decode(new Uint8Array(buf));
}
