// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

const encoder = new TextEncoder();

const LINE_CLEAR = encoder.encode("\r\u001b[K"); // From cli/prompt_secret.ts
const COLOR_RESET = "\u001b[0m";
const DEFAULT_SPEED = 75;
const DEFAULT_SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/** Options for {@linkcode Spinner}. */
export interface SpinnerOptions {
  /**
   * The sequence of characters to be iterated through for animation.
   *
   * @default {["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]}
   */
  spinner?: string[];
  /** The message to display next to the spinner. */
  message?: string;
  /** The speed of the spinner.
   *
   * @default {75}
   */
  speed?: number;
  /** The color of the spinner. Defaults to the default terminal color. */
  color?: string;
}

/**
 * A spinner that can be used to indicate that something is loading.
 */
export class Spinner {
  #spinner: string[];
  #message: string;
  #speed: number;
  #color?: string;
  #intervalId: number | undefined;
  #active = false;

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
    this.#message = options?.message ?? "";
    this.#speed = options?.speed ?? DEFAULT_SPEED;
    this.#color = options?.color;
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
    let i = 0;
    const color = this.#color ?? "";

    // Updates the spinner after the given interval.
    const updateFrame = () => {
      Deno.stdout.writeSync(LINE_CLEAR);
      const frame = encoder.encode(
        color + this.#spinner[i] + COLOR_RESET + " " + this.#message,
      );
      Deno.stdout.writeSync(frame);
      i = (i + 1) % this.#spinner.length;
    };
    this.#intervalId = setInterval(updateFrame, this.#speed);
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
      Deno.removeSignalListener("SIGINT", this.stop.bind(this));
      this.#active = false;
    }
  }
}
