// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

const encoder = new TextEncoder();

const LINE_CLEAR = encoder.encode("\r\u001b[K"); // From cli/prompt_secret.ts
const COLOR_RESET = "\u001b[0m";
const DEFAULT_SPEED = 75;

/** The options for the spinner */
export interface SpinnerOptions {
  /** The spinner to be animated */
  spinner: string[];
  /** The message to display next to the spinner */
  message?: string;
  /** The speed of the spinner. Defaults to 75 */
  speed?: number;
  /** The color of the spinner. Defaults to the default terminal color */
  color?: string;
  /** Whether to cleanup the output if the process is terminated. Defaults to true */
  cleanup?: boolean;
}

/** The default spinners */
export const spinners = {
  lines: ['-', '\\', '|', '/'],
  binary: ['0000', '1000', '1100', '1110', '1111', '0111', '0011', '0001'],
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  dots2: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
  blink: ['◜', '◠', '◝', '◞', '◡', '◟'],
}

/**
 * A spinner that can be used to indicate that something is loading.
 */
export class Spinner {
  #message: string | undefined;
  #speed: number;
  #spinner: string[];
  #color: string | undefined;
  #cleanup: boolean;
  
  #intervalId: number | undefined;

  /**
   * Creates a new spinner.
   * @param message - The message to display next to the spinner.
   * @param speed - The speed of the spinner.
   * @param spinner - The spinner to use.
   * @param color - The color of the spinner.
   * @param cleanup - Whether to cleanup the output if the process is terminated.
   */
  constructor(message: string | undefined, speed: number, spinner: string[], color: string | undefined, cleanup: boolean) {
    this.#message = message;
    this.#speed = speed;
    this.#spinner = spinner;
    this.#color = color;
    this.#cleanup = cleanup;
  }

  /**
   * Starts the spinner.
   */
  start() {
    let i = 0;
    const message = this.#message ?? '';
    
    const color = this.#color ?? '';

    if (Deno.stdout.writable.locked) return;

    // Updates the spinner after the given interval.
    const updateFrame = () => {
      Deno.stdout.writeSync(LINE_CLEAR);
      let frame;
      // If color was specified, add it to the frame. Otherwise, just use the spinner and message.
      if (this.#color) frame = encoder.encode(color + this.#spinner[i] + COLOR_RESET + ' ' + message);
      else frame = encoder.encode(this.#spinner[i] + ' ' + message);
      Deno.stdout.writeSync(frame);
      i = (i + 1) % this.#spinner.length;
    }

    this.#intervalId = setInterval(updateFrame, this.#speed);

    // Cleanup if the process is terminated.
    if (this.#cleanup) Deno.addSignalListener("SIGINT" , this.cleanup.bind(this));
  }

  /**
   * Stops the spinner.
   */
  stop() {
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
      Deno.stdout.writeSync(LINE_CLEAR); // Clear the current line
    }
  }
  
  /**
   * Stops the spinner and cleans up the output.
   */
  cleanup() {
    this.stop();
    Deno.stdout.writeSync(encoder.encode("\n"));
  }
}

/**
 * Creates a spinner with the given options.
 * 
 * Note: The spinner will _not_ start automatically.
 * @param options - The options for the spinner. 
 * @returns The created spinner.
 * 
 * @example 
 * ```ts
 * const mySpinner = createSpinner({
 *   spinner: spinners.lineSpinner,
 *   message: 'Loading...',
 * });
 * 
 * mySpinner.start();
 * ```
 * 
 * You can also add custom spinners:
 * ```ts
 * const mySpinner = createSpinner({
 *  spinner: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
 *  message: 'Loading...',
 *  speed: 20
 * });
 * 
 * mySpinner.start();
 * ```
 */
export function createSpinner({ message, speed = DEFAULT_SPEED, spinner, color, cleanup = true }: SpinnerOptions): Spinner {
  return new Spinner(message, speed, spinner, color, cleanup);
}

/**
 * Creates a spinner with the given options and starts it.
 * 
 * @param promise The async callback function
 * @param spinner The spinner to use
 * @returns The result of the promise
 * 
 * @example
 * ```ts
 * const myPromise = () => new Promise((resolve) => setTimeout(resolve, 5000));
 * 
 * const spinner = createSpinner({
 *  spinner: spinners.dots,
 *  message: 'Loading...',
 * });
 * 
 * spinnerPromise(myPromise, spinner).then(() => console.log('Done!'));
 * ```
 */
export async function spinnerPromise<T>(promise: () => Promise<T>, spinner: Spinner): Promise<T> {
  spinner.start();
  const result = await promise();
  spinner.stop();
  return result;
}