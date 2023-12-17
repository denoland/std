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
  /**
   * Whether to cleanup the output if the process is terminated.
   *
   * @default {true}
   */
  cleanup?: boolean;
}

/**
 * A spinner that can be used to indicate that something is loading.
 */
export class Spinner {
  #options: SpinnerOptions;

  #intervalId: number | undefined;
  #active = false;

  /**
   * Creates a new spinner.
   * @param options - The options for the spinner.
   *
   * @example
   * ```ts
   * const spinner = new Spinner({ message: "Loading..." });
   * spinner.start();
   * ```
   */
  constructor(options?: SpinnerOptions) {
    this.#options = options ?? {
      message: undefined,
      speed: DEFAULT_SPEED,
      spinner: DEFAULT_SPINNER,
      color: undefined,
      cleanup: true,
    };
  }

  /**
   * Starts the spinner.
   */
  start() {
    // Check if the spinner is already active.
    if (this.#active) return;
    this.#active = true;

    let i = 0;

    const message = this.#options.message ?? "";
    const spinner = this.#options.spinner ?? DEFAULT_SPINNER;
    const speed = this.#options.speed ?? DEFAULT_SPEED;
    const cleanup = this.#options.cleanup ?? true;

    const color = this.#options.color ?? "";

    if (Deno.stdout.writable.locked) return;

    // Updates the spinner after the given interval.
    const updateFrame = () => {
      Deno.stdout.writeSync(LINE_CLEAR);
      let frame;
      // If color was specified, add it to the frame. Otherwise, just use the spinner and message.
      if (this.#options.color) {
        frame = encoder.encode(color + spinner + COLOR_RESET + " " + message);
      } else frame = encoder.encode(spinner[i] + " " + message);

      Deno.stdout.writeSync(frame);
      i = (i + 1) % spinner.length;
    };

    this.#intervalId = setInterval(updateFrame, speed);

    // Cleanup if the process is terminated.
    if (cleanup) {
      Deno.addSignalListener("SIGINT", this.stop.bind(this));
    }
  }

  /**
   * Stops the spinner.
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