# Deno Standard Modules

These modules do not have external dependencies and they are reviewed by the
Deno core team. The intention is to have a standard set of high quality code
that all Deno projects can use fearlessly.

Contributions are welcome!

## Releases

Standard library is currently tagged independently of Deno version. This will
change once the library is stabilized.

To check compatibility of different version of standard library with Deno CLI
see
[this list](https://raw.githubusercontent.com/denoland/deno_website2/master/versions.json).

## How to use

These modules will eventually be tagged in accordance with Deno releases but as
of today we do not yet consider them stable and so we version the standard
modules differently from the Deno runtime to reflect this.

It is strongly recommended that you link to tagged releases to avoid unintended
updates and breaking changes.

Don't link to / import any module whose path:

- Has a name or parent with an underscore prefix: `_foo.ts`, `_util/bar.ts`.
- Is that of a test module or test data: `test.ts`, `foo_test.ts`,
  `testdata/bar.txt`.

Don't import any symbol with an underscore prefix: `export function _baz() {}`.

These elements are not considered part of the public API, thus no stability is
guaranteed for them.

## Documentation

To browse documentation for modules:

- Go to https://deno.land/std/.
- Navigate to any module of interest.
- Click "View Documentation".

## Contributing

**NOTE: This repository was unarchived and synced on Feb, 1st, 2021. If you
already had it cloned, we suggest to do a fresh clone to avoid git conflicts.**

deno_std is a loose port of [Go's standard library](https://golang.org/pkg/).
When in doubt, simply port Go's source code, documentation, and tests. There are
many times when the nature of JavaScript, TypeScript, or Deno itself justifies
diverging from Go, but if possible we want to leverage the energy that went into
building Go. We generally welcome direct ports of Go's code.

Please ensure the copyright headers cite the code's origin.

Follow the [style guide](https://deno.land/manual/contributing/style_guide).

### Opening a pull request

Before opening a PR make sure to:

- there are tests that cover the changes.
- `deno test --unstable --allow-all` passes.
- `deno fmt --check` passes without changing files.
- `deno lint --unstable` passes.

Give the PR a descriptive title.

Examples of good title:

- fix(http): Fix race condition in server
- docs(fmt): Update docstrings
- feat(log): Handle nested messages

Examples of bad title:

- fix #7123
- update docs
- fix bugs

Ensure there is a related issue and it is referenced in the PR text.

_For maintainers_:

To release a new version a tag in the form of `x.y.z` should be added.
