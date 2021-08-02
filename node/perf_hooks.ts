import { notImplemented } from './_utils'

const { PerformanceObserver, PerformanceEntry, performance: shimPerformance } =
  globalThis as typeof globalThis & {
    PerformanceEntry: PerformanceEntry;
    PerformanceObserver: PerformanceObserver;
  };
const constants = {};

const performance: Partial<Performance> & {
  eventLoopUtilization: void;
  nodeTiming: Record<string, string>;
  timerify: void;
} = {
  clearMarks: shimPerformance.clearMarks,
  eventLoopUtilization: notImplemented("eventLoopUtilization from performance"),
  mark: shimPerformance.mark,
  measure: shimPerformance.measure,
  nodeTiming: {},
  now: shimPerformance.now,
  timerify: notImplemented("timerify from performance"),
  timeOrigin: shimPerformance.timeOrigin,
};

const monitorEventLoopDelay = notImplemented("monitorEventLoopDelay from performance");

export default {
  performance,
  PerformanceObserver,
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
