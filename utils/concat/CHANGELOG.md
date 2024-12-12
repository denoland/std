# CHANGELOG

## v0.0.6

- empty version bump to test the version check feature

## v0.0.5

- Added version check feature that notifies users when a newer version is
  available on JSR.

## v0.0.4

- Changed default behavior to write output to `concat.txt` if `--output` is not
  specified.
- Added `--stdout` mode to produce raw output without info messages.
- Expanded default ignore list to include
  `.lock, .git, .gitignore, LICENSE, concat.txt`.
- By default, now only includes `*.ts, *.tsx, *.js, *.jsx, *.md, *.txt` files.
- Added `--ignore` option to specify additional globs to ignore.
- Improved token counting output and message indicating if the file was created
  or updated.
