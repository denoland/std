# Dotenv handling for deno.

## Usage

Setup a `.env` file in your project.

```sh
# .env
GREETING=hello world
```

Then import the configuration using the `parse` functions.

```ts
// app.ts
import { parse } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";
const source = await Deno.readTextFile("./path/to/.env");
const { env } = parse(source);

console.log(env);
```

Then run your app.

```
> deno app.ts
{ GREETING: "hello world" }
```

### Parse options

- `example?: DotEnvObject`: example object that the parsed data will be verified
  against.
- `allowEmptyValues?: boolean`: Set to `true` to allow required env variables to
  be empty. Otherwise it will throw an error if any variable is empty. Defaults
  to `false`.

## Auto loading

`load` automatically loads the local `.env` file and exports it to the passed
process environment object:

```sh
# .env
GREETING=hello world
```

### load

```ts
// app.ts
import { load } from "https://deno.land/std@$STD_VERSION/dotenv/load.ts";
await load();
console.log(Deno.env.get("GREETING"));
```

```
> deno --allow-env --allow-read app.ts
hello world
```

## Parsing Rules

The parsing engine currently supports the following rules:

- `BASIC=basic` becomes `{BASIC: 'basic'}`
- empty lines are skipped
- lines beginning with `#` are treated as comments
- empty values become empty strings (`EMPTY=` becomes `{EMPTY: ''}`)
- single and double quoted values are escaped (`SINGLE_QUOTE='quoted'` becomes
  `{SINGLE_QUOTE: "quoted"}`)
- new lines are expanded in double quoted values (`MULTILINE="new\nline"`
  becomes

```
{MULTILINE: 'new
line'}
```

- inner quotes are maintained (think JSON) (`JSON={"foo": "bar"}` becomes
  `{JSON:"{\"foo\": \"bar\"}"`)
- whitespace is removed from both ends of unquoted values (see more on
  [`trim`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim))
  (`FOO= some value` becomes `{FOO: 'some value'}`)
- whitespace is preserved on both ends of quoted values (`FOO=" some value "`
  becomes `{FOO: ' some value '}`)

## Credit

- Inspired by the node module [`dotenv`](https://github.com/motdotla/dotenv).
