# jsdoc

## Usage

```ts
import {
  parse,
  stringify,
} from "https://deno.land/std@$STD_VERSION/encoding/jsdoc/mod.ts";

const string = `
/**
 * @abstract
 * @module Module
 * comment
 */
`;
const data = parse(string);
// returns [ { name: "abstract" }, { name: "module", content: "Module" }, { content: "comment" } ]

const result = stringify(data);
// returns
/**
 * @abstract
 * @module Module
 * comment
 */
```
