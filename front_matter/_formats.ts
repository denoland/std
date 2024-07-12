// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

const BOM = "\\ufeff?";

const YAML_DELIMITER = "---|= yaml =";
const YAML_HEADER = `(?:---yaml|${YAML_DELIMITER})`;
const YAML_FOOTER = `(?:${YAML_DELIMITER})`;

const TOML_DELIMITER = "\\+\\+\\+|= toml =";
const TOML_HEADER = `(?:---toml|${TOML_DELIMITER})`;
const TOML_FOOTER = `(?:---|${TOML_DELIMITER})`;

const JSON_DELIMITER = "= json =";
const JSON_HEADER = `(?:---json|${JSON_DELIMITER})`;
const JSON_FOOTER = `(?:---|${JSON_DELIMITER})`;

const DATA = "(?<data>[\\s\\S]+?)";
const NEWLINE = "\\r?\\n?";

export const RECOGNIZE_YAML_REGEXP = new RegExp(`^${YAML_HEADER}$`, "im");
export const RECOGNIZE_TOML_REGEXP = new RegExp(`^${TOML_HEADER}$`, "im");
export const RECOGNIZE_JSON_REGEXP = new RegExp(`^${JSON_HEADER}$`, "im");

export const EXTRACT_YAML_REGEXP = new RegExp(
  `^${BOM}${YAML_HEADER}$${DATA}^${YAML_FOOTER}\\s*$${NEWLINE}`,
  "im",
);
export const EXTRACT_TOML_REGEXP = new RegExp(
  `^${BOM}${TOML_HEADER}$${DATA}^${TOML_FOOTER}\\s*$${NEWLINE}`,
  "im",
);
export const EXTRACT_JSON_REGEXP = new RegExp(
  `^${BOM}${JSON_HEADER}$${DATA}^${JSON_FOOTER}\\s*$${NEWLINE}`,
  "im",
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
