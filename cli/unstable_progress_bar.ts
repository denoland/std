// Copyright 2018-2025 the Deno authors. MIT license.

/**
 * The properties provided to the fmt function upon every visual update.
 */
export interface ProgressBarFormatter {
  /**
   * A function that returns a formatted version of the duration.
   * `[mm:ss]`
   */
  styledTime: () => string;
  /**
   * A function that returns a formatted version of the data received.
   * `[0.40/97.66 KiB]`
   * @param fractions The number of decimal places the values should have.
   */
  styledData: (fractions?: number) => string;
  /**
   * The progress bar string.
   * Default Style: `[###-------]`
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
   * The {@link WritableStream} that will receive the progress bar reports.
   * @default {Deno.stderr.writable}
   */
  writable?: WritableStream<Uint8Array>;
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

type Unit = "KiB" | "MiB" | "GiB" | "TiB" | "PiB";

function getUnit(max: number): Unit {
  if (max < 2 ** 20) return "KiB";
  if (max < 2 ** 30) return "MiB";
  if (max < 2 ** 40) return "GiB";
  if (max < 2 ** 50) return "TiB";
  return "PiB";
}

const UNIT_RATE_MAP = new Map<Unit, number>([
  ["KiB", 2 ** 10],
  ["MiB", 2 ** 20],
  ["GiB", 2 ** 30],
  ["TiB", 2 ** 40],
  ["PiB", 2 ** 50],
]);

/**
 * `ProgressBar` is a customisable class that reports updates to a
 * {@link WritableStream} on a 1s interval. Progress is communicated by using
 * the `ProgressBar.value` property.
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
 * const bar = new ProgressBar({ max: 100_000 });
 *
 * for await (const buffer of gen) {
 *   bar.value += buffer.length;
 *   await writer.write(buffer);
 * }
 *
 * await bar.stop();
 * await writer.close();
 * ```
 *
 * @example Custom Formatting
 * ```ts ignore
 * import { delay } from "@std/async";
 * import { ProgressBar } from "@std/cli/unstable-progress-bar";
 *
 * const bar = new ProgressBar({
 *   max: 100,
 *   fmt(x) {
 *     return `${x.styledTime()}${x.progressBar}[${x.value}/${x.max} files]`;
 *   },
 * });
 *
 * for (const x of Array(100)) {
 *   bar.value += 1;
 *   await delay(Math.random() * 500);
 * }
 *
 * await bar.stop();
 */
export class ProgressBar {
  #value: number;
  /**
   * The current progress that has been completed.
   *
   * @param value Value to set.
   *
   * @example Usage
   * ```ts no-assert
   * import { ProgressBar } from "@std/cli/unstable-progress-bar";
   *
   * const progressBar = new ProgressBar({ max : 10 });
   * progressBar.value += 1;
   *
   * // do stuff
   *
   * await progressBar.stop();
   * ```
   */
  set value(value: number) {
    this.#value = value;
    this.#print();
  }
  get value(): number {
    return this.#value;
  }

  #max: number;
  /**
   * The maximum progress that is expected.
   *
   * @param value Max to set.
   *
   * @example Usage
   * ```ts no-assert
   * import { ProgressBar } from "@std/cli/unstable-progress-bar";
   *
   * const progressBar = new ProgressBar({ max : 1 });
   * progressBar.max = 100;
   *
   * // do stuff
   *
   * await progressBar.stop();
   * ```
   */
  set max(value: number) {
    this.#max = value;
    this.#unit = getUnit(this.#max);
    this.#rate = UNIT_RATE_MAP.get(this.#unit)!;

    this.#print();
  }
  get max(): number {
    return this.#max;
  }

  #unit: Unit;
  #rate: number;
  #writer: WritableStreamDefaultWriter;
  #id: number;
  #startTime: number;
  #lastTime: number;
  #lastValue: number;
  #barLength: number;
  #fillChar: string;
  #emptyChar: string;
  #clear: boolean;
  #fmt: (fmt: ProgressBarFormatter) => string;
  #keepOpen: boolean;
  /**
   * Constructs a new instance.
   *
   * @param options The options to configure various settings of the progress bar.
   */
  constructor(
    options: ProgressBarOptions,
  ) {
    const {
      writable = Deno.stderr.writable,
      value = 0,
      max,
      barLength = 50,
      fillChar = "#",
      emptyChar = "-",
      clear = false,
      fmt = (x) => `${x.styledTime()} ${x.progressBar} ${x.styledData()} `,
      keepOpen = true,
    } = options;
    this.#value = value;
    this.#max = max;
    this.#barLength = barLength;
    this.#fillChar = fillChar;
    this.#emptyChar = emptyChar;
    this.#clear = clear;
    this.#fmt = fmt;
    this.#keepOpen = keepOpen;

    this.#unit = getUnit(options.max);
    this.#rate = UNIT_RATE_MAP.get(this.#unit)!;

    const stream = new TextEncoderStream();
    stream.readable
      .pipeTo(writable, { preventClose: this.#keepOpen })
      .catch(() => clearInterval(this.#id));
    this.#writer = stream.writable.getWriter();

    this.#startTime = performance.now();
    this.#lastTime = this.#startTime;
    this.#lastValue = this.value;

    this.#id = setInterval(() => this.#print(), 1000);
    this.#print();
  }

  async #print(): Promise<void> {
    const currentTime = performance.now();

    const size = this.value / this.max * this.#barLength | 0;
    const fillChars = this.#fillChar.repeat(size);
    const emptyChars = this.#emptyChar.repeat(this.#barLength - size);

    const formatter: ProgressBarFormatter = {
      styledTime() {
        const minutes = (this.time / 1000 / 60 | 0).toString().padStart(2, "0");
        const seconds = (this.time / 1000 % 60 | 0).toString().padStart(2, "0");
        return `[${minutes}:${seconds}]`;
      },
      styledData: (fractions = 2): string => {
        const currentValue = (this.value / this.#rate).toFixed(fractions);
        const maxValue = (this.max / this.#rate).toFixed(fractions);
        return `[${currentValue}/${maxValue} ${this.#unit}]`;
      },
      progressBar: `[${fillChars}${emptyChars}]`,
      time: currentTime - this.#startTime,
      previousTime: this.#lastTime - this.#startTime,
      value: this.value,
      previousValue: this.#lastValue,
      max: this.max,
    };
    this.#lastTime = currentTime;
    this.#lastValue = this.value;
    await this.#writer.write("\r\u001b[K" + this.#fmt(formatter))
      .catch(() => {});
  }

  /**
   * Ends the progress bar and cleans up any lose ends.
   *
   * @example Usage
   * ```ts ignore
   * import { ProgressBar } from "@std/cli/unstable-progress-bar";
   *
   * const progressBar = new ProgressBar({ max: 100 });
   * await progressBar.stop()
   * ```
   */
  async stop(): Promise<void> {
    clearInterval(this.#id);
    await this.#writer.write(this.#clear ? "\r\u001b[K" : "\n")
      .then(() => this.#writer.close())
      .catch(() => {});
  }
}
