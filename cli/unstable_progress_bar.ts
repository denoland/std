// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * The properties provided to the fmt function upon every visual update.
 */
export interface ProgressBarFormatter {
  /**
   * A function that returns a formatted version of the duration.
   * `[mm:ss] `
   */
  styledTime: () => string;
  /**
   * A function that returns a formatted version of the data received.
   * `[0.40/97.66 KiB] `
   * @param fractions The number of decimal places the values should have.
   */
  styledData: (fractions?: number) => string;
  /**
   * The progress bar string.
   * Default Style: `[###-------] `
   */
  progressBar: string;
  /**
   * The duration of the progress bar.
   */
  time: number;
  /**
   * The duration passed to the last call.
   */
  previousTime: number;
  /**
   * The current value the progress bar is sitting at.
   */
  value: number;
  /**
   * The value passed to the last call.
   */
  previousValue: number;
  /**
   * The max value expected to receive.
   */
  max: number;
}

/**
 * The options that are provided to a {@link createProgressBar} or
 * {@link ProgressBarStream}.
 */
export interface ProgressBarOptions {
  /**
   * The offset size of the input if progress is resuming part way through.
   * @default {0}
   */
  value?: number;
  /**
   * The total size expected to receive.
   */
  max: number;
  /**
   * The length that the progress bar should be, in characters.
   * @default {50}
   */
  barLength?: number;
  /**
   * The character to fill the progress bar up with as it makes progress.
   * @default {'#'}
   */
  fillChar?: string;
  /**
   * The character the progress bar starts out with.
   * @default {'-'}
   */
  emptyChar?: string;
  /**
   * Whether the progress bar should be removed after completion.
   * @default {false}
   */
  clear?: boolean;
  /**
   * A function that creates the style of the progress bar.
   * Default Style: `[mm:ss] [###-------] [0.24/97.6 KiB]`.
   */
  fmt?: (fmt: ProgressBarFormatter) => string;
  /**
   * Whether the writable should be kept open when progress bar stops.
   * @default {true}
   */
  keepOpen?: boolean;
}

/**
 * `ProgressBar` is a customisable class that reports updates to a
 * {@link WritableStream} on a 1s interval. Progress is communicated by calling
 * the `ProgressBar.add(x: number)` method.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Basic Usage
 * ```ts ignore
 * import { delay } from "@std/async";
 * import { ProgressBar } from "@std/cli/unstable-progress-bar";
 *
 * const gen = async function* () {
 *   for (let i = 0; i < 100; ++i) {
 *     yield new Uint8Array(1000).fill(97);
 *     await delay(Math.random() * 200 | 0);
 *   }
 * }();
 * const writer = (await Deno.create("./_tmp/output.txt")).writable.getWriter();
 *
 * const bar = new ProgressBar(Deno.stdout.writable, { max: 100_000 });
 *
 * for await (const buffer of gen) {
 *   bar.add(buffer.length);
 *   await writer.write(buffer);
 * }
 *
 * await bar.end();
 * await writer.close();
 * ```
 *
 * @example Custom Formatting
 * ```ts ignore
 * import { delay } from "@std/async";
 * import { ProgressBar } from "@std/cli/unstable-progress-bar";
 *
 * const bar = new ProgressBar(Deno.stdout.writable, {
 *   max: 100,
 *   fmt(x) {
 *     return `${x.styledTime()}${x.progressBar}[${x.value}/${x.max} files]`;
 *   },
 * });
 *
 * for (const x of Array(100)) {
 *   bar.add(1);
 *   await delay(Math.random() * 500);
 * }
 *
 * bar.end();
 */
export class ProgressBar {
  #unit: string;
  #rate: number;
  #writer: WritableStreamDefaultWriter;
  #id: number;
  #startTime: number;
  #lastTime: number;
  #lastValue: number;

  #value: number;
  #max: number;
  #barLength: number;
  #fillChar: string;
  #emptyChar: string;
  #clear: boolean;
  #fmt: (fmt: ProgressBarFormatter) => string;
  #keepOpen: boolean;
  /**
   * Constructs a new instance.
   *
   * @param writable The {@link WritableStream} that will receive the progress bar reports.
   * @param options The options to configure various settings of the progress bar.
   */
  constructor(
    writable: WritableStream<Uint8Array>,
    options: ProgressBarOptions,
  ) {
    const {
      value = 0,
      barLength = 50,
      fillChar = "#",
      emptyChar = "-",
      clear = false,
      fmt = (x) => x.styledTime() + x.progressBar + x.styledData(),
      keepOpen = true,
    } = options;
    this.#value = value;
    this.#max = options.max;
    this.#barLength = barLength;
    this.#fillChar = fillChar;
    this.#emptyChar = emptyChar;
    this.#clear = clear;
    this.#fmt = fmt;
    this.#keepOpen = keepOpen;

    if (options.max < 2 ** 20) {
      this.#unit = "KiB";
      this.#rate = 2 ** 10;
    } else if (options.max < 2 ** 30) {
      this.#unit = "MiB";
      this.#rate = 2 ** 20;
    } else if (options.max < 2 ** 40) {
      this.#unit = "GiB";
      this.#rate = 2 ** 30;
    } else if (options.max < 2 ** 50) {
      this.#unit = "TiB";
      this.#rate = 2 ** 40;
    } else {
      this.#unit = "PiB";
      this.#rate = 2 ** 50;
    }

    const stream = new TextEncoderStream();
    stream.readable
      .pipeTo(writable, { preventClose: this.#keepOpen })
      .catch(() => clearInterval(this.#id));
    this.#writer = stream.writable.getWriter();
    this.#id = setInterval(() => this.#print(), 1000);
    this.#startTime = performance.now();
    this.#lastTime = this.#startTime;
    this.#lastValue = this.#value;
  }

  async #print(): Promise<void> {
    const currentTime = performance.now();
    const size = this.#value / this.#max * this.#barLength | 0;
    const unit = this.#unit;
    const rate = this.#rate;
    const x: ProgressBarFormatter = {
      styledTime() {
        return "[" +
          (this.time / 1000 / 60 | 0)
            .toString()
            .padStart(2, "0") +
          ":" +
          (this.time / 1000 % 60 | 0)
            .toString()
            .padStart(2, "0") +
          "] ";
      },
      styledData: function (fractions = 2): string {
        return "[" +
          (this.value / rate).toFixed(fractions) +
          "/" +
          (this.max / rate).toFixed(fractions) +
          " " +
          unit +
          "] ";
      },
      progressBar: "[" +
        this.#fillChar.repeat(size) +
        this.#emptyChar.repeat(this.#barLength - size) +
        "] ",
      time: currentTime - this.#startTime,
      previousTime: this.#lastTime - this.#startTime,
      value: this.#value,
      previousValue: this.#lastValue,
      max: this.#max,
    };
    this.#lastTime = currentTime;
    this.#lastValue = this.#value;
    await this.#writer.write("\r\u001b[K" + this.#fmt(x))
      .catch(() => {});
  }

  /**
   * Increments the progress by `x`.
   *
   * @example Usage
   * ```ts ignore
   * import { ProgressBar } from "@std/cli/unstable-progress-bar";
   *
   * const progressBar = new ProgressBar(Deno.stdout.writable, { max: 100 });
   * progressBar.add(10);
   * ```
   * @param x The amount of progress that has been made.
   */
  add(x: number): void {
    this.#value += x;
  }

  /**
   * Ends the progress bar and cleans up any lose ends.
   *
   * @example Usage
   * ```ts ignore
   * import { ProgressBar } from "@std/cli/unstable-progress-bar";
   *
   * const progressBar = new ProgressBar(Deno.stdout.writable, { max: 100 });
   * await progressBar.end()
   * ```
   */
  async end(): Promise<void> {
    clearInterval(this.#id);
    await this.#print()
      .then(() => this.#writer.write(this.#clear ? "\r\u001b[K" : "\n"))
      .then(() => this.#writer.close())
      .catch(() => {});
  }
}
