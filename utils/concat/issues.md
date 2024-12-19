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

ignore concat.txt since this is the output of a previous run of this tool.

allow --tokens to only count the tokens and not write an actual concat.txt file.

should allow a preselection of purposes to include some base prompts with the
concat as well as the project contents.

optionally pull in the import map if in a monorepo, and the base rules. If we
have a format for putting rules in somewhere known, it can navigate appropriate
files and pull them in. Be like .concat-rules which gives it some command line
options when it runs.

.concat-rules should say what should specially be ignored as well ?

honour .gitignore all the way up to the root of the repo.

BEGIN FILE should maybe be a single name, and end in a colon, making it plain
that it is a key attribute, and separate from the file name.

If I run `concat . ../../reasoner/PROJECT_MAP_INSTRUCTIONS.md` then it does not
pull in everything recursively from . however seems to be shell globbing again

Should supply a file system overview in the concat, optionally
