import { notImplemented } from "./_utils.ts";

const { PerformanceObserver, PerformanceEntry, performance: shimPerformance } =
  globalThis as typeof globalThis & {
    PerformanceEntry: PerformanceEntry;
    // deno-lint-ignore no-explicit-any
    PerformanceObserver: any;
  };
const constants = {};

const performance: Partial<Performance> & {
  // deno-lint-ignore no-explicit-any
  eventLoopUtilization: any;
  nodeTiming: Record<string, string>;
  // deno-lint-ignore no-explicit-any
  timerify: any;
  // deno-lint-ignore no-explicit-any
  timeOrigin: any;
} = {
  clearMarks: (markName: string) => shimPerformance.clearMarks(markName),
  eventLoopUtilization: () =>
    notImplemented("eventLoopUtilization from performance"),
  mark: (markName: string) => shimPerformance.mark(markName),
  measure: shimPerformance.measure,
  nodeTiming: {},
  now: () => shimPerformance.now(),
  timerify: () => notImplemented("timerify from performance"),
  // deno-lint-ignore no-explicit-any
  timeOrigin: (shimPerformance as any).timeOrigin,
};

const monitorEventLoopDelay = () =>
  notImplemented(
    "monitorEventLoopDelay from performance",
  );

export default {
  performance,
  PerformanceObserver,
  PerformanceEntry,
  monitorEventLoopDelay,
  constants,
};

export {
  constants,
  monitorEventLoopDelay,
  performance,
  PerformanceEntry,
  PerformanceObserver,
};
