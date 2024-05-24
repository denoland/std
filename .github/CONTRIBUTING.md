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
1. Create a new branch for your changes.
1. Make your changes and ensure `deno task ok` passes successfully.
1. Commit your changes with clear messages.
1. Submit a pull request with the package in question, and a clear title and
   description, as follows:
   - fix(http): fix race condition in server
   - docs(fmt): update docstrings
   - feat(log): handle nested messages

<!--deno-fmt-ignore-start-->
> [!TIP]
> If creating a new package, please add the package name to the `scopes` list in
> the [`title` workflow](./workflows/title.yml#L38). This must be done a pull
> request that precedes the pull request that implements the new package.
<!--deno-fmt-ignore-end-->

## Deprecations

1. See the [deprecation policy](/README.md#deprecation-policy) for how
   deprecations work.
1. Start creating a pull request by adding a deprecation notice to the given
   symbol with the following format, including the removal version and links to
   any relevant replacement symbols or documentation:

   ```ts
   // /sub/foo.ts
   /**
    * @deprecated This will be removed in 0.215.0. Use {@linkcode bar} instead.
    */
   export function foo() {}
   ```

1. Submit a pull request starting with the following format:

   ```
   deprecation(<package>): <symbol>
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
These guidelines follow the recommendations in the blog post,
[How to document your JavaScript package](https://deno.com/blog/document-javascript-package).

### Public symbols

Where applicable, documentation for public symbols should contain, in order:

1. A short description, then any further details in new paragraph(s).
1. A `@typeParam` tag for each type parameter.
1. A [`@param`](https://jsdoc.app/tags-param) tag for each parameter.
1. A [`@returns`](https://jsdoc.app/tags-returns) tag for the return value.
1. At least one example code snippet using the
   [`@example`](https://jsdoc.app/tags-example) tag and a title. For simple
   examples which don't need a description, "Usage" is an acceptable title. See
   [Example code snippets](#example-code-snippets) below for further guidance.

See the source code within
[`@std/bytes`](https://github.com/denoland/deno_std/tree/main/bytes) for
examples.

Once the documentation for a given package is written, add the package's entry
point(s) (usually just `mod.ts`) to the `ENTRY_POINTS` array in the
[documentation checker tool](../_tools/check_docs.ts).

Once done, run `deno task lint:docs` which checks that documentation is complete
in the given entry points.

### Module documentation

Module files, or `mod.ts` files, should have the following:

1. A high-level description of the package.
1. One example code snippet exhibiting a few APIs within the package. Do not
   include the `@example` tag. See
   [Example code snippets](#example-code-snippets) below for further guidance.
1. A [`@module`](https://jsdoc.app/tags-module) tag to declare as module
   documentation.

See the source code for
[`@std/bytes/mod.ts`](https://github.com/denoland/deno_std/blob/main/bytes/mod.ts)
as an example.

### Example code snippets

Example code snippets must:

1. Be as simple yet readable as possible. When in doubt, refer to MDN's
   [Guidelines for writing JavaScript code examples](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Writing_style_guide/Code_style_guide/JavaScript).
1. Be reproducible as a copied and pasted script.
1. Use an assertion from [`@std/assert`](https://jsr.io/@std/assert), when
   possible. Snippets are run using
   [`deno eval`](https://docs.deno.com/runtime/manual/tools/eval) in the
   [documentation checker tool](../_tools/check_docs.ts) and are flagged when
   they throw an error.

Note: To skip running a specific code snippet, add `no-eval` to the starting
delimiter. E.g.

````ts
/**
 * ```ts no-eval
 * (code snippet will not be run)
 * ```
 */
````
