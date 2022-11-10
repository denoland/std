// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// A module to get formatted digital duration from milliseconds.

const addZero = (num: number, digits: number) =>
  String(num).padStart(digits, "0");

interface DurationObject {
  d: number;
  h: number;
  m: number;
  s: number;
  ms: number;
  us: number;
  ns: number;
}

const keyList: Record<keyof DurationObject, string> = {
  d: "days",
  h: "hours",
  m: "minutes",
  s: "seconds",
  ms: "milliseconds",
  us: "microseconds",
  ns: "nanoseconds",
};

/** Parse milleseconds into a duration. */
function millisecondsToDurationObject(ms: number): DurationObject {
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
  duration: DurationObject,
): { type: keyof DurationObject; value: number }[] {
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

function durationObjectToMilliseconds(object: DurationObject) {
  let result = 0;
  result += object.d * 86400000;
  result += object.h * 3600000;
  result += object.m * 60000;
  result += object.s * 1000;
  result += object.ms;
  result += object.us / 1000;
  result += object.ns / 1000000;
  return result;
}

export interface PrettyDurationOptions {
  /**
   * "narrow" for "0d 0h 0m 0s 0ms..."
   * "digital" for "00:00:00:00:000..."
   * "full" for "0 days, 0 hours, 0 minutes,..."
   */
  style: "narrow" | "digital" | "full";
  /**
   * Whether to ignore zero values.
   * With style="narrow" | "full", all zero values are ignored.
   * With style="digital", only values in the ends are ignored.
   */
  ignoreZero: boolean;
}

export function format(
  ms: number,
  options: Partial<PrettyDurationOptions> = {},
): string {
  const opt = Object.assign(
    { style: "narrow", ignoreZero: false },
    options,
  );
  const duration = millisecondsToDurationObject(ms);
  const durationArr = durationArray(duration);
  switch (opt.style) {
    case "narrow": {
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
    case "digital": {
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
      throw new TypeError(`style must be "narrow", "full", or "digital"!`);
    }
  }
}

const digitalRegex =
  /^(?<d>\d{2})\:(?<h>\d{2})\:(?<m>\d{2})\:(?<s>\d{2})\:(?<ms>\d{3})(\:(?<us>\d{3}))?(\:(?<ns>\d{3}))?$/;
export function parse(value: string) {
  const digitalMatch = digitalRegex.exec(value);
  if (digitalMatch) {
    const groups = digitalMatch.groups;
    const object = Object.fromEntries(
      Object.entries(groups!).map((
        [name, value],
      ) => [name, value != null ? parseInt(value) : 0]),
    ) as unknown as DurationObject;
    return durationObjectToMilliseconds(object);
  }

  const object = {
    d: 0,
    h: 0,
    m: 0,
    s: 0,
    ms: 0,
    us: 0,
    ns: 0,
  };
  let match;
  const valueRegex = /(?<value>\d+)\s*(?<name>[\µa-z]+)/g;
  while ((match = valueRegex.exec(value)) !== null) {
    const groups = match.groups!;
    const name = groups.name;
    const value = Number.parseInt(groups.value, 10);
    switch (name) {
      case keyList["d"]:
      case "d": {
        object.d += value;
        break;
      }
      case keyList["h"]:
      case "h": {
        object.h += value;
        break;
      }
      case keyList["m"]:
      case "m": {
        object.m += value;
        break;
      }
      case keyList["s"]:
      case "s": {
        object.s += value;
        break;
      }
      case keyList["ms"]:
      case "ms": {
        object.ms += value;
        break;
      }
      case keyList["us"]:
      case "µs": {
        object.us += value;
        break;
      }
      case keyList["ns"]:
      case "ns": {
        object.ns += value;
        break;
      }
    }
  }
  return durationObjectToMilliseconds(object);
}
