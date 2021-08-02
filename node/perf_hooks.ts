function unimplemented(functionName: string) {
  throw new Error(
    `Node.js performance method ${functionName} is not currently supported by JSPM core in the browser`,
  );
}

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
  eventLoopUtilization: unimplemented("eventLoopUtilization"),
  mark: shimPerformance.mark,
  measure: shimPerformance.measure,
  nodeTiming: {},
  now: shimPerformance.now,
  timerify: unimplemented("timerify"),
  timeOrigin: shimPerformance.timeOrigin,
};

const monitorEventLoopDelay = unimplemented("monitorEventLoopDelay");

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
