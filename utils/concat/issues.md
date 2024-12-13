Does not ignore .pdf by default

Default is not recursive, but maybe that is correct, and maybe it should have a
-r flag to make it recursive.

Use https://www.npmjs.com/package/git-diff to pull up diffs. Allow arbitrarily
many diffs to be compared, with each other, or with a single commit. Used with
concat to ask the model to reason about what has changed between different
things. Takes advantage of the snapshots history that is part of the napp
format.

concat **/so-what.md does not recurse into subdirectories unless you quote the
glob. The shell is actually our problem, and we should work around it.

passing in a folder path does not recurse it - this might be the shell problem
tho.

concat should show what its args were at the start, so we can see what the shell
processed.
