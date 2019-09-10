// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
// @deno-types="./vendor/standalone.d.ts"
import "./vendor/standalone.js";
// @deno-types="./vendor/parser_typescript.d.ts"
import "./vendor/parser_typescript.js";
// @deno-types="./vendor/parser_babylon.d.ts"
import "./vendor/parser_babylon.js";
// @deno-types="./vendor/parser_markdown.d.ts"
import "./vendor/parser_markdown.js";

// TODO: provide decent type declarions for these
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { prettier, prettierPlugins } = window as any;

export { prettier, prettierPlugins };
