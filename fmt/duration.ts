// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// A module to get formatted time duration from milliseconds.

const addZero = (num: number, digits: number) =>
  String(num).padStart(digits, "0");

interface DurationObj {
  d: number;
  h: number;
  m: number;
  s: number;
  ms: number;
  us: number;
  ns: number;
}

const keyList: Record<keyof DurationObj, string> = {
  d: "days",
  h: "hours",
  m: "minutes",
  s: "seconds",
  ms: "milliseconds",
  us: "microseconds",
  ns: "nanoseconds",
};

/** Parse milleseconds into a duration. */
function parseDuration(ms: number): DurationObj {
  // Duration cannot be negative
  const absolute_ms = Math.abs(ms);
  return {
    d: Math.trunc(absolute_ms / 86400000),
    h: Math.trunc(absolute_ms / 3600000) % 24,
    m: Math.trunc(absolute_ms / 60000) % 60,
    s: Math.trunc(absolute_ms / 1000) % 60,
    ms: Math.trunc(absolute_ms) % 1000,
    us: Math.trunc(absolute_ms * 1000) % 1000,
    ns: Math.trunc(absolute_ms * 1000000) % 1000,
  };
}

function durationArray(
  duration: DurationObj,
): { type: keyof DurationObj; value: number }[] {
  return [
    { type: "d", value: duration.d },
    { type: "h", value: duration.h },
    { type: "m", value: duration.m },
    { type: "s", value: duration.s },
    { type: "ms", value: duration.ms },
    { type: "us", value: duration.us },
    { type: "ns", value: duration.ns },
  ];
}

export interface PrettyDurationOptions {
  /**
   * "short" for "0d 0h 0m 0s 0ms..."
   * "time" for "00:00:00:00:000..."
   * "full" for "0 days, 0 hours, 0 minutes,..."
   */
  formatType: "short" | "time" | "full";
  /**
   * Whether to ignore zero values.
   * With formatType="short" | "full", all zero values are ignored.
   * With formatType="time", only values in the ends are ignored.
   */
  ignoreZero: boolean;
}

export function prettyDuration(
  ms: number,
  options: Partial<PrettyDurationOptions> = {},
): string {
  const opt = Object.assign(
    { formatType: "short", ignoreZero: false },
    options,
  );
  const duration = parseDuration(ms);
  const durationArr = durationArray(duration);
  switch (opt.formatType) {
    case "short": {
      if (opt.ignoreZero) {
        return `${
          durationArr.filter((x) => x.value).map((x) =>
            `${x.value}${x.type === "us" ? "µs" : x.type}`
          )
            .join(" ")
        }`;
      }
      return `${
        durationArr.map((x) => `${x.value}${x.type === "us" ? "µs" : x.type}`)
          .join(" ")
      }`;
    }
    case "full": {
      if (opt.ignoreZero) {
        return `${
          durationArr.filter((x) => x.value).map((x) =>
            `${x.value} ${keyList[x.type]}`
          ).join(", ")
        }`;
      }
      return `${
        durationArr.map((x) => `${x.value} ${keyList[x.type]}`).join(", ")
      }`;
    }
    case "time": {
      const arr = durationArr.map((x) =>
        ["ms", "us", "ns"].includes(x.type)
          ? addZero(x.value, 3)
          : addZero(x.value, 2)
      );
      if (opt.ignoreZero) {
        let cont = true;
        while (cont) {
          if (!Number(arr[arr.length - 1])) arr.pop();
          else cont = false;
        }
      }
      return arr.join(":");
    }
    default: {
      throw new TypeError(`formatType must be "short", "full", or "time"!`);
    }
  }
}
