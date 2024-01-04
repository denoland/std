// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// TODO(kt3k): Write test when pty is supported in Deno
// See: https://github.com/denoland/deno/issues/3994

const encoder = new TextEncoder();

const LINE_CLEAR = encoder.encode("\r\u001b[K"); // From cli/prompt_secret.ts
const COLOR_RESET = "\u001b[0m";
const DEFAULT_INTERVAL = 75;
const DEFAULT_SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

// This is a hack to allow us to use the same type for both the color name and an ANSI escape code.
// ref: https://github.com/microsoft/TypeScript/issues/29729#issuecomment-460346421
// deno-lint-ignore ban-types
export type Ansi = string & {};
export type Color =
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "gray"
  | Ansi;

const COLORS: Record<Color, string> = {
  black: "\u001b[30m",
  red: "\u001b[31m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  blue: "\u001b[34m",
  magenta: "\u001b[35m",
  cyan: "\u001b[36m",
  white: "\u001b[37m",
  gray: "\u001b[90m",
};

/** Options for {@linkcode Spinner}. */
export interface SpinnerOptions {
  /**
   * The sequence of characters to be iterated through for animation.
   *
   * @default {["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]}
   */
  spinner?: string[];
  /**
   * The message to display next to the spinner. This can be changed while the
   * spinner is active.
   */
  message?: string;
  /**
   * The time between each frame of the spinner in milliseconds.
   * This can be changed while the spinner is active.
   * @default {75}
   */
  interval?: number;
  /** The color of the spinner. Defaults to the default terminal color. */
  color?: Color;
}

/**
 * A spinner that can be used to indicate that something is loading.
 */
export class Spinner {
  #spinner: string[];
  message: string;
  #interval: number;
  #color?: Color;
  #intervalId: number | undefined;
  #active = false;
  #frameIndex = 0;

  /**
   * Creates a new spinner.
   *
   * @example
   * ```ts
   * import { Spinner } from "https://deno.land/std@$STD_VERSION/cli/spinner.ts";
   *
   * const spinner = new Spinner({ message: "Loading..." });
   * ```
   */
  constructor(options?: SpinnerOptions) {
    this.#spinner = options?.spinner ?? DEFAULT_SPINNER;
    this.message = options?.message ?? "";
    this.#interval = options?.interval ?? DEFAULT_INTERVAL;
    this.#color = options?.color ? COLORS[options.color] : undefined;
  }

  set interval(value: number) {
    if (this.#interval === value) return;
    this.#interval = value;

    if (!this.#active) return;
    clearInterval(this.#intervalId);
    this.#intervalId = setInterval(
      this.#updateFrame.bind(this),
      this.#interval,
    );
  }
  get interval() {
    return this.#interval;
  }

  #updateFrame() {
    const color = this.#color ?? "";
    Deno.stdout.writeSync(LINE_CLEAR);
    const frame = encoder.encode(
      color + this.#spinner[this.#frameIndex] + COLOR_RESET + " " +
        this.#message,
    );
    Deno.stdout.writeSync(frame);
    this.#frameIndex = (this.#frameIndex + 1) % this.#spinner.length;
  }

  /**
   * Starts the spinner.
   *
   * @example
   * ```ts
   * import { Spinner } from "https://deno.land/std@$STD_VERSION/cli/spinner.ts";
   *
   * const spinner = new Spinner({ message: "Loading..." });
   * spinner.start();
   * ```
   */
  start() {
    if (this.#active || Deno.stdout.writable.locked) return;
    this.#active = true;
    this.#frameIndex = 0;
    this.#intervalId = setInterval(
      this.#updateFrame.bind(this),
      this.#interval,
    );
  }
  /**
   * Stops the spinner.
   *
   * @example
   * ```ts
   * import { Spinner } from "https://deno.land/std@$STD_VERSION/cli/spinner.ts";
   *
   * const spinner = new Spinner({ message: "Loading..." });
   * spinner.start();
   *
   * setTimeout(() => {
   *  spinner.stop();
   *  console.log("Finished loading!");
   * }, 3000);
   * ```
   */
  stop() {
    if (this.#intervalId && this.#active) {
      clearInterval(this.#intervalId);
      Deno.stdout.writeSync(LINE_CLEAR); // Clear the current line
      this.#active = false;
    }
  }
}
