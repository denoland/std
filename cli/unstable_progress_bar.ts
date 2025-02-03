// Copyright 2018-2025 the Deno authors. MIT license.

/**
 * The options that are provided to a {@link createProgressBar} or
 * {@link ProgressBarStream}.
 */
export interface ProgressBarOptions {
  /**
   * The offset size of the input if progress is resuming part way through.
   * @default {0}
   */
  currentSize?: number;
  /**
   * The total size expected to receive.
   */
  totalSize: number;
  /**
   * The length that the progress bar should be, in characters.
   * @default {50}
   */
  barLength?: number;
  /**
   * The character to fill the progress bar up with as it makes progress.
   * @default {'#'}
   */
  fullChar?: string;
  /**
   * The character the progress bar starts out with.
   * @default {'-'}
   */
  emptyChar?: string;
  /**
   * Whether the progress bar should be removed after completion.
   * @default {false}
   */
  clearBar?: boolean;
  /**
   * Whether or not a timer `[mm:ss]` should be displayed.
   * @default {true}
   */
  includeTime?: boolean;
  /**
   * Whether or not a percentage `[0.00%]` should be displayed.
   * @default {false}
   */
  includePercent?: boolean;
  /**
   * Whether or not the amount `[0.00/97.04 KiB]` passed through should be
   * displayed.
   * @default {true}
   */
  includeAmount?: boolean;
  /**
   * Whether or not the {@link WritableStream} argument should be closed upon
   * completion.
   * @default {true}
   */
  preventClose?: boolean;
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
 * const file = await Deno.create("./_tmp/output.txt");
 * const writer = file.writable.getWriter();
 *
 * const addProgress = createProgressBar(
 *   Deno.stdout.writable,
 *   { totalSize: 100_000 },
 * );
 *
 * for await (const buffer of gen) {
 *   await addProgress(buffer.length);
 *   await writer.write(buffer);
 * }
 * await addProgress(0, true);
 * file.close();
 * ```
 */
export function createProgressBar(
  writable: WritableStream<Uint8Array>,
  options: ProgressBarOptions,
): (addSize: number, done?: boolean) => Promise<void> {
  options.currentSize = options.currentSize ?? 0;
  options.barLength = options.barLength ?? 50;
  options.fullChar = options.fullChar ?? "#";
  options.emptyChar = options.emptyChar ?? "-";
  options.clearBar = options.clearBar ?? false;
  options.includeTime = options.includeTime ?? true;
  options.includePercent = options.includePercent ?? false;
  options.includeAmount = options.includeAmount ?? true;
  options.preventClose = options.preventClose ?? true;

  const [unit, rate] = function (): [string, number] {
    if (options.totalSize < 2 ** 20) return ["KiB", 2 ** 10];
    if (options.totalSize < 2 ** 30) return ["MiB", 2 ** 20];
    if (options.totalSize < 2 ** 40) return ["GiB", 2 ** 30];
    if (options.totalSize < 2 ** 50) return ["TiB", 2 ** 40];
    return ["PiB", 2 ** 50];
  }();

  const writer = function () {
    const stream = new TextEncoderStream();
    stream.readable.pipeTo(writable, options);
    return stream.writable.getWriter();
  }();
  const startTime = performance.now();
  const id = setInterval(print, 1_000);

  /**
   * @param addSize The amount of bytes of progressed made since last call.
   * @param done Whether or not you're done reporting progress.
   */
  return async function addProgress(
    addSize: number,
    done = false,
  ): Promise<void> {
    options.currentSize! += addSize;
    if (done) {
      clearInterval(id);
      await print();
      if (options.clearBar) await writer.write("\r\u001b[K");
      else await writer.write("\n");
      await writer.close();
    }
  };
  async function print(): Promise<void> {
    const currentTime = performance.now();
    const size = options.currentSize! /
        options.totalSize *
        options.barLength! | 0;
    await writer.write(
      "\r\u001b[K" +
        time(currentTime) +
        progress(size) +
        percent() +
        amount(),
    );
  }
  function time(currentTime: number): string {
    if (!options.includeTime) return "";
    return "[" +
      ((currentTime - startTime) / 1000 / 60 | 0).toString().padStart(2, "0") +
      ":" +
      ((currentTime - startTime) / 1000 % 60 | 0).toString().padStart(2, "0") +
      "] ";
  }
  function progress(size: number): string {
    return "[" +
      options.fullChar!.repeat(size) +
      options.emptyChar!.repeat(options.barLength! - size) +
      "] ";
  }
  function percent(): string {
    if (!options.includePercent) return "";
    return "[" +
      (options.currentSize! / options.totalSize * 100).toFixed(2) +
      "%] ";
  }
  function amount(): string {
    if (!options.includeAmount) return "";
    return "[" +
      (options.currentSize! / rate).toFixed(2) +
      "/" +
      (options.totalSize / rate).toFixed(2) +
      " " +
      unit +
      "] ";
  }
}
