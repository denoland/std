# Deno Standard Modules

[![codecov](https://codecov.io/gh/denoland/deno_std/branch/main/graph/badge.svg?token=w6s3ODtULz)](https://codecov.io/gh/denoland/deno_std)

These modules do not have external dependencies and they are reviewed by the
Deno core team. The intention is to have a standard set of high quality code
that all Deno projects can use fearlessly.

Contributions are welcome!

## Releases

Standard library is currently tagged independently of Deno version. This will
change once the library is stabilized.

To check compatibility of different version of standard library with Deno CLI
see
[this list](https://raw.githubusercontent.com/denoland/dotland/main/versions.json).

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

After cloning don't forget to `git submodule update --init`.

Before opening a PR make sure to:

- have the latest Deno version installed locally
- add tests that cover your changes.
- `deno task test` passes.
- `deno fmt` passes without changing files.
- `deno lint` passes.

Give the PR a descriptive title.

Examples of good titles:

- fix(http): Fix race condition in server
- docs(fmt): Update docstrings
- feat(log): Handle nested messages

Examples of bad titles:

- fix #7123
- update docs
- fix bugs

Ensure there is a related issue and it is referenced in the PR text.

For contributions to the Node compatibility library please check the
[`std/node` contributing guide](./node/README.md)

_About CI checks_:

We currently have 9 checks on CI. Each PR should pass all of these checks to be
accepted.

- test with Deno canary on Windows
- test with Deno canary on Linux
- test with Deno canary on macOS
- test Node polyfill with Deno canary on Windows
- test Node polyfill with Deno canary on Linux
- test Node polyfill with Deno canary on macOS
- lint
- wasm crypto check
- CLA

_Typechecking code in Markdown files_:

If you want to run `deno test --doc x.md` you will need to specify the flag
`--import-map=test_import_map.json`, this import map is in the root of deno_std.

_For maintainers_:

To release a new version a tag in the form of `x.y.z` should be added.
