// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * Supported format for front matter. `"unknown"` is used when auto format
 * detection logic fails.
 */
export type Format = "yaml" | "toml" | "json";

const BOM = "\\ufeff?";

const YAML_HEADER = `${BOM}(?:---yaml|= yaml =|---)`;
const YAML_FOOTER = `(?:= yaml =|---)`;

const TOML_HEADER = `${BOM}(?:---toml|\\+\\+\\+|= toml =)`;
const TOML_FOOTER = `(?:---|\\+\\+\\+|= toml =)`;

const JSON_HEADER = `${BOM}(?:---json|= json =)`;
const JSON_FOOTER = `(?:---|= json =)`;

const WHITESPACES = "\\s*";
const NEWLINE = "\\r?\\n";

const FRONT_MATTER = "(?<frontMatter>.+?)";
const BODY = "(?:\\r?\\n(?<body>.+))?";

const RECOGNIZE_YAML_REGEXP = new RegExp(
  `^${YAML_HEADER}${WHITESPACES}${NEWLINE}`,
  "i",
);
const RECOGNIZE_TOML_REGEXP = new RegExp(
  `^${TOML_HEADER}${WHITESPACES}${NEWLINE}`,
  "i",
);
const RECOGNIZE_JSON_REGEXP = new RegExp(
  `^${JSON_HEADER}${WHITESPACES}${NEWLINE}`,
  "i",
);

export const EXTRACT_YAML_REGEXP = new RegExp(
  `^${YAML_HEADER}${WHITESPACES}${NEWLINE}${WHITESPACES}(?:${FRONT_MATTER}${WHITESPACES}${NEWLINE})?${YAML_FOOTER}${WHITESPACES}${BODY}$`,
  "is",
);
export const EXTRACT_TOML_REGEXP = new RegExp(
  `^${TOML_HEADER}${WHITESPACES}${NEWLINE}${WHITESPACES}(?:${FRONT_MATTER}${WHITESPACES}${NEWLINE})?${TOML_FOOTER}${WHITESPACES}${BODY}$`,
  "is",
);
export const EXTRACT_JSON_REGEXP = new RegExp(
  `^${JSON_HEADER}${WHITESPACES}${NEWLINE}${WHITESPACES}(?:${FRONT_MATTER}${WHITESPACES}${NEWLINE})?${JSON_FOOTER}${WHITESPACES}${BODY}$`,
  "is",
);

export const RECOGNIZE_REGEXP_MAP = new Map([
  ["yaml", RECOGNIZE_YAML_REGEXP],
  ["toml", RECOGNIZE_TOML_REGEXP],
  ["json", RECOGNIZE_JSON_REGEXP],
]);

export const EXTRACT_REGEXP_MAP = new Map([
  ["yaml", EXTRACT_YAML_REGEXP],
  ["toml", EXTRACT_TOML_REGEXP],
  ["json", EXTRACT_JSON_REGEXP],
]);
