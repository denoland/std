# Concat

A CLI tool that concatenates the contents of specified files, directories, and
glob patterns into a single output. Files are wrapped in ASCII armor style
headers and footers to clearly delimit them.

## Features

- Accepts multiple files, directories, and glob patterns.
- Recursively includes directory contents if the directory path or glob includes
  `**`.
- Outputs file contents with `-----BEGIN FILE ...-----` and
  `-----END FILE ...-----` delimiters.
- Optional `--output FILE` argument to write output to a file; otherwise prints
  to stdout.
- When `--output` is used, after processing, it prints a summary including:
  1. A list of processed files
  2. A count of the total files processed
  3. The token count in the `o1-preview` encoding

## Usage

```sh
concat [options] [file|folder|glob ...]

Options:
  --help
      Show the help message and exit.
      
  --output FILE
      Write output to FILE. If omitted, output goes to stdout.

If directories are provided, their contents are included recursively.
Glob patterns are expanded to include matched files recursively.

Note: When using glob patterns, you may need to quote them to prevent shell expansion:
  concat "src/**/*.ts"    # Correct: glob is passed to concat
  concat src/**/*.ts     # May fail: shell expands glob before concat runs
```

## Example

```sh
# Without output file (prints to stdout)
concat src/**/*.ts

# With output file (prints summary after processing)
concat --output out.txt ../reasoning/**/*.md
```

After running the second example, you'll see output like:

- The list of processed files
- A count of how many files were processed
- A final message including the token count in out.txt.

## Requirements

- Deno (latest stable)
- Permissions:
  - `--allow-read` to read files
  - `--allow-write` if using `--output` option

## Installing as a CLI command

```sh
deno install --global --allow-read --allow-write --allow-net=jsr.io jsr:@dreamcatcher/concat
```

After this, `concat` will be available as a system-wide command.

> Note: The `--allow-net` permission is required to check for package updates
> from the jsr.io registry.

## Upgrading the CLI command

```sh
deno install --global --reload --force --allow-read --allow-write --allow-net=jsr.io jsr:@dreamcatcher/concat
```
