# encoding

Helper module for dealing with external data structures.

- [`ascii85`](#ascii85)
- [`base32`](#base32)
- [`base64`](#base64)
- [`base64url`](#base64url)
- [`binary`](#binary)
- [`csv`](#csv)
- [`front matter`](#front-matter)
- [`JSON streaming`](#json-streaming)
- [`jsonc`](#jsonc)
- [`toml`](#toml)
- [`yaml`](#yaml)

## Binary

Implements equivalent methods to Go's `encoding/binary` package.

Available Functions:

- `sizeof(dataType: DataTypes): number`
- `getNBytes(r: Deno.Reader, n: number): Promise<Uint8Array>`
- `varnum(b: Uint8Array, o: VarnumOptions = {}): number | null`
- `varbig(b: Uint8Array, o: VarbigOptions = {}): bigint | null`
- `putVarnum(b: Uint8Array, x: number, o: VarnumOptions = {}): number`
- `putVarbig(b: Uint8Array, x: bigint, o: VarbigOptions = {}): number`
- `readVarnum(r: Deno.Reader, o: VarnumOptions = {}): Promise<number>`
- `readVarbig(r: Deno.Reader, o: VarbigOptions = {}): Promise<bigint>`
- `writeVarnum(w: Deno.Writer, x: number, o: VarnumOptions = {}): Promise<number>`
- `writeVarbig(w: Deno.Writer, x: bigint, o: VarbigOptions = {}): Promise<number>`

## CSV

### API

#### `readMatrix`

Parse the CSV from the `reader` with the options provided and return
`string[][]`.

#### `parse`

Parse the CSV string/buffer with the options provided. The result of this
function is as follows:

- If you don't provide `opt.skipFirstRow` and `opt.columns`, it returns
  `string[][]`.
- If you provide `opt.skipFirstRow` or `opt.columns` it returns
  `Record<string, unknown>[]`.

##### `ParseOptions`

- **`skipFirstRow: boolean;`**: If you provide `skipFirstRow: true` and
  `columns`, the first line will be skipped. If you provide `skipFirstRow: true`
  but not `columns`, the first line will be skipped and used as header
  definitions.
- **`columns: string[] | ColumnOptions[];`**: If you provide `string[]` or
  `ColumnOptions[]`, those names will be used for header definition.

##### `ColumnOptions`

- **`name: string;`**: Name of the header to be used as property.

##### `ReadOptions`

- **`comma?: string;`**: Character which separates values. Default: `","`.
- **`comment?: string;`**: Character to start a comment. Default: `"#"`.
- **`trimLeadingSpace?: boolean;`**: Flag to trim the leading space of the
  value. Default: `false`.
- **`lazyQuotes?: boolean;`**: Allow unquoted quote in a quoted field or non
  double quoted quotes in quoted field. Default: `false`.
- **`fieldsPerRecord?`**: Enabling the check of fields for each row. If == 0,
  first row is used as referral for the number of fields.

#### `stringify`

- **`data`** is the source data to stringify. It's an array of items which are
  plain objects or arrays.

  `DataItem: Record<string, unknown> | unknown[]`

  ```ts
  const data = [
    {
      name: "Deno",
      repo: { org: "denoland", name: "deno" },
      runsOn: ["Rust", "TypeScript"],
    },
  ];
  ```

- **`columns`** is a list of instructions for how to target and transform the
  data for each column of output. This is also where you can provide an explicit
  header name for the column.

  `Column`:

  - The most essential aspect of a column is accessing the property holding the
    data for that column on each object in the data array. If that member is at
    the top level, `Column` can simply be a property accessor, which is either a
    `string` (if it's a plain object) or a `number` (if it's an array).

    ```ts
    const columns = [
      "name",
    ];
    ```

    Each property accessor will be used as the header for the column:

    | name |
    | :--: |
    | Deno |

  - If the required data is not at the top level (it's nested in other
    objects/arrays), then a simple property accessor won't work, so an array of
    them will be required.

    ```ts
    const columns = [
      ["repo", "name"],
      ["repo", "org"],
    ];
    ```

    When using arrays of property accessors, the header names inherit the value
    of the last accessor in each array:

    | name |   org    |
    | :--: | :------: |
    | deno | denoland |

  - If the data is not already in the required output format, or a different
    column header is desired, then a `ColumnDetails` object type can be used for
    each column:

    - **`fn?: (value: any) => string | Promise<string>`** is an optional
      function to transform the targeted data into the desired format

    - **`header?: string`** is the optional value to use for the column header
      name

    - **`prop: PropertyAccessor | PropertyAccessor[]`** is the property accessor
      (`string` or `number`) or array of property accessors used to access the
      data on each object

    ```ts
    const columns = [
      "name",
      {
        prop: ["runsOn", 0],
        header: "language 1",
        fn: (str: string) => str.toLowerCase(),
      },
      {
        prop: ["runsOn", 1],
        header: "language 2",
        fn: (str: string) => str.toLowerCase(),
      },
    ];
    ```

    | name | language 1 | language 2 |
    | :--: | :--------: | :--------: |
    | Deno |    rust    | typescript |

- **`options`** are options for the delimiter-separated output.

  - **`headers?: boolean`**: Whether or not to include the row of headers.
    Default: `true`

  - **`separator?: string`**: Delimiter used to separate values. Examples:
    - `","` _comma_ (Default)
    - `"\t"` _tab_
    - `"|"` _pipe_
    - etc.

### Basic Usage

```ts
import { parse } from "https://deno.land/std@$STD_VERSION/encoding/csv.ts";
const string = "a,b,c\nd,e,f";

console.log(
  await parse(string, {
    skipFirstRow: false,
  }),
);
// output:
// [["a", "b", "c"], ["d", "e", "f"]]
```

```ts
import {
  Column,
  stringify,
} from "https://deno.land/std@$STD_VERSION/encoding/csv.ts";

type Character = {
  age: number;
  name: {
    first: string;
    last: string;
  };
};

const data: Character[] = [
  {
    age: 70,
    name: {
      first: "Rick",
      last: "Sanchez",
    },
  },
  {
    age: 14,
    name: {
      first: "Morty",
      last: "Smith",
    },
  },
];

let columns: Column[] = [
  ["name", "first"],
  "age",
];

console.log(stringify(data, { columns }));
// first,age
// Rick,70
// Morty,14
```

## TOML

This module parse TOML files. It follows as much as possible the
[TOML specs](https://toml.io/en/latest). Be sure to read the supported types as
not every specs is supported at the moment and the handling in TypeScript side
is a bit different.

### Supported types and handling

- :heavy_check_mark: [Keys](https://toml.io/en/latest#keys)
- :exclamation: [String](https://toml.io/en/latest#string)
- :heavy_check_mark: [Multiline String](https://toml.io/en/latest#string)
- :heavy_check_mark: [Literal String](https://toml.io/en/latest#string)
- :exclamation: [Integer](https://toml.io/en/latest#integer)
- :heavy_check_mark: [Float](https://toml.io/en/latest#float)
- :heavy_check_mark: [Boolean](https://toml.io/en/latest#boolean)
- :heavy_check_mark:
  [Offset Date-time](https://toml.io/en/latest#offset-date-time)
- :heavy_check_mark:
  [Local Date-time](https://toml.io/en/latest#local-date-time)
- :heavy_check_mark: [Local Date](https://toml.io/en/latest#local-date)
- :exclamation: [Local Time](https://toml.io/en/latest#local-time)
- :heavy_check_mark: [Table](https://toml.io/en/latest#table)
- :heavy_check_mark: [Inline Table](https://toml.io/en/latest#inline-table)
- :exclamation: [Array of Tables](https://toml.io/en/latest#array-of-tables)

:exclamation: _Supported with warnings see [Warning](#Warning)._

#### :warning: Warning

##### String

- Regex : Due to the spec, there is no flag to detect regex properly in a TOML
  declaration. So the regex is stored as string.

##### Integer

For **Binary** / **Octal** / **Hexadecimal** numbers, they are stored as string
to be not interpreted as Decimal.

##### Local Time

Because local time does not exist in JavaScript, the local time is stored as a
string.

##### Inline Table

Inline tables are supported. See below:

```toml
animal = { type = { name = "pug" } }
## Output { animal: { type: { name: "pug" } } }
animal = { type.name = "pug" }
## Output { animal: { type : { name : "pug" } }
animal.as.leaders = "tosin"
## Output { animal: { as: { leaders: "tosin" } } }
"tosin.abasi" = "guitarist"
## Output { tosin.abasi: "guitarist" }
```

##### Array of Tables

At the moment only simple declarations like below are supported:

```toml
[[bin]]
name = "deno"
path = "cli/main.rs"

[[bin]]
name = "deno_core"
path = "src/foo.rs"

[[nib]]
name = "node"
path = "not_found"
```

will output:

```json
{
  "bin": [
    { "name": "deno", "path": "cli/main.rs" },
    { "name": "deno_core", "path": "src/foo.rs" }
  ],
  "nib": [{ "name": "node", "path": "not_found" }]
}
```

### Basic usage

```ts
import {
  parse,
  stringify,
} from "https://deno.land/std@$STD_VERSION/encoding/toml.ts";
const obj = {
  bin: [
    { name: "deno", path: "cli/main.rs" },
    { name: "deno_core", path: "src/foo.rs" },
  ],
  nib: [{ name: "node", path: "not_found" }],
};
const tomlString = stringify(obj);
console.log(tomlString);

// =>
// [[bin]]
// name = "deno"
// path = "cli/main.rs"

// [[bin]]
// name = "deno_core"
// path = "src/foo.rs"

// [[nib]]
// name = "node"
// path = "not_found"

const tomlObject = parse(tomlString);
console.log(tomlObject);

// =>
// {
//     bin: [
//       { name: "deno", path: "cli/main.rs" },
//       { name: "deno_core", path: "src/foo.rs" }
//     ],
//     nib: [ { name: "node", path: "not_found" } ]
//   }
```

## YAML

YAML parser / dumper for Deno.

Heavily inspired from [`js-yaml`](https://github.com/nodeca/js-yaml).

### Basic usage

`parse` parses the yaml string, and `stringify` dumps the given object to YAML
string.

```ts
import {
  parse,
  stringify,
} from "https://deno.land/std@$STD_VERSION/encoding/yaml.ts";

const data = parse(`
foo: bar
baz:
  - qux
  - quux
`);
console.log(data);
// => { foo: "bar", baz: [ "qux", "quux" ] }

const yaml = stringify({ foo: "bar", baz: ["qux", "quux"] });
console.log(yaml);
// =>
// foo: bar
// baz:
//   - qux
//   - quux
```

If your YAML contains multiple documents in it, you can use `parseAll` for
handling it.

```ts
import { parseAll } from "https://deno.land/std@$STD_VERSION/encoding/yaml.ts";

const data = parseAll(`
---
id: 1
name: Alice
---
id: 2
name: Bob
---
id: 3
name: Eve
`);
console.log(data);
// => [ { id: 1, name: "Alice" }, { id: 2, name: "Bob" }, { id: 3, name: "Eve" } ]
```

To handle `regexp`, and `undefined` types, use the `EXTENDED_SCHEMA`. Note that
functions are no longer supported for security reasons

```ts
import {
  EXTENDED_SCHEMA,
  parse,
} from "https://deno.land/std@$STD_VERSION/encoding/yaml.ts";

const data = parse(
  `
  regexp:
    simple: !!js/regexp foobar
    modifiers: !!js/regexp /foobar/mi
  undefined: !!js/undefined ~
# Disabled, see: https://github.com/denoland/deno_std/pull/1275
#  function: !!js/function >
#    function foobar() {
#      return 'hello world!';
#    }
`,
  { schema: EXTENDED_SCHEMA },
);
```

You can also use custom types by extending schemas.

```ts
import {
  DEFAULT_SCHEMA,
  parse,
  Type,
} from "https://deno.land/std@$STD_VERSION/encoding/yaml.ts";

const yaml = "...";
const MyYamlType = new Type("!myYamlType", {
  kind: "sequence",
  /* other type options here*/
});
const MY_SCHEMA = DEFAULT_SCHEMA.extend({ explicit: [MyYamlType] });

parse(yaml, { schema: MY_SCHEMA });
```

### API

#### `parse(str: string, opts?: ParserOption): unknown`

Parses the YAML string with a single document.

#### `parseAll(str: string, iterator?: Function, opts?: ParserOption): unknown`

Parses the YAML string with multiple documents. If the iterator is given, it's
applied to every document instead of returning the array of parsed objects.

#### `stringify(obj: object, opts?: DumpOption): string`

Serializes `object` as a YAML document.

### :warning: Limitations

- `binary` type is currently not stable.

### More example

See: https://github.com/nodeca/js-yaml/tree/master/examples

## JSON streaming

Streams JSON concatenated with line breaks or special characters. This module
supports the following formats:

- [JSON lines](https://jsonlines.org/)
- [NDJSON](http://ndjson.org/)
- [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464)
- [Concatenated JSON](https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON)
- JSON concatenated with any delimiter

### Basic usage

If you want to parse JSON separated by a delimiter, use `TextLineStream` (or
`TextDelimiterStream`) and `JsonParseStream`. `JsonParseStream` ignores chunks
consisting of spaces, tab characters, or newline characters .

```ts
// parse JSON lines or NDJSON
import { TextLineStream } from "https://deno.land/std@$STD_VERSION/streams/mod.ts";
import { JsonParseStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";

const url =
  "https://deno.land/std@$STD_VERSION/encoding/testdata/json/test.jsonl";
const { body } = await fetch(url);

const readable = body!
  .pipeThrough(new TextDecoderStream()) // convert Uint8Array to string
  .pipeThrough(new TextLineStream()) // transform into a stream where each chunk is divided by a newline
  .pipeThrough(new JsonParseStream()); // parse each chunk as JSON

for await (const data of readable) {
  console.log(data);
}
```

```ts
// parse JSON Text Sequences
import { TextDelimiterStream } from "https://deno.land/std@$STD_VERSION/streams/mod.ts";
import { JsonParseStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";

const url =
  "https://deno.land/std@$STD_VERSION/encoding/testdata/json/test.json-seq";
const { body } = await fetch(url);

const delimiter = "\x1E";
const readable = body!
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TextDelimiterStream(delimiter)) // transform into a stream where each chunk is divided by a delimiter
  .pipeThrough(new JsonParseStream());

for await (const data of readable) {
  console.log(data);
}
```

If you want to parse
[Concatenated JSON](https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON),
use `ConcatenatedJsonParseStream`.

```ts
import { ConcatenatedJsonParseStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";

const url =
  "https://deno.land/std@$STD_VERSION/encoding/testdata/json/test.concatenated-json";
const { body } = await fetch(url);

const readable = body!
  .pipeThrough(new TextDecoderStream()) // convert Uint8Array to string
  .pipeThrough(new ConcatenatedJsonParseStream()); // parse Concatenated JSON

for await (const data of readable) {
  console.log(data);
}
```

Use `JsonStringifyStream` to transform streaming data to
[JSON lines](https://jsonlines.org/), [NDJSON](http://ndjson.org/),
[NDJSON](http://ndjson.org/) or
[Concatenated JSON](https://en.wikipedia.org/wiki/JSON_streaming#Concatenated_JSON).

By default, `JsonStringifyStream` adds "\n" as a suffix after each chunk.

```ts
import { readableStreamFromIterable } from "https://deno.land/std@$STD_VERSION/streams/mod.ts";
import { JsonStringifyStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";

const file = await Deno.open("./tmp.jsonl", { create: true, write: true });

readableStreamFromIterable([{ foo: "bar" }, { baz: 100 }])
  .pipeThrough(new JsonStringifyStream()) // convert to JSON lines (ndjson)
  .pipeThrough(new TextEncoderStream()) // convert a string to a Uint8Array
  .pipeTo(file.writable)
  .then(() => console.log("write success"));
```

If you want to use an arbitrary delimiter, specify prefix and suffix as options.
These are added before and after chunk after stringify. To convert to
[JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464), set the
prefix to the delimiter "\x1E" as options.

```ts
import { readableStreamFromIterable } from "https://deno.land/std@$STD_VERSION/streams/mod.ts";
import { JsonStringifyStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";

const file = await Deno.open("./tmp.jsonl", { create: true, write: true });

readableStreamFromIterable([{ foo: "bar" }, { baz: 100 }])
  .pipeThrough(new JsonStringifyStream({ prefix: "\x1E", suffix: "\n" })) // convert to JSON Text Sequences
  .pipeThrough(new TextEncoderStream())
  .pipeTo(file.writable)
  .then(() => console.log("write success"));
```

If you want to stream [JSON lines](https://jsonlines.org/) from the server:

```ts
import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
import { JsonStringifyStream } from "https://deno.land/std@$STD_VERSION/encoding/json/stream.ts";

// A server that streams one line of JSON every second
serve(() => {
  let intervalId: number | undefined;
  const readable = new ReadableStream({
    start(controller) {
      // enqueue data once per second
      intervalId = setInterval(() => {
        controller.enqueue({ now: new Date() });
      }, 1000);
    },
    cancel() {
      clearInterval(intervalId);
    },
  });

  const body = readable
    .pipeThrough(new JsonStringifyStream()) // convert data to JSON lines
    .pipeThrough(new TextEncoderStream()); // convert a string to a Uint8Array

  return new Response(body);
});
```

## JSONC

JSONC (JSON with Comments) parser for Deno.

### API

#### `parse(text: string, options: { allowTrailingComma?: boolean; })`

Parses the JSONC string. Setting allowTrailingComma to false rejects trailing
commas in objects and arrays. If parsing fails, throw a SyntaxError.

### Basic usage

```ts
import * as JSONC from "https://deno.land/std@$STD_VERSION/encoding/jsonc.ts";

console.log(JSONC.parse('{"foo": "bar", } // comment')); //=> { foo: "bar" }
console.log(JSONC.parse('{"foo": "bar", } /* comment */')); //=> { foo: "bar" }
console.log(JSONC.parse('{"foo": "bar" } // comment', {
  allowTrailingComma: false,
})); //=> { foo: "bar" }
```

## base32

[RFC4648 base32](https://tools.ietf.org/html/rfc4648#section-6) encoder/decoder
for Deno.

### Basic usage

`encode` encodes a `Uint8Array` to RFC4648 base32 representation, and `decode`
decodes the given RFC4648 base32 representation to a `Uint8Array`.

```ts
import {
  decode,
  encode,
} from "https://deno.land/std@$STD_VERSION/encoding/base32.ts";

const b32Repr = "RC2E6GA=";

const binaryData = decode(b32Repr);
console.log(binaryData);
// => Uint8Array [ 136, 180, 79, 24 ]

console.log(encode(binaryData));
// => RC2E6GA=
```

## base64

[RFC4648 base64](https://tools.ietf.org/html/rfc4648#section-4) encoder/decoder
for Deno.

### Basic usage

`encode` encodes a `Uint8Array` to RFC4648 base64 representation, and `decode`
decodes the given RFC4648 base64 representation to a `Uint8Array`.

```ts
import {
  decode,
  encode,
} from "https://deno.land/std@$STD_VERSION/encoding/base64.ts";

const b64Repr = "Zm9vYg==";

const binaryData = decode(b64Repr);
console.log(binaryData);
// => Uint8Array [ 102, 111, 111, 98 ]

console.log(encode(binaryData));
// => Zm9vYg==
```

## base64url

[RFC4648 base64url](https://datatracker.ietf.org/doc/html/rfc4648#section-5)
encoder/decoder for Deno.

### Basic usage

`encode` encodes a `Uint8Array` to RFC4648 base64url representation, and
`decode` decodes the given RFC4648 base64url representation to a `Uint8Array`.

```ts
import {
  decode,
  encode,
} from "https://deno.land/std@$STD_VERSION/encoding/base64url.ts";

const binary = new TextEncoder().encode("foobar");
const encoded = encode(binary);
console.log(encoded);
// => "Zm9vYmFy"

console.log(decode(encoded));
// => Uint8Array(6) [ 102, 111, 111, 98, 97, 114 ]
```

## ascii85

Ascii85/base85 encoder and decoder with support for multiple standards.

### Basic usage

`encode` encodes a `Uint8Array` to a ascii85 representation, and `decode`
decodes the given ascii85 representation to a `Uint8Array`.

```ts
import {
  decode,
  encode,
} from "https://deno.land/std@$STD_VERSION/encoding/ascii85.ts";

const a85Repr = "LpTqp";

const binaryData = decode(a85Repr);
console.log(binaryData);
// => Uint8Array [ 136, 180, 79, 24 ]

console.log(encode(binaryData));
// => LpTqp
```

### Specifying a standard and delimiter

By default all functions are using the most popular Adobe version of ascii85 and
not adding any delimiter. However, there are three more standards supported -
btoa (different delimiter and additional compression of 4 bytes equal to 32),
[Z85](https://rfc.zeromq.org/spec/32/) and
[RFC 1924](https://tools.ietf.org/html/rfc1924). It's possible to use a
different encoding by specifying it in `options` object as a second parameter.

Similarly, it's possible to make `encode` add a delimiter (`<~` and `~>` for
Adobe, `xbtoa Begin` and `xbtoa End` with newlines between the delimiters and
encoded data for btoa. Checksums for btoa are not supported. Delimiters are not
supported by other encodings.)

encoding examples:

```ts
import {
  decode,
  encode,
} from "https://deno.land/std@$STD_VERSION/encoding/ascii85.ts";
const binaryData = new Uint8Array([136, 180, 79, 24]);
console.log(encode(binaryData));
// => LpTqp
console.log(encode(binaryData, { standard: "Adobe", delimiter: true }));
// => <~LpTqp~>
console.log(encode(binaryData, { standard: "btoa", delimiter: true }));
/* => xbtoa Begin
LpTqp
xbtoa End */
console.log(encode(binaryData, { standard: "RFC 1924" }));
// => h_p`_
console.log(encode(binaryData, { standard: "Z85" }));
// => H{P}{
```

## hex

hexadecimal encoder/decoder for Deno.

### Basic usage

`encode` encodes a `Uint8Array` to hexadecimal `Uint8Array` with 2 * length, and
`decode` decodes the given hexadecimal `Uint8Array` to a `Uint8Array`.

```ts
import {
  decode,
  encode,
} from "https://deno.land/std@$STD_VERSION/encoding/hex.ts";

const binary = new TextEncoder().encode("abc");
const encoded = encode(binary);
console.log(encoded);
// => Uint8Array(6) [ 54, 49, 54, 50, 54, 51 ]

console.log(decode(encoded));
// => Uint8Array(3) [ 97, 98, 99 ]
```

## Front Matter

Extracts [front matter](https://daily-dev-tips.com/posts/what-exactly-is-frontmatter/) from strings.

Supported formats:
  - [`YAML`](./front_matter/yaml.ts)
  - [`TOML`](./front_matter/toml.ts)
  - [`JSON`](./front_matter/json.ts)

### Basic usage

example.md
```
---
module: front_matter
tags:
  - yaml
  - toml
  - json
---

deno is awesome
```

example.ts
```ts
import { extract, test } from "https://deno.land/std@$STD_VERSION/encoding/front_matter/any.ts";

const str = await Deno.readTextFile("./example.md");

if (test(str)) {
  console.log(extract(str));
} else {
  console.log("document doesn't contain front matter");
}
```

```
$ deno run ./example.ts
{
  frontMatter: "module: front_matter\ntags:\n  - yaml\n  - toml\n  - json",
  body: "deno is awesome",
  attrs: { module: "front_matter", tags: [ "yaml", "toml", "json" ] }
}
```

The above example recognizes any of the supported formats, extracts metadata
and parses accordingly. Please note that in this case both the [YAML](#yaml) 
and [TOML](#toml) parsers will be imported as dependencies.

If you need only one specific format then you can import the file named respectively from [here](./front_matter).

### Advanced usage

```ts
import { createExtractor, test as _test, Format, Parser } from "https://deno.land/std@$STD_VERSION/encoding/front_matter/mod.ts";
import { parse } from "https://deno.land/std@$STD_VERSION/encoding/toml.ts";

const extract = createExtractor({
  [Format.TOML]: parse as Parser,
  [Format.JSON]: JSON.parse as Parser,
});

export function test(str: string): boolean {
  return _test(str, [Format.TOML, Format.JSON]);
}

export function recognize(str: string): Format {
  return _recognize(str, [Format.TOML, Format.JSON]);
}
```

These function will work with TOML and JSON and only. This way the 
YAML parser is not loaded if not needed.

### Delimiters

#### YAML
```
---
these: are
---
```
```
---yaml
all: recognized
---
```
```
= yaml =
as: yaml
= yaml =
```

#### TOML
```
---toml
this = 'is'
---
```
```
= toml =
parsed = 'as'
toml = 'data'
= toml =
```

#### JSON
```
---json
{
  "and": "this"
}
---
```
```
{
  "is": "JSON"
}
```