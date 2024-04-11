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

Symbols and modules are documented using the [JSDoc](https://jsdoc.app/) syntax.
It should be written in the same style as the
[MDN Web Docs](https://developer.mozilla.org/).

### Public symbols

Documentation for public symbols should contain:

1. A description, first
1. [`@param`](https://jsdoc.app/tags-param) tags for each parameter and a
   [`@returns`](https://jsdoc.app/tags-returns) tag, if the symbol is a
   function.
1. At least one example code snippet using the
   [`@example`](https://jsdoc.app/tags-example) tag and a title. The code is
   reproducible when copied and pasted as a script.

See the source code within
[`std/datetime`](https://github.com/denoland/deno_std/tree/main/datetime) for
examples.

### Module documentation

Module files, or `mod.ts` files, should have the following:

1. A high-level description of the package.
1. Sections providing brief overviews of the APIs within the package, including
   minimal example code snippets (without the `@example` tag).
1. A [`@module`](https://jsdoc.app/tags-module) to denote module documentation.

See the source code for
[`std/datetime/mod.ts`](https://github.com/denoland/deno_std/blob/main/datetime/mod.ts)
as an example.
