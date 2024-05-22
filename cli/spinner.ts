// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

const encoder = new TextEncoder();

const LINE_CLEAR = encoder.encode("\r\u001b[K"); // From cli/prompt_secret.ts
const COLOR_RESET = "\u001b[0m";
const DEFAULT_INTERVAL = 75;
const DEFAULT_SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/**
 * This is a hack to allow us to use the same type for both the color name and
 * an ANSI escape code.
 *
 * @see {@link https://github.com/microsoft/TypeScript/issues/29729#issuecomment-460346421}
 *
 * @internal
 */
// deno-lint-ignore ban-types
export type Ansi = string & {};

/** Color options for {@linkcode SpinnerOptions.color}. */
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
   *
   * @default {75}
   */
  interval?: number;
  /**
   * The color of the spinner. Defaults to the default terminal color.
   * This can be changed while the spinner is active.
   */
  color?: Color;
}

/**
 * A spinner that can be used to indicate that something is loading.
 *
 * @example Usage
 * ```ts no-eval
 * import { Spinner } from "@std/cli/spinner";
 *
 * const spinner = new Spinner({ message: "Loading...", color: "yellow" });
 * spinner.start();
 *
 * setTimeout(() => {
 *  spinner.stop();
 *  console.log("Finished loading!");
 * }, 3_000);
 * ```
 */
export class Spinner {
  #spinner: string[];

  /**
   * The message to display next to the spinner.
   *
   * @example Usage
   * ```ts no-eval
   * import { Spinner } from "@std/cli/spinner";
   *
   * const loadingText = "Loading...";
   * const startTime = new Date().getTime();
   * const spinner = new Spinner({ message: loadingText, color: "yellow" });
   * spinner.start();
   *
   * setInterval(() => {
   *   const durationMs = new Date().getTime() - startTime;
   *   const durationSec = Math.round(durationMs / 1_000);
   *   spinner.message = `${loadingText} (${durationSec}s)`;
   * }, 1_000);
   * ```
   */
  message: string;

  #interval: number;
  #color?: Color;
  #intervalId: number | undefined;
  #active = false;

  /**
   * Creates a new spinner.
   *
   * @example Usage
   * ```ts
   * import { Spinner } from "@std/cli/spinner";
   *
   * const spinner = new Spinner({ message: "Loading..." });
   * ```
   */
  constructor(
    {
      spinner = DEFAULT_SPINNER,
      message = "",
      interval = DEFAULT_INTERVAL,
      color,
    }: SpinnerOptions = {},
  ) {
    this.#spinner = spinner;
    this.message = message;
    this.#interval = interval;
    this.color = color;
  }

  /**
   * Set the color of the spinner. This defaults to the default terminal color.
   * This can be changed while the spinner is active.
   *
   * Providing `undefined` will use the default terminal color.
   *
   * @param value Color to set.
   *
   * @example Usage
   * ```ts
   * import { Spinner } from "@std/cli/spinner";
   *
   * const spinner = new Spinner({ message: "Loading..." });
   * spinner.color = "yellow";
   * ```
   */
  set color(value: Color | undefined) {
    this.#color = value ? COLORS[value] : undefined;
  }

  /**
   * Gets the color of the spinner.
   *
   * @example Usage
   * ```ts
   * import { Spinner } from "@std/cli/spinner";
   *
   * const spinner = new Spinner({ message: "Loading", color: "blue" });
   * console.log(spinner.color); // "blue"
   * ```
   * @returns The color of the spinner or `undefined` if it's using the terminal default.
   */
  get color(): Color | undefined {
    return this.#color;
  }

  /**
   * Starts the spinner.
   *
   * @example Usage
   * ```ts no-eval
   * import { Spinner } from "@std/cli/spinner";
   *
   * const spinner = new Spinner({ message: "Loading..." });
   * spinner.start();
   * ```
   */
  start() {
    if (this.#active || Deno.stdout.writable.locked) return;
    this.#active = true;
    let i = 0;
    const noColor = Deno.noColor;
    // Updates the spinner after the given interval.
    const updateFrame = () => {
      const color = this.#color ?? "";
      Deno.stdout.writeSync(LINE_CLEAR);
      const frame = encoder.encode(
        noColor
          ? this.#spinner[i] + " " + this.message
          : color + this.#spinner[i] + COLOR_RESET + " " + this.message,
      );
      Deno.stdout.writeSync(frame);
      i = (i + 1) % this.#spinner.length;
    };
    this.#intervalId = setInterval(updateFrame, this.#interval);
  }
  /**
   * Stops the spinner.
   *
   * @example Usage
   * ```ts no-eval
   * import { Spinner } from "@std/cli/spinner";
   *
   * const spinner = new Spinner({ message: "Loading..." });
   * spinner.start();
   *
   * setTimeout(() => {
   *  spinner.stop();
   *  console.log("Finished loading!");
   * }, 3_000);
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
