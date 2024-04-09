# Contributing Guide

## Code of Conduct, Style Guide and Architecture Guide

Please read our [code of conduct](./CODE_OF_CONDUCT.md),
[style guide](https://docs.deno.com/runtime/manual/references/contributing/style_guide)
and [architecture guide](./ARCHITECTURE.md) before contributing.

## Issues

1. Check for existing issues before creating a new one.
1. When creating an issue, be clear, provide as much detail as possible and
   provide examples, when possible.

## Pull Requests

1. [Install the Deno CLI](https://docs.deno.com/runtime/manual/getting_started/installation).
1. Fork and clone the repository.
1. Set up git submodules:
   ```bash
   git submodule update --init
   ```
1. Create a new branch for your changes.
1. Make your changes and ensure `deno task ok` passes successfully.
1. Commit your changes with clear messages.
1. Submit a pull request with the sub-module in question, and a clear title and
   description, as follows:
   - fix(http): fix race condition in server
   - docs(fmt): update docstrings
   - feat(log): handle nested messages

## Deprecations

1. See the [deprecation policy](/README.md#deprecation-policy) for how
   deprecations work.
1. Start creating a pull request by adding a deprecation notice to the given
   symbol with the following format, including the removal version and links to
   any relevant replacement symbols or documentation:

   ```ts
   // /sub/foo.ts
   /**
    * @deprecated (will be removed in 0.215.0) Use {@linkcode bar} instead.
    */
   export function foo() {}
   ```

1. Submit a pull request starting with the following format:

   ```
   deprecation(sub): `foo()`
   ```

## Tests

### Test names

Use a test name that includes the symbol in question and the test criteria, in
plain language, as follows:

- assertEquals() matches when values are equal
- ensureDirSync() creates dir if it does not exist
- Server exposes the addresses the server is listening on as addrs property

## Documentation

Documentation must be clear, concise and thorough, and be written in
[JSDoc](https://jsdoc.app/) syntax. In general, the documentation style should
be as close to the [MDN Web Docs](https://developer.mozilla.org/) as possible.

### Public symbols

For public symbols, include the following pieces of documentation in the
following order (if applicable):

1. A description of the symbol, including its purpose, what it performs, and
   behaviors of various use cases.
1. If it is a function, method or class, a description of each parameter using
   the [`@param`](https://jsdoc.app/tags-param) tag.
1. If it is a function or method, a description of the return value using the
   [`@returns`](https://jsdoc.app/tags-returns) tag.
1. At least one minimal example code snippet using the
   [`@example`](https://jsdoc.app/tags-example) tag for basic usage. The reader
   should be able to copy and execute the code snippet with the expected values.

See the following examples:

- `copy()` from `std/fs`
  ([source](https://github.com/denoland/deno_std/blob/main/fs/copy.ts) and
  [documentation](https://jsr.io/@std/fs/doc/~/copy))

- `weekOfYear()` from `std/datetime`
  ([source](https://github.com/denoland/deno_std/blob/main/datetime/week_of_year.ts)
  and [documentation](https://jsr.io/@std/datetime/doc/~/weekOfYear))
