export const { performance, PerformanceEntry } = globalThis as
  & typeof globalThis
  & {
    PerformanceEntry: PerformanceEntry;
  };
