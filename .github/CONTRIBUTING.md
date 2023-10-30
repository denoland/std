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

1. For and clone the repository.
1. Create a new branch for your changes.
1. Make your changes and ensure `deno task ok` passes successfully.
1. Commit your changes with clear messages.
1. Submit a pull request with a clear description of your changes and reference
   any relevant issues.

## Development Setup

1. [Install the Deno CLI](https://docs.deno.com/runtime/manual/getting_started/installation).
1. After cloning, set up git submodules:
   ```bash
   git submodule update --init
   ```
1. Run `deno task ok` to ensure everything's working before making changes.
