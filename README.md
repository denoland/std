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
- Click "View Documentation".
- Navigate to any module of interest.

## Contributing

Check out the contributing guidelines [here](./CONTRIBUTING.md).