---
target: agents/system.md
assessor: agents/test-assessor.md
---

These tests are about the ability to update the main natural language repo that
drives the Dreamcatcher based on a single command. The tests extend into
updating any repo in any branch from a remote github repo.

## List the main branch

**Prompts**

```md
What is the main branch ?
```

**Expectations**

- main branch is reported as 'main'

## Pull into main branch of HAL from github

With a single command we should be able to pull from the github repo that this
repo was cloned from, and update the main branch.

**Prompts**

```md
Pull from github
```

**Expectations**

- the main branch is updated to the same commit as the remote
- we were not in the main branch, but the pull was done on the main branch

## Update into not the main branch

We should be able to pull into any branch we might like to.

**Prompts**

```md
```

## Pull from a parent branch into a child

## Error on invalid repo

If the repo we are in has no equivalent on github then we should see an error
**Prompts**

```md
Init a new repo named `this-repo/does-not-exist4345`, then pull the latest
updates from github for it.
```

**Expectations**

- this should fail with an error mentioning how the repo does not exist
- some remedial steps should be suggested

## Operate on a remote repo

If the repo we want to operate on is not the one we are currently in, then we
need to be able to operate on it remotely

**Before**

- [Clone a remote repo](#clone-a-remote-repo)

**Prompts**

```md
Check the latest head commit and then pull the latest updates for
`dreamcatcher-tech/test`
```

**Expectations**

- a pull was executed on the remote repo
- no changes were found on the remote server
- the head commit of the remote repo remains the same

## Clone a remote repo

Clone from github into a new repo, from the repo `dreamcatcher-tech/test`. This
will result in a new repoId. The repo must not already be cloned for the user,
so we need to check that is the case first

**Prompts**

```md
Delete the repo `dreamcatcher-tech/test` then clone a new repo from
`dreamcatcher-tech/test` using github
```

**Expectations**

- there is at least one repo now that was cloned from `dreamcatcher-tech/test`

## Step 1

**Prompts**

```md
do the first thing
```

**Expectations**

- the first thing is done

## Step 2

**Before** [Step 1](#step-1)

**Prompts**

```md
do step 2
```

**Expectations**

- is step 2 done

## Final

**Before** [Step 2](#step-2)

**Expectations**

- overall expectations of all steps

## Another multi step test

## Step N

**Invoke** [Step 2](#step-2)
