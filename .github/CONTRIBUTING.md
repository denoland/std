# Contributing Guide

## Code of Conduct and Style Guide

Please read our [code of conduct](./CODE_OF_CONDUCT.md) and
[style guide](https://docs.deno.com/runtime/manual/references/contributing/style_guide)
before contributing.

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
1. Submit a pull request with a clear title and description of your changes and
   reference any relevant issues.

   Examples of good titles:

   - fix(http): fix race condition in server
   - docs(fmt): update docstrings
   - feat(log): handle nested messages

   Examples of bad titles:

   - fix #7123
   - update docs
   - fix bugs

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

1. Use the following convention for test names:
   ```
   <symbol>() <criteria>
   ```

   Examples:
   - assertEquals() matches when values are equal
   - ensureDirSync() creates dir if it does not exist
   - chunk() throws on non-naturals
