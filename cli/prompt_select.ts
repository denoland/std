// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Options for {@linkcode promptSelect}. */
export interface PromptSelectOptions {
  /** Clear the lines after the user's input. */
  clear?: boolean;
}

const ESC_KEY = "\x03";
const ARROW_UP_KEY = "\u001B[A";
const ARROW_DOWN_KEY = "\u001B[B";

const INDICATOR = "❯";

class PromptSelect {
  #selectedIndex = 0;
  #values: string[];
  #options: PromptSelectOptions;
  constructor(values: string[], options: PromptSelectOptions = {}) {
    this.#values = values;
    this.#options = options;
  }
  #render() {
    const padding = " ".repeat(INDICATOR.length);
    for (const [index, value] of this.#values.entries()) {
      const data = index === this.#selectedIndex
        ? `${INDICATOR} ${value}`
        : `${padding} ${value}`;
      Deno.stdout.writeSync(encoder.encode(data + "\r\n"));
    }
  }
  #clear(lineCount: number) {
    Deno.stdout.writeSync(encoder.encode("\x1b[1A\x1b[2K".repeat(lineCount)));
  }
  prompt(message: string): string | null {
    Deno.stdout.writeSync(encoder.encode(message + "\r\n"));

    this.#render();

    Deno.stdin.setRaw(true);

    const length = this.#values.length;

    const c = new Uint8Array(4);
    loop:
    while (true) {
      const n = Deno.stdin.readSync(c);
      if (n === null || n === 0) break;
      const input = decoder.decode(c.slice(0, n));
      switch (input) {
        case ESC_KEY:
          return Deno.exit(0);
        case ARROW_UP_KEY:
          this.#selectedIndex = Math.max(0, this.#selectedIndex - 1);
          break;
        case ARROW_DOWN_KEY:
          this.#selectedIndex = Math.min(length - 1, this.#selectedIndex + 1);
          break;
        case "\r":
          break loop;
      }
      this.#clear(length);
      this.#render();
    }
    if (this.#options.clear) {
      // clear lines and message
      this.#clear(length + 1);
    }
    Deno.stdin.setRaw(false);
    return this.#values[this.#selectedIndex] ?? null;
  }
}

/**
 * Shows the given message and waits for the user's input. Returns the user's selected value as string.
 *
 * @param message The prompt message to show to the user.
 * @param values The values for the prompt.
 * @param options The options for the prompt.
 * @returns The string that was entered or `null` if stdin is not a TTY.
 *
 * @example Usage
 * ```ts ignore
 * import { promptSelect } from "@std/cli/prompt-select";
 *
 * const browser = promptSelect("Please select a browser:", ["safari", "chrome", "firefox"], { clear: true });
 * ```
 */
export function promptSelect(
  message: string,
  values: string[],
  options: PromptSelectOptions = {},
): string | null {
  return new PromptSelect(values, options).prompt(message);
}
