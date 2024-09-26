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

## Suggesting a new feature

When new features are accepted, they are initially accepted as 'unstable'
features in the Standard Library. These features are later stabilized after
receiving sufficient feedback from the community and the core team.

### New features in stable packages (version >= 1.0.0)

If you suggest new APIs in stable packages, which have the version above 1.0.0,
you need to implment that API in the file paths of the pattern
`./unstable_<api_name>`, and the API shouldn't exported from the root module
(`mod.ts`). This is to make it clear which API is stable and which is not.

Example:

```
encoding
├── base32.ts                      <--- stable API
├── base64.ts                      <--- stable API
├── base64url.ts                   <--- stable API
├── hex.ts                         <--- stable API
├── mod.ts                         <--- stable API
├── unstable_base32_stream.ts      <--- unstable API
├── unstable_base32hex.ts          <--- unstable API
└── unstable_base32hex_stream.ts   <--- unstable API
```

### New features in unstable packages (version < 1.0.0)

There's no special rules to new features in unstable packages. Write new APIs
and send a pull request.

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

## Implementations

### Assertions

Do not use assertions from [`@std/assert`](https://jsr.io/@std/assert) to assert
values in implementation code. Instead, check values inline. `@std/assert`
functions should only be used in testing. See #4865 for details.

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

Note: To skip running a specific code snippet, add `ignore` to the starting
delimiter. E.g.

````ts
/**
 * ```ts ignore
 * (code snippet will not be run)
 * ```
 */
````

You can also write code snippets that are expected to fail either at compile
time or at runtime by adding `expect-error`. However, if the fenced code is
supposed to not pass type checking, you may also want to specify `ignore`
directive, because we run `deno test --doc` command in CI, which does type
checking against fenced code snippets except for those with `ignore` directive.
So concrete examples are:

````ts
/**
 * ```ts expect-error ignore
 * // Does not pass type checking
 * const x: string = 1;
 * ```
 *
 * ```ts expect-error
 * import { assert } from "@std/assert/assert";
 *
 * // Fails at runtime
 * assert(false);
 * ```
 */
````

### Notices for unstable APIs

Each unstable API must have the
[`@experimental`](https://tsdoc.org/pages/tags/experimental/) TSDoc tag after
the starting description.

```ts
/**
 * <description>
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * ...
 */
```

### Error Messages

User-facing error messages should be clear, concise, and consistent. Error
messages should be in sentence case but should not end with a period. Error
messages should be free of grammatical errors and typos and written in American
English.

> ⚠️ Note that the error message style guide is a work in progress, and not all
> the error messages have been updated to conform to the current styles. Error
> message styles that should be followed:

1. Messages should start with an upper case:

```
Bad: cannot parse input
Good: Cannot parse input
```

2. Messages should not end with a period:

```
Bad: Cannot parse input.
Good: Cannot parse input
```

3. Message should use quotes for values for strings:

```
Bad: Cannot parse input hello, world
Good: Cannot parse input "hello, world"
Good: Attempting to grow buffer by 10 bytes, which would exceed the maximum size of 100 bytes
```

4. Message should state the action that lead to the error:

```
Bad: Invalid input x
Good: Cannot parse input x
```

5. Active voice should be used:

```
Bad: Input x cannot be parsed
Good: Cannot parse input x
```

6. Messages should not use contractions:

```
Bad: Can't parse input x
Good: Cannot parse input x
```

7. Messages should use a colon when providing additional information. Periods
   should never be used. Other punctuation may be used as needed:

```
Bad: Cannot parse input x. value is empty
Good: Cannot parse input x: value is empty
```

8. Additional information should describe the current state, if possible, it
   should also describe the desired state in an affirmative voice:

```
Bad: Cannot compute the square root for x: value must not be negative
Good: Cannot compute the square root for x: current value is ${x}
Better: Cannot compute the square root for x as x must be >= 0: current value is ${x}
```

#### Exceptions

The assertion package uses periods to end sentences in error messages. There are
a number of downstream packages that expect this behavior and changing it would
be a breaking change.
