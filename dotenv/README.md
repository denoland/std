# Dotenv handling for deno.

Setup a `.env` file in the root of your project.

```sh
# .env
GREETING=hello world
```

Then import the configuration using the `load` function.

```ts
import { load } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";

await load();
```

## Parse

```ts
import { parse } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";

const object = parse(`
  GREETING=hello world
  export EXPORT=exported
`);

console.log(object); // { env: { GREETING: "hello world", EXPORT: "exported" }, exports: ["EXPORT"] }
```

### Parse options

- `example?: DotEnvObject`: example object that the parsed data will be verified
  against.
- `allowEmptyValues?: boolean`: set to `true` to allow variables with an empty
  value.

## Stringify

```ts
import { stringify } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";

const string = stringify({
  env: { GREETING: "hello world", EXPORT: "exported" },
  exports: ["EXPORT"],
});

console.log(string);
/*
GREETING=hello world
export EXPORT=exported
*/
```

## Load

```ts
import { load } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";

const object = await load(Deno.env, { envPath: "path/to/.env" });
```

## LoadSync

```ts
import { loadSync } from "https://deno.land/std@$STD_VERSION/dotenv/mod.ts";

const object = loadSync(Deno.env, { envPath: "path/to/.env" });
```

### Load options

- `envPath?: string | URL`: the path or url to the .env file. Defaults to
  ".env".
- `examplePath?: string | URL`: the path or url to the .env.example file.
  Defaults to ".env.example".
- `defaultsPath?: string | URL`: the path or url to the .env.defaults file.
  Defaults to ".env.defaults".
- `allowEmptyValues?: boolean`: set to `true` to allow variables with an empty
  value.

## Auto loading

`load.ts` automatically loads the local `.env` file, verifies it against
`.env.exanple` if existent, adds defaults from `.env.defaults` if existent and
exports it to the process environment object:

```sh
# .env
GREETING=hello world
```

```ts
import "https://deno.land/std@$STD_VERSION/dotenv/load.ts";

console.log(Deno.env.get("GREETING")); // hello world
```

## Parsing Rules

The parsing engine currently supports the following rules:

- `BASIC=basic` becomes `{BASIC: 'basic'}`
- empty lines are skipped
- lines beginning with `#` are treated as comments
- empty values become empty strings (`EMPTY=` becomes `{EMPTY: ''}`)
- inner quotes are maintained (think JSON) (`JSON={"foo": "bar"}` becomes
  `{JSON:"{\"foo\": \"bar\"}"`)
- whitespace is removed from both ends of unquoted values (see more on
  [`trim`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim))
  (`FOO=  some value` becomes `{FOO: 'some value'}`)
- single and double quoted values are escaped (`SINGLE_QUOTE='quoted'` becomes
  `{SINGLE_QUOTE: "quoted"}`)
- single and double quoted values maintain whitespace from both ends
  (`FOO="  some value  "` becomes `{FOO: '  some value  '}`)
- double quoted values expand new lines (`MULTILINE="new\nline"` becomes

  ```
  { MULTILINE: "new
  line" }
  ```

- backticks are supported
  (`` BACKTICK_KEY=`This has 'single' and "double" quotes inside of it.` ``)

## Credit

- Inspired by the node module [`dotenv`](https://github.com/motdotla/dotenv).
