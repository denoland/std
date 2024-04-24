# Deno Standard Library

[![JSR @std](https://jsr.io/badges/@std)](https://jsr.io/@std)
[![codecov](https://codecov.io/gh/denoland/deno_std/branch/main/graph/badge.svg?token=w6s3ODtULz)](https://codecov.io/gh/denoland/deno_std)
[![ci](https://github.com/denoland/deno_std/actions/workflows/ci.yml/badge.svg)](https://github.com/denoland/deno_std/actions/workflows/ci.yml)

High-quality APIs for [Deno](https://deno.com/) and the web. Use fearlessly.

> **NOTE:** The standard library is also available on JSR - check out the
> [`@std` scope on JSR here](https://jsr.io/@std).

## Get Started

```ts
import { copy } from "https://deno.land/std@$STD_VERSION/fs/copy.ts";

await copy("./foo", "./bar");
```

See [here](#recommended-usage) for recommended usage patterns.

## Documentation

Check out the documentation [here](https://deno.land/std?doc).

## Recommended Usage

1. Include the version of the library in the import specifier.

   Good:
   ```ts
   import { copy } from "https://deno.land/std@$STD_VERSION/fs/copy.ts";
   ```

1. Only import modules that you require.

   Bad (when using only one function):
   ```ts
   import * as fs from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
   ```

   Good (when using only one function):
   ```ts
   import { copy } from "https://deno.land/std@$STD_VERSION/fs/copy.ts";
   ```

   Good (when using multiple functions):
   ```ts
   import * as fs from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
   ```

1. Do not import symbols with a name _prefixed_ by an underscore (they're not
   intended for public use).

   Bad:
   ```ts, ignore
   import { _format } from "https://deno.land/std@$STD_VERSION/path/_common/format.ts";
   ```

1. Do not import modules with a directory or filename _prefixed_ by an
   underscore (they're not intended for public use).

   Bad:
   ```ts, ignore
   import { createLPS } from "https://deno.land/std@$STD_VERSION/streams/_common.ts";
   ```

   Good:
   ```ts
   import { TextLineStream } from "https://deno.land/std@$STD_VERSION/streams/text_line_stream.ts";
   ```

1. Do not import test modules or test data.

   Bad:
   ```ts
   import { test } from "https://deno.land/std@$STD_VERSION/front_matter/test.ts";
   ```

## Packages

For a package to reach v1 (aka stable) status, it must meet the following
requirements:

1. Approved by four members of the internal team. There must be consensus that
   the API design is satisfactory and unlikely to change in the future.
1. 100% documented, passing `deno doc --lint` checks and adhering to the
   [documentation guidelines](https://github.com/denoland/deno_std/blob/main/.github/CONTRIBUTING.md#documentation).
1. Maximum possible test coverage
1. No open issues or pull requests that might lead to breaking changes. For
   example, issues that suggest new non-breaking features are fine to exist at
   stabilization.

| Package                                                | Status     | Latest version                                                                            |
| ------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------- |
| [archive](https://jsr.io/@std/archive)                 | Unstable   | [![JSR](https://jsr.io/badges/@std/archive)](https://jsr.io/@std/archive)                 |
| [assert](https://jsr.io/@std/assert)                   | Settled    | [![JSR](https://jsr.io/badges/@std/assert)](https://jsr.io/@std/assert)                   |
| [async](https://jsr.io/@std/async)                     | Settled    | [![JSR](https://jsr.io/badges/@std/async)](https://jsr.io/@std/async)                     |
| [bytes](https://jsr.io/@std/bytes)                     | Settled    | [![JSR](https://jsr.io/badges/@std/bytes)](https://jsr.io/@std/bytes)                     |
| [cli](https://jsr.io/@std/cli)                         | Unstable   | [![JSR](https://jsr.io/badges/@std/cli)](https://jsr.io/@std/cli)                         |
| [collections](https://jsr.io/@std/collections)         | Settled    | [![JSR](https://jsr.io/badges/@std/collections)](https://jsr.io/@std/collections)         |
| [console](https://jsr.io/@std/console)                 | Deprecated | [![JSR](https://jsr.io/badges/@std/console)](https://jsr.io/@std/console)                 |
| [crypto](https://jsr.io/@std/crypto)                   | Settled    | [![JSR](https://jsr.io/badges/@std/crypto)](https://jsr.io/@std/crypto)                   |
| [csv](https://jsr.io/@std/csv)                         | Settled    | [![JSR](https://jsr.io/badges/@std/csv)](https://jsr.io/@std/csv)                         |
| [data_structures](https://jsr.io/@std/data_structures) | Unstable   | [![JSR](https://jsr.io/badges/@std/data-structures)](https://jsr.io/@std/data-structures) |
| [datetime](https://jsr.io/@std/datetime)               | Unstable   | [![JSR](https://jsr.io/badges/@std/datetime)](https://jsr.io/@std/datetime)               |
| [dotenv](https://jsr.io/@std/dotenv)                   | Unstable   | [![JSR](https://jsr.io/badges/@std/dotenv)](https://jsr.io/@std/dotenv)                   |
| [encoding](https://jsr.io/@std/encoding)               | Settled    | [![JSR](https://jsr.io/badges/@std/encoding)](https://jsr.io/@std/encoding)               |
| [expect](https://jsr.io/@std/expect)                   | Unstable   | [![JSR](https://jsr.io/badges/@std/expect)](https://jsr.io/@std/expect)                   |
| [flags](https://jsr.io/@std/flags)                     | Deprecated | [![JSR](https://jsr.io/badges/@std/flags)](https://jsr.io/@std/flags)                     |
| [fmt](https://jsr.io/@std/fmt)                         | Settled    | [![JSR](https://jsr.io/badges/@std/fmt)](https://jsr.io/@std/fmt)                         |
| [front_matter](https://jsr.io/@std/front-matter)       | Settled    | [![JSR](https://jsr.io/badges/@std/front-matter)](https://jsr.io/@std/front-matter)       |
| [fs](https://jsr.io/@std/fs)                           | Settled    | [![JSR](https://jsr.io/badges/@std/fs)](https://jsr.io/@std/fs)                           |
| [html](https://jsr.io/@std/html)                       | Unstable   | [![JSR](https://jsr.io/badges/@std/html)](https://jsr.io/@std/html)                       |
| [http](https://jsr.io/@std/http)                       | Unstable   | [![JSR](https://jsr.io/badges/@std/http)](https://jsr.io/@std/http)                       |
| [ini](https://jsr.io/@std/ini)                         | Unstable   | [![JSR](https://jsr.io/badges/@std/ini)](https://jsr.io/@std/ini)                         |
| [io](https://jsr.io/@std/io)                           | Unstable   | [![JSR](https://jsr.io/badges/@std/io)](https://jsr.io/@std/io)                           |
| [json](https://jsr.io/@std/json)                       | Settled    | [![JSR](https://jsr.io/badges/@std/json)](https://jsr.io/@std/json)                       |
| [jsonc](https://jsr.io/@std/jsonc)                     | Settled    | [![JSR](https://jsr.io/badges/@std/jsonc)](https://jsr.io/@std/jsonc)                     |
| [log](https://jsr.io/@std/log)                         | Unstable   | [![JSR](https://jsr.io/badges/@std/log)](https://jsr.io/@std/log)                         |
| [media_types](https://jsr.io/@std/media-types)         | Settled    | [![JSR](https://jsr.io/badges/@std/media-types)](https://jsr.io/@std/media-types)         |
| [msgpack](https://jsr.io/@std/msgpack)                 | Unstable   | [![JSR](https://jsr.io/badges/@std/msgpack)](https://jsr.io/@std/msgpack)                 |
| [net](https://jsr.io/@std/net)                         | Unstable   | [![JSR](https://jsr.io/badges/@std/net)](https://jsr.io/@std/net)                         |
| [path](https://jsr.io/@std/path)                       | Settled    | [![JSR](https://jsr.io/badges/@std/path)](https://jsr.io/@std/path)                       |
| [permissions](https://jsr.io/@std/permissions)         | Deprecated | [![JSR](https://jsr.io/badges/@std/permissions)](https://jsr.io/@std/permissions)         |
| [regexp](https://jsr.io/@std/regexp)                   | Unstable   | [![JSR](https://jsr.io/badges/@std/regexp)](https://jsr.io/@std/regexp)                   |
| [semver](https://jsr.io/@std/semver)                   | Unstable   | [![JSR](https://jsr.io/badges/@std/semver)](https://jsr.io/@std/semver)                   |
| [streams](https://jsr.io/@std/streams)                 | Settled    | [![JSR](https://jsr.io/badges/@std/streams)](https://jsr.io/@std/streams)                 |
| [testing](https://jsr.io/@std/testing)                 | Settled    | [![JSR](https://jsr.io/badges/@std/testing)](https://jsr.io/@std/testing)                 |
| [text](https://jsr.io/@std/text)                       | Unstable   | [![JSR](https://jsr.io/badges/@std/text)](https://jsr.io/@std/text)                       |
| [toml](https://jsr.io/@std/toml)                       | Settled    | [![JSR](https://jsr.io/badges/@std/toml)](https://jsr.io/@std/toml)                       |
| [ulid](https://jsr.io/@std/ulid)                       | Unstable   | [![JSR](https://jsr.io/badges/@std/ulid)](https://jsr.io/@std/ulid)                       |
| [url](https://jsr.io/@std/url)                         | Unstable   | [![JSR](https://jsr.io/badges/@std/url)](https://jsr.io/@std/url)                         |
| [uuid](https://jsr.io/@std/uuid)                       | Settled    | [![JSR](https://jsr.io/badges/@std/uuid)](https://jsr.io/@std/uuid)                       |
| [webgpu](https://jsr.io/@std/webgpu)                   | Unstable   | [![JSR](https://jsr.io/badges/@std/webgpu)](https://jsr.io/@std/webgpu)                   |
| [yaml](https://jsr.io/@std/yaml)                       | Settled    | [![JSR](https://jsr.io/badges/@std/yaml)](https://jsr.io/@std/yaml)                       |

> Note: Settled status means a package is unlikely to have breaking changes, but
> has not yet achieved v1 status.

## Architecture

Check out the architecture guide [here](./.github/ARCHITECTURE.md).

## Design

### Minimal Exports

Files are structured to minimize the number of dependencies they incur and the
amount of effort required to manage them, both for the maintainer and the user.
In most cases, only a single function or class, alongside its related types, are
exported. In other cases, functions that incur negligible dependency overhead
will be grouped together in the same file.

## Deprecation Policy

We deprecate the APIs in the Standard Library when they get covered by new
JavaScript language APIs or new Web Standard APIs. These APIs are usually
removed after 3 minor versions.

If you still need to use such APIs after the removal for some reason (for
example, the usage in Fresh island), please use the URL pinned to the version
where they are still available.

For example, if you want to keep using `readableStreamFromIterable`, which was
deprecated and removed in favor of `ReadableStream.from` in `v0.195.0`, please
use the import URL pinned to `v0.194.0`:

```ts
import { readableStreamFromIterable } from "https://deno.land/std@0.194.0/streams/readable_stream_from_iterable.ts";
```

## Contributing

Check out the contributing guidelines [here](.github/CONTRIBUTING.md).

## Releases

The Standard Library is versioned independently of the Deno CLI. This will
change once the Standard Library is stabilized. See
[here](https://deno.com/versions.json) for the compatibility of different
versions of the Deno Standard Library and the Deno CLI.

A new minor version of the Standard Library is published at the same time as
every new version of the Deno CLI (including patch versions).

## Badge

[![Built with the Deno Standard Library](./badge.svg)](https://deno.land/std)

```html
<a href="https://deno.land/std">
  <img
    width="135"
    height="20"
    src="https://raw.githubusercontent.com/denoland/deno_std/main/badge.svg"
    alt="Built with the Deno Standard Library"
  />
</a>
```

```md
[![Built with the Deno Standard Library](https://raw.githubusercontent.com/denoland/deno_std/main/badge.svg)](https://deno.land/std)
```
