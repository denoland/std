// Copyright 2018-2025 the Deno authors. MIT license.

export interface ProgressBarOptions {
  currentSize?: number;
  totalSize: number;
  barLength?: number;
  fullChar?: string;
  emptyChar?: string;
  clearBar?: boolean;
  includeTime?: boolean;
  includePercent?: boolean;
  includeAmount?: boolean;
  preventClose?: boolean;
}

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
    return "[" + (options.currentSize! / options.totalSize).toFixed(2) + "%] ";
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
