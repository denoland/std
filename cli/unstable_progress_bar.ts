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
 * `createProgressBar` is a customisable function that reports updates to a
 * {@link WritableStream} on a 1s interval. Progress is communicated by calling
 * the function returned from `createProgressBar`.
 *
 * @param writable The {@link WritableStream} that will receive the progress bar
 * reports.
 * @param options The options to configure various settings of the progress bar.
 * @returns A function to update the amount of progress made.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Basic Usage
 * ```ts
 * import { createProgressBar } from "@std/cli/unstable-progress-bar";
 *
 * const gen = async function* (): AsyncGenerator<Uint8Array> {
 *     for (let i = 0; i < 100; ++i) {
 *       yield new Uint8Array(1000).fill(97);
 *       await new Promise((a) => setTimeout(a, (Math.random() * 200) | 0));
 *     }
 *   }();
 * const writer = (await Deno.create("./_tmp/output.txt")).writable.getWriter();
 *
 * const addProgress = createProgressBar(Deno.stdout.writable, { max: 100_000 });
 *
 * for await (const buffer of gen) {
 *   addProgress(buffer.length);
 *   await writer.write(buffer);
 * }
 * await addProgress(0, true);
 * await writer.close();
 * ```
 */
export function createProgressBar(
  writable: WritableStream<Uint8Array>,
  options: ProgressBarOptions,
): {
  (addSize: number, done?: false): void;
  (addSize: number, done: true): Promise<void>;
} {
  options.value = options.value ?? 0;
  options.barLength = options.barLength ?? 50;
  options.fillChar = options.fillChar ?? "#";
  options.emptyChar = options.emptyChar ?? "-";
  options.clear = options.clear ?? false;
  options.fmt = options.fmt ?? function (x) {
    return x.styledTime() + x.progressBar + x.styledData();
  };
  options.keepOpen = options.keepOpen ?? true;

  const [unit, rate] = function (): [string, number] {
    if (options.max < 2 ** 20) return ["KiB", 2 ** 10];
    if (options.max < 2 ** 30) return ["MiB", 2 ** 20];
    if (options.max < 2 ** 40) return ["GiB", 2 ** 30];
    if (options.max < 2 ** 50) return ["TiB", 2 ** 40];
    return ["PiB", 2 ** 50];
  }();

  const writer = function () {
    const stream = new TextEncoderStream();
    stream.readable
      .pipeTo(writable, { preventClose: options.keepOpen })
      .catch(() => {});
    return stream.writable.getWriter();
  }();
  const startTime = performance.now();
  const id = setInterval(print, 1_000);
  writer.closed
    .catch(() => {})
    .finally(() => clearInterval(id));
  let lastTime = startTime;
  let lastValue = options.value!;

  return addProgress;
  /**
   * @param addSize The amount of bytes of progressed made since last call.
   * @param done Whether or not you're done reporting progress.
   */
  function addProgress(addSize: number, done?: false): void;
  function addProgress(addSize: number, done: true): Promise<void>;
  function addProgress(addSize: number, done = false): void | Promise<void> {
    options.value! += addSize;
    if (done) {
      clearInterval(id);
      return print()
        .then(() => writer.write(options.clear ? "\r\u001b[K" : "\n"))
        .then(() => writer.close())
        .catch(() => {});
    }
  }
  async function print(): Promise<void> {
    const currentTime = performance.now();
    const size = options.value! /
        options.max *
        options.barLength! | 0;
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
      styledData(fractions = 2) {
        return "[" +
          (this.value / rate).toFixed(fractions) +
          "/" +
          (this.max / rate).toFixed(fractions) +
          " " +
          unit +
          "] ";
      },
      progressBar: "[" +
        options.fillChar!.repeat(size) +
        options.emptyChar!.repeat(options.barLength! - size) +
        "] ",
      time: currentTime - startTime,
      previousTime: lastTime - startTime,
      value: options.value!,
      previousValue: lastValue,
      max: options.max,
    };
    lastTime = currentTime;
    lastValue = options.value!;
    await writer.write("\r\u001b[K" + options.fmt!(x))
      .catch(() => {});
  }
}
