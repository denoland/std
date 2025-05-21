// Copyright 2018-2025 the Deno authors. MIT license.

export type Unit = "KiB" | "MiB" | "GiB" | "TiB" | "PiB";

function getUnit(max: number): Unit {
  if (max < 2 ** 20) return "KiB";
  if (max < 2 ** 30) return "MiB";
  if (max < 2 ** 40) return "GiB";
  if (max < 2 ** 50) return "TiB";
  return "PiB";
}

const UNIT_RATE_MAP = new Map<Unit, number>([
  ["KiB", 2 ** 10],
  ["MiB", 2 ** 20],
  ["GiB", 2 ** 30],
  ["TiB", 2 ** 40],
  ["PiB", 2 ** 50],
]);

export function formatUnitFraction(
  value: number,
  max: number,
  fractionDigits: number,
): string {
  const unit = getUnit(max);
  const rate = UNIT_RATE_MAP.get(unit)!;
  const currentValue = (value / rate).toFixed(fractionDigits);
  const maxValue = (max / rate).toFixed(fractionDigits);
  return `${currentValue}/${maxValue} ${unit}`;
}
