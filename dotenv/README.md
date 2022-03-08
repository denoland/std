# Dotenv handling for deno.

## Usage

Setup a `.env` file in the root of your project.

```sh
# .env
GREETING=hello world
```

Then import the configuration using the `config` function.

```ts
// app.ts
import { config } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";

console.log(await config());
```

Then run your app.

```
> deno run --allow-read app.ts
{ GREETING: "hello world" }
```

### Options

- `path?: string`: Optional path to `.env` file. Defaults to `./.env`.
- `export?: boolean`: Set to `true` to export all `.env` variables to the
  current processes environment. Variables are then accessable via
  `Deno.env.get(<key>)`. Defaults to `false`.
- `safe?: boolean`: Set to `true` to ensure that all necessary environment
  variables are defined after reading from `.env`. It will read `.env.example`
  to get the list of needed variables.
- `example?: string`: Optional path to `.env.example` file. Defaults to
  `./.env.example`.
- `allowEmptyValues?: boolean`: Set to `true` to allow required env variables to
  be empty. Otherwise it will throw an error if any variable is empty. Defaults
  to `false`.
- `defaults?: string`: Optional path to `.env.defaults` file which defaults to
  `./.env.defaults`.

### Auto loading

`load.ts` automatically loads the local `.env` file on import and exports it to
the process environment:

```sh
# .env
GREETING=hello world
```

```ts
// app.ts
import "https://deno.land/std@$STD_VERSION/dotenv/load.ts";

console.log(Deno.env.get("GREETING"));
```

```
> deno run --allow-env --allow-read app.ts
hello world
```

### Safe Mode

To enable safe mode, create a `.env.example` file in the root of the project.

```sh
# .env.example
GREETING=
```

Then import the configuration with `safe` option set to `true`.

```ts
// app.ts
import { config } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";

console.log(await config({ safe: true }));
```

If any of the defined variables is not in `.env`, an error will occur. This
method is preferred because it prevents runtime errors in a production
application due to improper configuration.

Another way to suply required variables is externally, like so:

```sh
GREETING="hello world" deno run --allow-env app.ts
```

## Default Values

Default values can be easily added via creating a `.env.defaults` file and using
the same format as an`.env` file.

```sh
# .env.defaults
# Will not be set if GREETING is set in base .env file
GREETING="a secret to everybody"
```

## Parsing Rules

The parsing engine currently supports the following rules:

- Variables that already exist in the environment are not overridden with
  `export: true`
- `BASIC=basic` becomes `{ BASIC: "basic" }`
- empty lines are skipped
- lines beginning with `#` are treated as comments
- empty values become empty strings (`EMPTY=` becomes `{ EMPTY: "" }`)
- single and double quoted values are escaped (`SINGLE_QUOTE='quoted'` becomes
  `{ SINGLE_QUOTE: "quoted" }`)
- new lines are expanded in double quoted values (`MULTILINE="new\nline"`
  becomes

```
{ MULTILINE: "new
line" }
```

- inner quotes are maintained (think JSON) (`JSON={"foo": "bar"}` becomes
  `{ JSON: "{\"foo\": \"bar\"}" }`)
- whitespace is removed from both ends of unquoted values (see more on
  [`trim`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim))
  (`FOO= some value` becomes `{ FOO: "some value" }`)
- whitespace is preserved on both ends of quoted values (`FOO=" some value "`
  becomes `{ FOO: " some value " }`)

## Credit

- Inspired by the node module [`dotenv`](https://github.com/motdotla/dotenv).
