// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

type Delimiter = string | [begin: string, end: string];

export enum Format {
  YAML = "yaml",
  TOML = "toml",
  JSON = "json",
  UNKNOWN = "unknown",
}

const { isArray } = Array;

function getBeginToken(delimiter: Delimiter): string {
  return isArray(delimiter) ? delimiter[0] : delimiter;
}

function getEndToken(delimiter: Delimiter): string {
  return isArray(delimiter) ? delimiter[1] : delimiter;
}

function createRegExp(...dv: Delimiter[]): [RegExp, RegExp] {
  const beginPattern = "(" + dv.map(getBeginToken).join("|") + ")";
  const pattern = "^(" +
    "\\ufeff?" + // Maybe byte order mark
    beginPattern +
    "$([\\s\\S]+?)" +
    "^(?:" + dv.map(getEndToken).join("|") + ")\\s*" +
    "$" +
    (globalThis?.Deno?.build?.os === "windows" ? "\\r?" : "") +
    "(?:\\n)?)";

  return [
    new RegExp("^" + beginPattern + "$", "im"),
    new RegExp(pattern, "im"),
  ];
}

const [RX_RECOGNIZE_YAML, RX_YAML] = createRegExp(
  ["---yaml", "---"],
  "= yaml =",
  "---",
);
const [RX_RECOGNIZE_TOML, RX_TOML] = createRegExp(
  ["---toml", "---"],
  "\\+\\+\\+",
  "= toml =",
);
const [RX_RECOGNIZE_JSON, RX_JSON] = createRegExp(
  ["---json", "---"],
  "= json =",
);

export const MAP_FORMAT_TO_RECOGNIZER_RX: Omit<
  Record<Format, RegExp>,
  Format.UNKNOWN
> = {
  [Format.YAML]: RX_RECOGNIZE_YAML,
  [Format.TOML]: RX_RECOGNIZE_TOML,
  [Format.JSON]: RX_RECOGNIZE_JSON,
};

export const MAP_FORMAT_TO_EXTRACTOR_RX: Omit<
  Record<Format, RegExp>,
  Format.UNKNOWN
> = {
  [Format.YAML]: RX_YAML,
  [Format.TOML]: RX_TOML,
  [Format.JSON]: RX_JSON,
};
