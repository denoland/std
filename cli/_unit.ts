// Copyright 2018-2026 the Deno authors. MIT license.

type Unit =
  | "KiB"
  | "MiB"
  | "GiB"
  | "TiB"
  | "PiB"
  | "EiB"
  | "ZiB"
  | "YiB";

const UNIT_RATE_MAP = new Map<Unit, number>([
  ["KiB", 2 ** 10],
  ["MiB", 2 ** 20],
  ["GiB", 2 ** 30],
  ["TiB", 2 ** 40],
  ["PiB", 2 ** 50],
  ["EiB", 2 ** 60],
  ["ZiB", 2 ** 70],
  ["YiB", 2 ** 80],
]);

function getUnitEntry(max: number): [Unit, number] {
  let result: [Unit, number] = ["KiB", 2 ** 10];
  for (const entry of UNIT_RATE_MAP) {
    if (entry[1] > max) break;
    result = entry;
  }
  return result;
}

export function formatUnitFraction(value: number, max: number) {
  const [unit, rate] = getUnitEntry(max);
  const currentValue = (value / rate).toFixed(2);
  const maxValue = (max / rate).toFixed(2);
  return `${currentValue}/${maxValue} ${unit}`;
}
