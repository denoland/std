<!-- Copyright 2018-2022 the Deno authors. All rights reserved. MIT license. -->

# envalid

Validate environment variables.

## Usage

```ts
// You can also use it with dotenv:
// import "https://deno.land/std@$STD_VERSION/dotenv/load.ts";
import {
  bool,
  cleanEnv,
  num,
  str,
} from "https://deno.land/std@$STD_VERSION/envalid/mod.ts";

// You can also do
// export default cleanEnv(
// to be importable from other locations.
const env = cleanEnv(Deno.env.toObject(), {
  TEXT: str(),
  IS_X: bool(),
  APP_ID: num(),
  SOMETHING: str({
    default: "default value",
    example: "some string",
    desc: "description",
    docs: "https://example.com/configuration#SOMETHING",
  }),
  CHOICE: str({ choices: ["can be this", "or this"] }),
});
```

## Validators

- `url()` - Requires the value to be a URL.
- `email()` - Requires the value to be an email address.
- `num()` - Parses values like "42", "0.23", and "1e5" into numbers.
- `json()` - Requires the value to be JSON, and calls `JSON.parse()` on it.
- `str()` - Requires the value to be set if a default value was not provided.
- `port()` - Requires the value to be a port (1-6553), and converts it to
  number.
- `host()` - Requires the value to be either a fully-qualified domain name or a
  v4/v6 IP address.
- `bool()` - Requires the value to be one of "1", "0", "true", "false", "t", or
  "f", and converts it to boolean.

## Custom Validators

You can create your own validators with `makeValidator()`. It takes a single
parameter which should be a function that returns either the cleaned value, or
throws if the value is not acceptable.

```ts
import {
  cleanEnv,
  makeValidator,
} from "https://deno.land/std@$STD_VERSION/envalid/mod.ts";

const twoUppercaseLetters = makeValidator((x) => {
  if (/^[A-Za-z]{2}$/.test(x)) {
    return x.toUpperCase();
  } else {
    throw new Error("Expected two letters");
  }
});

const env = cleanEnv(Deno.env.toObject(), {
  TWO_UPPERCASE_LETTERS: twoUppercaseLetters(),
});
```

## Reporting Errors

By default, if any variable is missing or has an invalid value, an error message
will be displayed and the process exits with 1. You can override this behavior
by using your own reporter:

```ts
import { cleanEnv } from "https://deno.land/std@$STD_VERSION/envalid/mod.ts";

const report = (error: string) => {
  //
};

const env = cleanEnv(Deno.env.toObject(), {}, {
  reporter: ({ errors, env }) => {
    report("Invalid environment variables: " + Object.keys(errors));
  },
});
```

The error classes `EnvError` and `EnvMissingError` can also be used to examine
the errors:

```ts
import {
  cleanEnv,
  EnvError,
  EnvMissingError,
} from "https://deno.land/std@$STD_VERSION/envalid/mod.ts";

const env = cleanEnv(Deno.env.toObject(), {}, {
  reporter: ({ errors, env }) => {
    for (const [envVar, err] of Object.entries(errors)) {
      if (err instanceof EnvError) {
        //
      } else if (err instanceof EnvMissingError) {
        //
      } else {
        //
      }
    }
  },
});
```

## Custom Middleware (Advanced)

The `customCleanEnv()` function allows you to completely override the
preprocessing and validations. Its arguments are similar to `cleanEnv()` except
for the third one being the custom middleware function.

The custom middleware function can modify the variables after they have been
cleaned and validated. The default middleware function,
`applyDefaultMiddleware()` can also be combined with it.

## Credits

- [af/envalid](https://github.com/af/envalid).
