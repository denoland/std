// Copyright 2018-2025 the Deno authors. MIT license.

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
  #options: Required<ProgressBarOptions>;
  #unit: string;
  #rate: number;
  #writer: WritableStreamDefaultWriter;
  #interval?: number;
  #startTime: number = 0;
  #lastTime: number = 0;
  #lastValue: number = 0;

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
    this.#options = {
      value: options.value ?? 0,
      max: options.max,
      barLength: options.barLength ?? 50,
      fillChar: options.fillChar ?? "#",
      emptyChar: options.emptyChar ?? "-",
      clear: options.clear ?? false,
      fmt: options.fmt ?? function (x) {
        return x.styledTime() + x.progressBar + x.styledData();
      },
      keepOpen: options.keepOpen ?? true,
    };

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
      .pipeTo(writable, { preventClose: this.#options.keepOpen })
      .catch(() => clearInterval(this.#interval));
    this.#writer = stream.writable.getWriter();
  }

  async #print(): Promise<void> {
    const currentTime = performance.now();
    const size = this.#options.value /
        this.#options.max *
        this.#options.barLength | 0;
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
        this.#options.fillChar.repeat(size) +
        this.#options.emptyChar.repeat(this.#options.barLength - size) +
        "] ",
      time: currentTime - this.#startTime,
      previousTime: this.#lastTime - this.#startTime,
      value: this.#options.value,
      previousValue: this.#lastValue,
      max: this.#options.max,
    };
    this.#lastTime = currentTime;
    this.#lastValue = this.#options.value;
    await this.#writer.write("\r\u001b[K" + this.#options.fmt(x))
      .catch(() => {});
  }

  /**
   * Increments the progress by `x`.
   *
   * @param x The amount of progress that has been made.
   */
  add(x: number): void {
    this.#options.value += x;
  }

  /**
   * Starts the progress bar.
   *
   * @example Usage
   * ```ts ignore
   * import { ProgressBar } from "@std/cli/unstable-progress-bar";
   *
   * const bar = new ProgressBar(Deno.stdout.writable, { max: 1 });
   * bar.start();
   * ```
   */
  start(): void {
    if (this.#interval) return;
    this.#interval = setInterval(() => this.#print(), 200);
    this.#startTime = performance.now();
    this.#lastTime = this.#startTime;
    this.#lastValue = this.#options.value;
  }

  /**
   * Ends the progress bar and cleans up any lose ends.
   */
  async end(): Promise<void> {
    if (this.#interval) {
      clearInterval(this.#interval);
      await this.#print()
        .then(() =>
          this.#writer.write(this.#options.clear ? "\r\u001b[K" : "\n")
        )
        .then(() => this.#writer.close())
        .catch(() => {});
    }
  }
}
