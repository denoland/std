// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { exit, noColor } from "deno";

/** Provides methods for starting and stopping a benchmark clock. */
export interface BenchmarkTimer {
  start: () => void;
  stop: () => void;
}

/** Defines a benchmark through a named function. */
export type BenchmarkFunction = {
  (b: BenchmarkTimer): void | Promise<void>;
  name: string;
};

/** Defines a benchmark definition with configurable runs. */
export interface BenchmarkDefinition {
  func: BenchmarkFunction;
  name: string;
  runs?: number;
}

/** Defines runBenchmark's run constraints by matching benchmark names. */
export interface BenchmarkRunOptions {
  only?: RegExp;
  skip?: RegExp;
}

interface BenchmarkClock {
  start: number;
  stop: number;
}

interface BenchmarkStats {
  running: number;
  filtered: number;
  measured: number;
  unresolved: number;
  failed: number;
}

interface BenchmarkResult {
  index: number;
  timings: Array<number>;
  printed: boolean;
  error: Error;
}

interface BenchmarkResults {
  [key: string]: BenchmarkResult;
}

function red(text: string): string {
  return noColor ? text : `\x1b[31m${text}\x1b[0m`;
}

function blue(text: string): string {
  return noColor ? text : `\x1b[34m${text}\x1b[0m`;
}

function validateOr1Run(runs?: number): number {
  return !Number.isNaN(runs) && runs >= 1 && runs % 1 === 0 ? runs : 1;
}

function average(nums: Array<number>): number {
  return nums.reduce((acc: number, cur: number) => acc + cur, 0) / nums.length;
}

function report(name: string, timings: Array<number>): string {
  if (timings.length === 1) {
    return `benchmark ${name} ... ` + blue(`${timings[0]}ms`);
  } else {
    return (
      `benchmark ${name} ... ` +
      blue(`${average(timings)}ms`) +
      ` (average over ${timings.length} runs)`
    );
  }
}

function fail(name: string, err: Error) {
  return `benchmark ${name} ... ${red("failed")}\n${red(err.stack)}`;
}

function unresolve(name: string) {
  return `benchmark ${name} ... unresolved`;
}

function filterCandidates(
  candidates: Array<BenchmarkDefinition>,
  { only = /[^\s]/, skip = /^\s*$/ }: BenchmarkRunOptions = {}
): Array<BenchmarkDefinition> {
  return candidates.filter(({ name }) => only.test(name) && !skip.test(name));
}

function assertTiming(clock: BenchmarkClock): void {
  if (Number.isNaN(clock.stop)) {
    throw new Error("The benchmark timer's stop method must be called");
  } else if (Number.isNaN(clock.start)) {
    throw new Error("The benchmark timer's start method must be called");
  } else if (clock.start > clock.stop) {
    throw new Error(
      "The benchmark timer's start method must be called before its " +
        "stop method"
    );
  }
}

function printResults(stats: BenchmarkStats, results: BenchmarkResults): void {
  Object.entries(results).forEach(
    ([name, result]: [string, BenchmarkResult]): void => {
      if (!result.printed) {
        if (result.error instanceof Error) {
          console.error(fail(name, result.error));
        } else if (Array.isArray(result.timings)) {
          console.log(report(name, result.timings));
        } else {
          console.log(unresolve(name));
        }
      }
    }
  );
  console.log(
    `benchmark result: ${stats.failed !== 0 ? red("FAIL") : blue("DONE")}. ` +
      `${stats.measured} measured; ${stats.filtered} filtered; ` +
      `${stats.unresolved} unresolved; ${stats.failed} failed`
  );
}

function createBenchmarkTimer(clock: BenchmarkClock): BenchmarkTimer {
  return {
    start(): void {
      clock.start = performance.now();
    },
    stop(): void {
      clock.stop = performance.now();
    }
  };
}

function createBenchmarkResults(
  benchmarks: Array<BenchmarkDefinition>
): BenchmarkResults {
  return benchmarks.reduce(
    (
      acc: BenchmarkResults,
      { name }: BenchmarkDefinition,
      i: number
    ): BenchmarkResults => {
      acc[name] = { index: i, timings: null, printed: false, error: null };
      return acc;
    },
    {}
  );
}

async function createRunner(func: BenchmarkFunction): Promise<number> {
  // clock and b are specific for this runner
  const clock: BenchmarkClock = { start: NaN, stop: NaN };
  const b: BenchmarkTimer = createBenchmarkTimer(clock);
  // Running the benchmark function
  await func(b);
  // Making sure the benchmark was started/stopped properly
  assertTiming(clock);
  // Resolving measured time
  return clock.stop - clock.start;
}

function initRunners(
  func: BenchmarkFunction,
  runs: number
): Array<Promise<number>> {
  return new Array(runs).fill(null).map(createRunner.bind(null, func));
}

async function createBenchmark(
  stats: BenchmarkStats,
  results: BenchmarkResults,
  { name, runs, func }: BenchmarkDefinition
): Promise<void> {
  // Running a benchmark
  try {
    results[name].timings = await Promise.all(initRunners(func, runs));
  } catch (err) {
    stats.failed++;
    results[name].error = err;
    throw err;
  }
  stats.measured++;
  // Reporting right now if all previous benchmarks been printed
  const curIndex = results[name].index;
  const prevIndex = curIndex - 1;
  const prevPrinted = Object.values(results).some(
    ({ index, printed }: BenchmarkResult): boolean =>
      index === prevIndex && printed
  );
  if (curIndex === 0 || prevPrinted) {
    console.log(report(name, results[name].timings));
    results[name].printed = true;
  }
}

function initBenchmarks(
  stats: BenchmarkStats,
  results: BenchmarkResults,
  benchmarks: Array<BenchmarkDefinition>
): Array<Promise<void>> {
  return benchmarks.map(createBenchmark.bind(null, stats, results));
}

const candidates: Array<BenchmarkDefinition> = [];

/** Registers a benchmark as a candidate for the runBenchmarks executor. */
export function bench(
  benchmark: BenchmarkDefinition | BenchmarkFunction
): void {
  if (!benchmark.name) {
    throw new Error("The benchmark function must not be anonymous");
  }
  if (typeof benchmark === "function") {
    candidates.push({ name: benchmark.name, runs: 1, func: benchmark });
  } else {
    candidates.push({
      name: benchmark.name,
      runs: validateOr1Run(benchmark.runs),
      func: benchmark.func
    });
  }
}

/** Runs all registered and non-skipped benchmarks serially. */
export async function runBenchmarks(opts?: BenchmarkRunOptions): Promise<void> {
  const benchmarks: Array<BenchmarkDefinition> = filterCandidates(
    candidates,
    opts
  );
  const stats: BenchmarkStats = {
    running: benchmarks.length,
    filtered: candidates.length - benchmarks.length,
    measured: 0,
    unresolved: 0,
    failed: 0
  };
  const results: BenchmarkResults = createBenchmarkResults(benchmarks);
  console.log(
    "running",
    stats.running,
    `benchmark${stats.running === 1 ? " ..." : "s ..."}`
  );
  try {
    await Promise.all(initBenchmarks(stats, results, benchmarks));
  } finally {
    stats.unresolved = stats.running - stats.measured - stats.failed;
    printResults(stats, results);
    if (stats.failed !== 0) {
      setTimeout(() => exit(1), 0);
    }
  }
}
