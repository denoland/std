# Contribution Guide

First, thank you for being interested in contributing! We hope this page helps as a guide. When in doubt, look at the files
in this folder, read through issues and PRs regarding the `collections` module or visit the [#deno-std channel on our Discord]
(https://discord.gg/Ub9bRxHv) and ask.

## Philosophy

Currently, those are the general ideas behind how the module is implemented:

- Provide a clear, specific toolbox and vocabulary for common tasks with `Array`s and `Record`s
- Optimize each specific tasks for maximum runtime and memory efficiency
- Offer only pure functions, never mutate given arguments, always return a new value
- Accept and return `Array`s and `Record`s - we are optimizing for the most common use cases and
leave more general approaches to the [ES iterator helpers proposal](https://github.com/tc39/proposal-iterator-helpers)
for now
- Some implementations for common tasks are pretty trivial - this is fine. It still provides a readable vocabulary to
express a common task, is as optimized as possible and helps newcomers. Be aware that it might not be everyones style
to use small functions and we do not want to change that, just offer a way to do so if desired
- All functions can be imported in isolation to reduce bundle size if important
- All functions are implemented in Typescript

## Contribution Checklist

If you want to post a PR, this checklis might help you to speed up the process by solving most common review comments upfront.

- Did you support importing from `mod.ts` as well as your functions file?
- Have you made sure to allocate as little memory and do as little steps in your algorithm as possible?
- Did you add/adapt JSDoc comments, add/adapt an example, made sure that the example uses the `ts` markdown tag and `assertEquals` to show the result?
- Did you add/adapt your functions documentation in `README.md`?
- Did you make sure **not** to mutate the arguments passe to your function?
- Did you add tests ensuring no mutation, empty input and corner cases?
- Are your types flat, meaning there is no unnecessary alias in them that makes your users "go to type definition" twice
to understand what to pass?
